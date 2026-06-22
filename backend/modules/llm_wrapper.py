"""
JARVIS v4.0 — LLM Module (Backward Compatible Wrapper)
Delegates to the LLM Gateway (modules/llm_gateway/) with adapter-based providers.
Maintains backward compatibility for all existing imports.
"""

import asyncio
import os
import json
from typing import Dict, Any, Optional, List, AsyncGenerator
from pathlib import Path

from modules.llm_gateway import llm_gateway, cost_tracker
from modules.llm_gateway.gateway import SYSTEM_PROMPT_TEMPLATE
from utils.logger import logger
from config import (
    BACKEND_PORT, FRONTEND_URL, CONFIG, PLATFORM,
    LLM_PROVIDER, NVIDIA_MODEL, OPENROUTER_MODEL, OPENAI_MODEL,
    NVIDIA_EMBEDDING_MODEL, OPENAI_EMBEDDING_MODEL, GOOGLE_EMBEDDING_MODEL,
)
from modules.memory import memory_manager

AGENT_SYSTEM_PROMPT = """You are JARVIS, an autonomous AI agent. 
To solve complex tasks, you must follow a ReAct (Reasoning and Acting) loop.
For each step, you must output exactly one of the following formats:

Thought: [Your reasoning about the current state and what to do next]
Action: {{"name": "tool_name", "parameters": {{"param1": "value1"}}}}
Observation: [The system will provide this]

... repeat until you have the final answer ...

Thought: I have all the information needed.
Final Answer: [Your comprehensive response to the user in the requested language]

RULES:
1. Only use the tools provided in the context.
2. Output valid JSON for the Action field.
3. Be concise but precise.
4. If a tool fails, try an alternative or explain why.
5. Use the user's language ({{language}}) for the Final Answer.

Available Tools:
{{tools_context}}

Relevant Context:
{{neural_context}}
"""


