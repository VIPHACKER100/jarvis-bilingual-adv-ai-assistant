"""
JARVIS — LLM Client (single file, single provider pattern)
Merges the old 4-file llm_gateway into ~100 lines.
"""

import json
import os
import time
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx
from openai import AsyncOpenAI
from utils.logger_structured import logger

SYSTEM_PROMPT_TEMPLATE = """You are JARVIS, a highly intelligent and helpful AI assistant.
Respond in {language}.
Keep responses concise — 1-3 sentences for quick queries, longer for complex topics.
Be honest about limitations.
Capabilities: system commands, web search, code assistance, general conversation, and research.

{extra_context}"""


class LLMClient:
    def __init__(self):
        self._client: Optional[AsyncOpenAI] = None
        self._ollama_client: Optional[httpx.AsyncClient] = None
        self._active_provider: Optional[str] = None
        self._setup()

    def _setup(self):
        providers = [
            ("openrouter", os.getenv("OPENROUTER_API_KEY") or os.getenv("VITE_JARVIS_API_KEY"), "https://openrouter.ai/api/v1"),
            ("openai", os.getenv("OPENAI_API_KEY"), "https://api.openai.com/v1"),
            ("google", os.getenv("GOOGLE_API_KEY"), "https://generativelanguage.googleapis.com/v1beta/openai"),
            ("nvidia", os.getenv("NVIDIA_API_KEY"), "https://integrate.api.nvidia.com/v1"),
        ]
        for name, key, base_url in providers:
            if key:
                self._client = AsyncOpenAI(base_url=base_url, api_key=key, timeout=httpx.Timeout(45.0))
                self._active_provider = name
                return

        self._ollama_client = httpx.AsyncClient(timeout=httpx.Timeout(60.0))
        self._active_provider = "ollama"

    def _build_messages(self, text: str, system_prompt: str, context: Optional[str] = None,
                        history: Optional[List[Dict]] = None) -> List[Dict[str, str]]:
        full_system = system_prompt
        if context:
            full_system += f"\n\nCONTEXT:\n{context}"
        messages = [{"role": "system", "content": full_system}]
        if history:
            messages.extend(history)
        messages.append({"role": "user", "content": text})
        return messages

    def _language_desc(self, language: str) -> str:
        return {"en": "English", "hi": "Hindi (Devanagari script)", "hinglish": "Hinglish"}.get(language, "English")

    async def chat(self, text: str, language: str = "en", context: Optional[str] = None,
                   history: Optional[List[Dict]] = None, max_tokens: Optional[int] = None,
                   temperature: Optional[float] = None, model: Optional[str] = None) -> Optional[str]:
        lang_desc = self._language_desc(language)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(language=lang_desc, extra_context=context or "")
        messages = self._build_messages(text, system_prompt, context, history)
        model_name = model or os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")

        if self._client:
            try:
                start = time.time()
                completion = await self._client.chat.completions.create(
                    model=model_name, messages=messages,
                    temperature=temperature or 0.7, max_tokens=max_tokens or 4096,
                )
                elapsed_ms = (time.time() - start) * 1000
                content = (completion.choices[0].message.content or "").strip()
                prompt_toks = completion.usage.prompt_tokens if completion.usage else 0
                comp_toks = completion.usage.completion_tokens if completion.usage else 0
                # One-liner cost tracking
                logger.debug(f"LLM {model_name}: {prompt_toks}+{comp_toks}tok, {elapsed_ms:.0f}ms")
                return content
            except Exception as e:
                logger.error(f"LLM chat failed: {e}")
                return None

        # Fallback to Ollama
        if self._ollama_client:
            try:
                payload = {"model": os.getenv("OLLAMA_MODEL", "llama3"), "messages": messages, "stream": False}
                resp = await self._ollama_client.post(os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat"), json=payload)
                if resp.status_code == 200:
                    return resp.json().get("message", {}).get("content", "").strip()
            except Exception as e:
                logger.error(f"Ollama failed: {e}")
        return None

    async def chat_stream(self, text: str, language: str = "en", context: Optional[str] = None,
                          history: Optional[List[Dict]] = None, **kwargs) -> AsyncGenerator[str, None]:
        lang_desc = self._language_desc(language)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(language=lang_desc, extra_context=context or "")
        messages = self._build_messages(text, system_prompt, context, history)

        if self._client:
            try:
                stream = await self._client.chat.completions.create(
                    model=os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001"),
                    messages=messages, stream=True,
                )
                async for chunk in stream:
                    if chunk.choices and chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            except Exception as e:
                logger.error(f"Stream error: {e}")
                yield f"Error: {e}"
            return

        if self._ollama_client:
            payload = {"model": os.getenv("OLLAMA_MODEL", "llama3"), "messages": messages, "stream": True}
            try:
                async with self._ollama_client.stream("POST", os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat"), json=payload) as resp:
                    async for line in resp.aiter_lines():
                        if not line: continue
                        data = json.loads(line)
                        if "message" in data:
                            yield data["message"]["content"]
                        if data.get("done"): break
            except Exception as e:
                logger.error(f"Ollama stream error: {e}")
                yield f"Error: {e}"

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        if not self._client:
            return None
        try:
            resp = await self._client.embeddings.create(
                input=[text], model=os.getenv("NVIDIA_EMBEDDING_MODEL", "text-embedding-3-small")
            )
            return resp.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding error: {e}")
            return None

    async def ping(self) -> bool:
        try:
            result = await self.chat("ping", context="Respond ONLY with 'pong'", max_tokens=10)
            return result is not None and "pong" in result.lower()
        except Exception:
            return False

    @property
    def active_provider(self) -> Optional[str]:
        return self._active_provider

    @property
    def available(self) -> bool:
        return self._client is not None or self._ollama_client is not None


llm_client = LLMClient()
