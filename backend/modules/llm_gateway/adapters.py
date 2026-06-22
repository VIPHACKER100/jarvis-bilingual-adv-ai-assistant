"""
Provider adapters for LLM Gateway.

Each adapter wraps a specific LLM provider and exposes:
- generate() for non-streaming
- generate_stream() for streaming
- get_embedding() for embeddings (optional)
"""

import os
import time
import asyncio
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, AsyncGenerator
from dataclasses import dataclass
from pathlib import Path

import httpx
from openai import OpenAI

from utils.logger_structured import logger
from modules.llm_gateway.cost import cost_tracker
from modules.llm_gateway.circuit import CircuitBreaker


@dataclass
class ProviderConfig:
    api_key: Optional[str] = None
    model: str = ""
    fallback_models: List[str] = None
    timeout: float = 30.0
    max_tokens: int = 4096
    temperature: float = 0.7


class ProviderAdapter(ABC):
    def __init__(self, name: str, config: ProviderConfig):
        self.name = name
        self.config = config
        self.circuit = CircuitBreaker()

    @abstractmethod
    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        ...

    @abstractmethod
    async def generate_stream(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        ...

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        return None

    def is_available(self) -> bool:
        return bool(self.config.api_key) and self.circuit.is_available()


class NvidiaAdapter(ProviderAdapter):
    def __init__(self, config: ProviderConfig):
        super().__init__("nvidia", config)
        self._client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=config.api_key
        ) if config.api_key else None

    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        if not self._client:
            return None

        model = kwargs.get("model", self.config.model)
        start = time.time()

        try:
            def _call():
                return self._client.chat.completions.create(
                    model=model,
                    messages=messages,
                    temperature=kwargs.get("temperature", self.config.temperature),
                    max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
                    top_p=0.95,
                    stream=False,
                    extra_body={"chat_template_kwargs": {"thinking": False}},
                )

            completion = await asyncio.to_thread(_call)
            content = completion.choices[0].message.content.strip()
            elapsed = (time.time() - start) * 1000

            prompt_toks = completion.usage.prompt_tokens if completion.usage else 0
            comp_toks = completion.usage.completion_tokens if completion.usage else 0

            cost_tracker.record(self.name, model, prompt_toks, comp_toks, elapsed, success=True)
            self.circuit.record_success()
            return content

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            cost_tracker.record(self.name, model, latency_ms=elapsed, success=False)
            self.circuit.record_failure()
            logger.error(f"NVIDIA API error: {e}")
            return None

    async def generate_stream(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        if not self._client:
            yield "Error: NVIDIA not configured."
            return

        model = kwargs.get("model", self.config.model)
        try:
            def _call():
                return self._client.chat.completions.create(
                    model=model, messages=messages,
                    temperature=kwargs.get("temperature", self.config.temperature),
                    max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
                    stream=True,
                )

            completion = await asyncio.to_thread(_call)
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

            self.circuit.record_success()
        except Exception as e:
            logger.error(f"NVIDIA stream error: {e}")
            yield f"Error: {e}"

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        if not self._client:
            return None
        try:
            def _call():
                return self._client.embeddings.create(
                    input=[text],
                    model=os.getenv("NVIDIA_EMBEDDING_MODEL", "nvidia/llama-3.2-nv-embedqc-v1")
                )
            response = await asyncio.to_thread(_call)
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"NVIDIA embedding error: {e}")
            return None