class LLMModule:
    def __init__(self):
        self.provider = LLM_PROVIDER
        self.nvidia_api_key = os.getenv("NVIDIA_API_KEY")
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.nvidia_url = "https://integrate.api.nvidia.com/v1"
        self.nvidia_model = NVIDIA_MODEL
        self.openai_model = OPENAI_MODEL
        self.openrouter_models = [OPENROUTER_MODEL] + [
            "google/gemini-2.0-flash-lite-preview-02-05",
            "deepseek/deepseek-r1",
            "mistralai/mistral-7b-instruct",
            "openrouter/auto",
        ]
        self.current_model_index = 0
        self.provider_status = {
            "nvidia": {"healthy": True, "last_failure": 0},
            "openrouter": {"healthy": True, "last_failure": 0},
            "openai": {"healthy": True, "last_failure": 0},
            "ollama": {"healthy": True, "last_failure": 0},
        }

    @property
    def nvidia_client(self):
        return llm_gateway._providers.get("nvidia")._client if "nvidia" in llm_gateway._providers else None

    @property
    def openrouter_client(self):
        return llm_gateway._providers.get("openrouter")._client if "openrouter" in llm_gateway._providers else None

    @property
    def openai_client(self):
        return llm_gateway._providers.get("openai")._client if "openai" in llm_gateway._providers else None

    async def get_response(self, text: str, language: str = 'en',
                           context: Optional[str] = None) -> Optional[str]:
        await memory_manager.prune_conversations(limit=25)
        neural_context = await memory_manager.neural.get_neural_context(text)
        full_context = context or ""
        if neural_context:
            full_context += f"\n\nNEURAL MEMORY MAP (Core Identity & Behavioral Matrix):\n{neural_context}"
        return await llm_gateway.generate(text, language=language, context=full_context)

    async def get_response_stream(self, text: str, language: str = 'en',
                                   context: Optional[str] = None) -> AsyncGenerator[str, None]:
        await memory_manager.prune_conversations(limit=25)
        neural_context = await memory_manager.neural.get_neural_context(text)
        full_context = context or ""
        if neural_context:
            full_context += f"\n\nNEURAL MEMORY MAP:\n{neural_context}"
        async for chunk in llm_gateway.generate_stream(text, language=language, context=full_context):
            yield chunk

    async def get_visual_response(self, image_path: str, prompt: str = "Analyze this image and describe what you see.",
                                   language: str = 'en') -> Optional[str]:
        import base64
        path = Path(image_path).expanduser().resolve()
        if not path.exists():
            logger.error(f"Image not found: {path}")
            return None

        def read_image():
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode('utf-8')

        b64 = await asyncio.to_thread(read_image)

        openrouter = llm_gateway._providers.get("openrouter")
        if openrouter and openrouter.is_available():
            vision_models = ["google/gemini-2.0-flash-001", "openai/gpt-4o", "anthropic/claude-3.5-sonnet"]
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://aryanahirwar.in",
                "X-Title": "JARVIS AI Assistant",
            }
            for model in vision_models:
                payload = {
                    "model": model,
                    "messages": [{
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                        ],
                    }],
                }
                try:
                    import httpx
                    async with httpx.AsyncClient() as client:
                        resp = await client.post(self.openrouter_url, headers=headers, json=payload, timeout=30.0)
                    if resp.status_code == 200:
                        data = resp.json()
                        if "choices" in data and data["choices"]:
                            return data["choices"][0]["message"]["content"].strip()
                except Exception as e:
                    logger.warning(f"Vision model {model} failed: {e}")
                    continue

        nvidia = llm_gateway._providers.get("nvidia")
        if nvidia and nvidia.is_available() and nvidia._client:
            try:
                def _vision():
                    return nvidia._client.chat.completions.create(
                        model="nvidia/llama-3.2-11b-vision-instruct",
                        messages=[{"role": "user", "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                        ]}],
                        max_tokens=1024,
                    )
                completion = await asyncio.to_thread(_vision)
                return completion.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"NVIDIA vision error: {e}")

        return None

    async def extract_command(self, text: str, available_commands: List[str]) -> Optional[Dict[str, Any]]:
        return await llm_gateway.extract_command(text, available_commands)

    async def ping_llm(self) -> bool:
        return await llm_gateway.ping()

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        return await llm_gateway.get_embedding(text)

    async def summarize_context(self, conversation_entries: List[Any]) -> str:
        if not conversation_entries:
            return ""
        summary_prompt = (
            "Summarize the following conversation into a single concise paragraph. "
            "Focus on the core intent and current user needs. Keep it under 100 words."
        )
        conversation_text = "\n".join(
            f"User: {e.user_input}\nJARVIS: {e.jarvis_response}"
            for e in conversation_entries
        )
        try:
            summary = await self.get_response(
                text=f"Conversation to summarize:\n{conversation_text}",
                language='en', context=summary_prompt
            )
            return summary or ""
        except Exception as e:
            logger.error(f"Summarization error: {e}")
            return ""

    async def get_agent_response(self, query: str, tools_context: str, neural_context: str,
                                  history: List[Dict[str, Any]], language: str = "en") -> str:
        system_prompt = AGENT_SYSTEM_PROMPT.format(
            tools_context=tools_context, neural_context=neural_context, language=language
        )
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": query}]
        for step in history:
            messages.append({"role": "assistant", "content": f"Thought: {step['thought']}\nAction: {step['action']}"})
            messages.append({"role": "user", "content": f"Observation: {step['observation']}"})

        for provider_name in ["nvidia", "openrouter", "openai"]:
            adapter = llm_gateway._providers.get(provider_name)
            if adapter and adapter.is_available():
                result = await adapter.generate(messages, temperature=0.2)
                if result:
                    return result
        return "Error: No LLM providers available."

    async def _get_nvidia_response(self, text: str, system_prompt: str, timeout: float = 45.0) -> Optional[str]:
        adapter = llm_gateway._providers.get("nvidia")
        if not adapter:
            return None
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": text}]
        return await adapter.generate(messages)

    async def _get_openrouter_response(self, text: str, system_prompt: str) -> Optional[str]:
        adapter = llm_gateway._providers.get("openrouter")
        if not adapter:
            return None
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": text}]
        return await adapter.generate(messages)

    async def _get_openai_response(self, text: str, system_prompt: str) -> Optional[str]:
        adapter = llm_gateway._providers.get("openai")
        if not adapter:
            return None
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": text}]
        return await adapter.generate(messages)

    async def _get_ollama_response(self, text: str, system_prompt: str) -> Optional[str]:
        adapter = llm_gateway._providers.get("ollama")
        if not adapter:
            return None
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": text}]
        return await adapter.generate(messages)

    async def _stream_nvidia(self, text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        adapter = llm_gateway._providers.get("nvidia")
        if not adapter:
            yield "Error: NVIDIA not available."
            return
        async for chunk in adapter.generate_stream([{"role": "system", "content": system_prompt}, {"role": "user", "content": text}]):
            yield chunk

    async def _stream_openrouter(self, text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        adapter = llm_gateway._providers.get("openrouter")
        if not adapter:
            yield "Error: OpenRouter not available."
            return
        async for chunk in adapter.generate_stream([{"role": "system", "content": system_prompt}, {"role": "user", "content": text}]):
            yield chunk

    async def _stream_openai(self, text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        adapter = llm_gateway._providers.get("openai")
        if not adapter:
            yield "Error: OpenAI not available."
            return
        async for chunk in adapter.generate_stream([{"role": "system", "content": system_prompt}, {"role": "user", "content": text}]):
            yield chunk

    async def _stream_ollama(self, text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        adapter = llm_gateway._providers.get("ollama")
        if not adapter:
            yield "Error: Ollama not available."
            return
        async for chunk in adapter.generate_stream([{"role": "system", "content": system_prompt}, {"role": "user", "content": text}]):
            yield chunk

    async def _call_nvidia_raw(self, messages: List[Dict[str, str]]) -> str:
        adapter = llm_gateway._providers.get("nvidia")
        if not adapter:
            return "Error: NVIDIA not initialized."
        result = await adapter.generate(messages, temperature=0.2)
        return result or "Error: No response from NVIDIA."

    async def _call_openrouter_raw(self, messages: List[Dict[str, str]]) -> str:
        adapter = llm_gateway._providers.get("openrouter")
        if not adapter:
            return "Error: OpenRouter not initialized."
        result = await adapter.generate(messages, temperature=0.2)
        return result or "Error: No response from OpenRouter."

    async def _call_openai_raw(self, messages: List[Dict[str, str]]) -> str:
        adapter = llm_gateway._providers.get("openai")
        if not adapter:
            return "Error: OpenAI not initialized."
        result = await adapter.generate(messages, temperature=0.2)
        return result or "Error: No response from OpenAI."

    async def _call_ollama_raw(self, messages: List[Dict[str, str]]) -> str:
        adapter = llm_gateway._providers.get("ollama")
        if not adapter:
            return "Error: Ollama not initialized."
        result = await adapter.generate(messages, temperature=0.2)
        return result or "Error: No response from Ollama."


llm_module = LLMModule()
llm_client = llm_module

get_response = llm_module.get_response
get_response_stream = llm_module.get_response_stream
get_visual_response = llm_module.get_visual_response
extract_command = llm_module.extract_command
ping_llm = llm_module.ping_llm
get_embedding = llm_module.get_embedding
summarize_context = llm_module.summarize_context
get_agent_response = llm_module.get_agent_response

_get_nvidia_response = llm_module._get_nvidia_response
_get_openrouter_response = llm_module._get_openrouter_response
_get_openai_response = llm_module._get_openai_response
_get_ollama_response = llm_module._get_ollama_response
_stream_nvidia = llm_module._stream_nvidia
_stream_openrouter = llm_module._stream_openrouter
_stream_openai = llm_module._stream_openai
_stream_ollama = llm_module._stream_ollama
_call_nvidia_raw = llm_module._call_nvidia_raw
_call_openrouter_raw = llm_module._call_openrouter_raw
_call_openai_raw = llm_module._call_openai_raw
_call_ollama_raw = llm_module._call_ollama_raw
