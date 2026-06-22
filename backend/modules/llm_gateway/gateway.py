"""
LLM Gateway — unified entry point for all LLM interactions.
Auto-selects provider, handles failover, tracks costs.
"""

import os
import json
import time
from typing import Dict, Any, Optional, List, AsyncGenerator
from pathlib import Path

from utils.logger_structured import logger
from config import LLM_PROVIDER

from modules.llm_gateway.adapters import (
    ProviderAdapter, ProviderConfig,
    NvidiaAdapter, OpenRouterAdapter, OpenAIAdapter, OllamaAdapter,
)
from modules.llm_gateway.cost import cost_tracker


SYSTEM_PROMPT_TEMPLATE = """You are JARVIS, a highly intelligent and helpful AI assistant.
Respond in {language}.
Keep responses concise — 1-3 sentences for quick queries, longer for complex topics.
Be honest about limitations.
Capabilities: system commands, web search, code assistance, general conversation, and research.

{extra_context}"""


class LLMGateway:
    def __init__(self):
        self._providers: Dict[str, ProviderAdapter] = {}
        self._provider_order: List[str] = []
        self._active_provider: Optional[str] = None
        self._setup_providers()

    def _setup_providers(self):
        nvidia_key = os.getenv("NVIDIA_API_KEY")
        openrouter_key = os.getenv("OPENROUTER_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")

        if nvidia_key:
            self._providers["nvidia"] = NvidiaAdapter(ProviderConfig(
                api_key=nvidia_key,
                model=os.getenv("NVIDIA_MODEL", "deepseek-ai/deepseek-v4-pro"),
                fallback_models=["deepseek-ai/deepseek-v4-pro"],
                timeout=45,
                max_tokens=16384,
            ))

        if openrouter_key:
            self._providers["openrouter"] = OpenRouterAdapter(ProviderConfig(
                api_key=openrouter_key,
                model=os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001"),
                fallback_models=[
                    "google/gemini-2.0-flash-lite-preview-02-05",
                    "deepseek/deepseek-r1",
                    "mistralai/mistral-7b-instruct",
                    "openrouter/auto",
                ],
                timeout=30,
            ))

        if openai_key:
            self._providers["openai"] = OpenAIAdapter(ProviderConfig(
                api_key=openai_key,
                model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
                max_tokens=4096,
            ))

        self._providers["ollama"] = OllamaAdapter(ProviderConfig(
            model=os.getenv("OLLAMA_MODEL", "llama3"),
            timeout=60,
        ))

        preferred = LLM_PROVIDER
        if preferred in self._providers:
            self._provider_order = [preferred]
            self._provider_order.extend(
                p for p in ("openrouter", "nvidia", "openai", "ollama")
                if p != preferred and p in self._providers
            )
        else:
            self._provider_order = [
                p for p in ("openrouter", "nvidia", "openai", "ollama")
                if p in self._providers
            ]

        self._active_provider = self._provider_order[0] if self._provider_order else None

    def _build_messages(self, text: str, system_prompt: str,
                        context: Optional[str] = None,
                        history: Optional[List[Dict]] = None) -> List[Dict[str, str]]:
        full_system = system_prompt
        if context:
            full_system += f"\n\nCONTEXT:\n{context}"
        messages = [{"role": "system", "content": full_system}]
        if history:
            for h in history:
                messages.append(h)
        messages.append({"role": "user", "content": text})
        return messages

    def _language_desc(self, language: str) -> str:
        return {
            "en": "English",
            "hi": "Hindi (Devanagari script)",
            "hinglish": "Hinglish (Hindi words written in Latin script)",
        }.get(language, "English")

    async def generate(
        self, text: str, language: str = "en",
        context: Optional[str] = None,
        history: Optional[List[Dict]] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        **kwargs
    ) -> Optional[str]:
        lang_desc = self._language_desc(language)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            language=lang_desc, extra_context=context or ""
        )
        messages = self._build_messages(text, system_prompt, context, history)

        for provider_name in self._provider_order:
            adapter = self._providers.get(provider_name)
            if not adapter or not adapter.is_available():
                logger.debug(f"Skipping unavailable provider: {provider_name}")
                continue

            logger.info(f"LLM Gateway → {provider_name}")
            result = await adapter.generate(
                messages,
                max_tokens=max_tokens,
                temperature=temperature,
                **kwargs
            )
            if result:
                self._active_provider = provider_name
                return result

            logger.warning(f"Provider {provider_name} failed, trying next...")

        return None

    async def generate_stream(
        self, text: str, language: str = "en",
        context: Optional[str] = None,
        history: Optional[List[Dict]] = None,
        **kwargs
    ) -> AsyncGenerator[str, None]:
        lang_desc = self._language_desc(language)
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            language=lang_desc, extra_context=context or ""
        )
        messages = self._build_messages(text, system_prompt, context, history)

        for provider_name in self._provider_order:
            adapter = self._providers.get(provider_name)
            if not adapter or not adapter.is_available():
                continue

            logger.info(f"LLM Gateway Stream → {provider_name}")
            async for chunk in adapter.generate_stream(messages, **kwargs):
                yield chunk

            self._active_provider = provider_name
            return

        yield "Error: No LLM providers available."

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        for provider_name in ("nvidia", "openai"):
            adapter = self._providers.get(provider_name)
            if adapter:
                result = await adapter.get_embedding(text)
                if result:
                    return result
        return None

    async def extract_command(self, text: str, available_commands: List[str]) -> Optional[Dict[str, Any]]:
        system_prompt = (
            "You are the NLU core of JARVIS. "
            f"AVAILABLE COMMANDS: {', '.join(available_commands)}\n\n"
            "Output ONLY a JSON with 'command_key' (string) and 'params' (Any or null). "
            "If no match, set 'command_key' to 'unknown'."
        )
        result = await self.generate(
            f"Extract command from: '{text}'",
            language="en",
            context=system_prompt,
            max_tokens=256,
            temperature=0.1,
        )
        if not result:
            return None

        json_text = result.strip()
        if '```json' in json_text:
            json_text = json_text.split('```json', 1)[1].split('```', 1)[0].strip()
        elif '```' in json_text:
            json_text = json_text.split('```', 1)[1].split('```', 1)[0].strip()

        start = json_text.find('{')
        end = json_text.rfind('}')
        if start != -1 and end != -1:
            json_text = json_text[start:end+1]

        try:
            data = json.loads(json_text)
            if isinstance(data, dict) and 'command_key' in data:
                return data
        except json.JSONDecodeError:
            logger.error(f"Failed to parse command extraction JSON: {json_text}")
        return None

    async def ping(self) -> bool:
        try:
            result = await self.generate("ping", context="Respond ONLY with 'pong'", max_tokens=10)
            return result is not None and "pong" in result.lower()
        except Exception:
            return False

    def get_cost_stats(self) -> dict:
        return cost_tracker.stats()

    @property
    def active_provider(self) -> Optional[str]:
        return self._active_provider

    @property
    def available_providers(self) -> List[str]:
        return [n for n, a in self._providers.items() if a.is_available()]