class OpenRouterAdapter(ProviderAdapter):
    def __init__(self, config: ProviderConfig):
        super().__init__("openrouter", config)
        self._client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=config.api_key
        ) if config.api_key else None
        self._fallback_models = config.fallback_models or []

    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        if not self._client:
            return None

        models = [kwargs.get("model", self.config.model)] + self._fallback_models
        start = time.time()

        for model in models:
            try:
                def _call(model=model):
                    return self._client.chat.completions.create(
                        model=model, messages=messages,
                        temperature=kwargs.get("temperature", self.config.temperature),
                        max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
                    )

                completion = await asyncio.to_thread(_call)
                content = completion.choices[0].message.content.strip()
                elapsed = (time.time() - start) * 1000

                prompt_toks = completion.usage.prompt_tokens if completion.usage else 0
                comp_toks = completion.usage.completion_tokens if completion.usage else 0

                cost_tracker.record(self.name, model, prompt_toks, comp_toks, elapsed, success=True)
                self.circuit.record_success()
                return content

            except Exception as e:
                logger.warning(f"OpenRouter model {model} failed: {e}")
                continue

        elapsed = (time.time() - start) * 1000
        cost_tracker.record(self.name, self.config.model, latency_ms=elapsed, success=False)
        self.circuit.record_failure()
        return None

    async def generate_stream(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        if not self._client:
            yield "Error: OpenRouter not configured."
            return

        model = kwargs.get("model", self.config.model)
        try:
            def _call():
                return self._client.chat.completions.create(
                    model=model, messages=messages, stream=True,
                )

            completion = await asyncio.to_thread(_call)
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            self.circuit.record_success()
        except Exception as e:
            logger.error(f"OpenRouter stream error: {e}")
            yield f"Error: {e}"


class OpenAIAdapter(ProviderAdapter):
    def __init__(self, config: ProviderConfig):
        super().__init__("openai", config)
        self._client = OpenAI(api_key=config.api_key) if config.api_key else None

    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        if not self._client:
            return None

        start = time.time()
        try:
            def _call():
                return self._client.chat.completions.create(
                    model=kwargs.get("model", self.config.model),
                    messages=messages,
                    temperature=kwargs.get("temperature", self.config.temperature),
                    max_tokens=kwargs.get("max_tokens", self.config.max_tokens),
                )

            completion = await asyncio.to_thread(_call)
            content = completion.choices[0].message.content.strip()
            elapsed = (time.time() - start) * 1000

            prompt_toks = completion.usage.prompt_tokens if completion.usage else 0
            comp_toks = completion.usage.completion_tokens if completion.usage else 0

            cost_tracker.record(self.name, self.config.model, prompt_toks, comp_toks, elapsed, success=True)
            self.circuit.record_success()
            return content

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            cost_tracker.record(self.name, self.config.model, latency_ms=elapsed, success=False)
            self.circuit.record_failure()
            logger.error(f"OpenAI API error: {e}")
            return None

    async def generate_stream(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        if not self._client:
            yield "Error: OpenAI not configured."
            return
        try:
            def _call():
                return self._client.chat.completions.create(
                    model=kwargs.get("model", self.config.model),
                    messages=messages, stream=True,
                )
            completion = await asyncio.to_thread(_call)
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
            self.circuit.record_success()
        except Exception as e:
            logger.error(f"OpenAI stream error: {e}")
            yield f"Error: {e}"

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        if not self._client:
            return None
        try:
            def _call():
                return self._client.embeddings.create(
                    input=[text],
                    model=os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
                )
            response = await asyncio.to_thread(_call)
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            return None


class OllamaAdapter(ProviderAdapter):
    def __init__(self, config: ProviderConfig):
        super().__init__("ollama", config)
        self._base_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")

    async def generate(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        start = time.time()
        try:
            payload = {
                "model": kwargs.get("model", self.config.model),
                "messages": messages,
                "stream": False,
            }
            async with httpx.AsyncClient() as client:
                response = await client.post(self._base_url, json=payload, timeout=60.0)

            if response.status_code == 200:
                data = response.json()
                content = data.get("message", {}).get("content", "").strip()
                elapsed = (time.time() - start) * 1000
                cost_tracker.record(self.name, self.config.model, latency_ms=elapsed, success=True)
                self.circuit.record_success()
                return content or None

            logger.error(f"Ollama error {response.status_code}: {response.text}")
            self.circuit.record_failure()
            return None

        except Exception as e:
            elapsed = (time.time() - start) * 1000
            cost_tracker.record(self.name, self.config.model, latency_ms=elapsed, success=False)
            self.circuit.record_failure()
            logger.error(f"Ollama exception: {e}")
            return None

    async def generate_stream(self, messages: List[Dict[str, str]], **kwargs) -> AsyncGenerator[str, None]:
        payload = {
            "model": kwargs.get("model", self.config.model),
            "messages": messages,
            "stream": True,
        }
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", self._base_url, json=payload, timeout=60.0) as response:
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
