"""
Provider adapters for LLM Gateway.

Each adapter wraps a specific LLM provider and exposes:
- generate() for non-streaming
- generate_stream() for streaming
- get_embedding() for embeddings (optional)
"""

import json
import os
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import AsyncGenerator, Dict, List, Optional

import httpx
from modules.llm_gateway.circuit import CircuitBreaker
from modules.llm_gateway.cost import cost_tracker
from openai import AsyncOpenAI
from utils.logger_structured import logger


@dataclass
class ProviderConfig:
    api_key: Optional[str] = None
    model: str = ""
    fallback_models: List[str] = None
    timeout: float = 30.0
    max_tokens: int = 4096
    temperature: float = 0.7
    base_url: Optional[str] = None
    extra_body: Optional[Dict] = None


class ProviderAdapter(ABC):
    def __init__(self, name: str, config: ProviderConfig):
        self.name = name
        self.config = config
        self.circuit = CircuitBreaker()

    @abstractmethod
    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]: ...

    @abstractmethod
    async def generate_stream(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]: ...

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        return None

    def is_available(self) -> bool:
        return bool(self.config.api_key) and self.circuit.is_available()


class OpenAICompatibleAdapter(ProviderAdapter):
    """Single adapter for any OpenAI-compatible provider (NVIDIA, OpenRouter, OpenAI, Google)."""

    def __init__(
        self,
        name: str,
        config: ProviderConfig,
        base_url: str,
        has_embeddings: bool = False,
        extra_body: Optional[Dict] = None,
    ):
        super().__init__(name, config)
        self._client = (
            AsyncOpenAI(
                base_url=base_url,
                api_key=config.api_key,
                timeout=httpx.Timeout(config.timeout),
            )
            if config.api_key
            else None
        )
        self._has_embeddings = has_embeddings
        self._extra_body = extra_body

    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        if not self._client:
            return None
        models = [kwargs.get("model", self.config.model)] + (self.config.fallback_models or [])
        start = time.time()
        last_model = self.config.model
        for model in models:
            last_model = model
            try:
                completion = await self._client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=kwargs.get("temperature", self.config.temperature),
                    max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
                    extra_body=self._extra_body,
                )
                content = (completion.choices[0].message.content or "").strip()
                elapsed = (time.time() - start) * 1000
                prompt_toks = completion.usage.prompt_tokens if completion.usage else 0
                comp_toks = completion.usage.completion_tokens if completion.usage else 0
                cost_tracker.record(self.name, model, prompt_toks, comp_toks, elapsed, success=True)
                self.circuit.record_success()
                return content
            except Exception as e:
                logger.warning(f"{self.name} model {model} failed: {e}")
                continue
        elapsed = (time.time() - start) * 1000
        cost_tracker.record(self.name, last_model, latency_ms=elapsed, success=False)
        self.circuit.record_failure()
        return None

    async def generate_stream(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        if not self._client:
            yield f"Error: {self.name} not configured."
            return
        model = kwargs.get("model", self.config.model)
        try:
            stream = await self._client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True,
                extra_body=self._extra_body,
            )
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            self.circuit.record_success()
        except Exception as e:
            logger.error(f"{self.name} stream error: {e}")
            yield f"Error: {e}"

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        if not self._client or not self._has_embeddings:
            return None
        try:
            response = await self._client.embeddings.create(
                input=[text], model=os.getenv(f"{self.name.upper()}_EMBEDDING_MODEL", "text-embedding-3-small")
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"{self.name} embedding error: {e}")
            return None


class GoogleAdapter(OpenAICompatibleAdapter):
    """Adapter for Google Gemini via OpenAI-compatible endpoint."""

    def __init__(self, config: ProviderConfig):
        super().__init__(
            name="google",
            config=config,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            has_embeddings=True,
            extra_body=None,
        )

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        if not self._client or not self._has_embeddings:
            return None
        try:
            response = await self._client.embeddings.create(
                input=[text], model=os.getenv("GOOGLE_EMBEDDING_MODEL", "text-embedding-004")
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"google embedding error: {e}")
            return None


class OllamaAdapter(ProviderAdapter):
    def __init__(self, config: ProviderConfig):
        super().__init__("ollama", config)
        self._base_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
        self._client = httpx.AsyncClient(timeout=httpx.Timeout(60.0))

    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        model = kwargs.get("model", self.config.model)
        start = time.time()
        try:
            payload = {
                "model": model,
                "messages": messages,
                "stream": False,
            }
            response = await self._client.post(self._base_url, json=payload)

            if response.status_code == 200:
                data = response.json()
                content = data.get("message", {}).get("content", "").strip()
                elapsed = (time.time() - start) * 1000
                cost_tracker.record(self.name, model, latency_ms=elapsed, success=True)
                self.circuit.record_success()
                return content or None

            logger.error(f"Ollama error {response.status_code}: {response.text}")
            elapsed = (time.time() - start) * 1000
            cost_tracker.record(self.name, model, latency_ms=elapsed, success=False)
            self.circuit.record_failure()
            return None

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            cost_tracker.record(self.name, model, latency_ms=elapsed, success=False)
            self.circuit.record_failure()
            logger.error(f"Ollama exception: {e}")
            return None

    async def generate_stream(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        model = kwargs.get("model", self.config.model)
        payload = {
            "model": model,
            "messages": messages,
            "stream": True,
        }
        try:
            async with self._client.stream("POST", self._base_url, json=payload) as response:
                async for line in response.aiter_lines():
                    if not line:
                        continue
                    data = json.loads(line)
                    if "message" in data:
                        yield data["message"]["content"]
                    if data.get("done"):
                        break
            self.circuit.record_success()
        except Exception as e:
            logger.error(f"Ollama stream error: {e}")
            yield f"Error: {e}"
