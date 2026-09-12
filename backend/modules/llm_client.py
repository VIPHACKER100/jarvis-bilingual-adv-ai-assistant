"""
JARVIS — LLM Client (single file, single provider pattern)
Merges the old 4-file llm_gateway into ~100 lines.
"""

import asyncio
import json
import os
import time
from pathlib import Path
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
        model_name = model or os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-20b:free")

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
                    model=os.getenv("OPENROUTER_MODEL", "openai/gpt-oss-20b:free"),
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
                        if not line:
                            continue
                        data = json.loads(line)
                        if "message" in data:
                            yield data["message"]["content"]
                        if data.get("done"):
                            break
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
5. Use the user's language ({language}) for the Final Answer.

Available Tools:
{tools_context}

Relevant Context:
{neural_context}
"""


class LLMModule:
    """High-level LLM facade: neural-memory context injection, vision,
    command extraction, and the ReAct agent loop, built on LLMClient."""

    async def get_response(
        self, text: str, language: str = "en", context: Optional[str] = None, max_tokens: Optional[int] = None
    ) -> Optional[str]:
        from modules.memory import memory_manager
        neural_context = await memory_manager.neural.get_neural_context(text)
        full_context = context or ""
        if neural_context:
            full_context += f"\n\nNEURAL MEMORY MAP (Core Identity & Behavioral Matrix):\n{neural_context}"
        return await llm_client.chat(text, language=language, context=full_context, max_tokens=max_tokens)

    async def get_response_stream(self, text: str, language: str = "en", context: Optional[str] = None) -> AsyncGenerator[str, None]:
        from modules.memory import memory_manager
        neural_context = await memory_manager.neural.get_neural_context(text)
        full_context = context or ""
        if neural_context:
            full_context += f"\n\nNEURAL MEMORY MAP:\n{neural_context}"
        async for chunk in llm_client.chat_stream(text, language=language, context=full_context):
            yield chunk

    async def get_visual_response(self, image_path: str, prompt: str = "Analyze this image and describe what you see.", language: str = "en") -> Optional[str]:
        import base64
        path = Path(image_path).expanduser().resolve()
        if not path.exists():
            logger.error(f"Image not found: {path}")
            return None

        def read_image():
            with open(path, "rb") as f:
                return base64.b64encode(f.read()).decode("utf-8")
        b64 = await asyncio.to_thread(read_image)

        api_key = os.getenv("OPENROUTER_API_KEY")
        if api_key:
            vision_models = ["google/gemini-2.0-flash-001", "openai/gpt-4o", "anthropic/claude-3.5-sonnet"]
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json",
                       "X-Title": "JARVIS AI Assistant"}
            for model in vision_models:
                payload = {"model": model, "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}]}]}
                try:
                    async with httpx.AsyncClient() as client:
                        resp = await client.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=30.0)
                    if resp.status_code == 200 and "choices" in resp.json():
                        return resp.json()["choices"][0]["message"]["content"].strip()
                except Exception as e:
                    logger.warning(f"Vision model {model} failed: {e}")

        nvidia_key = os.getenv("NVIDIA_API_KEY")
        if nvidia_key:
            nvidia_client = AsyncOpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=nvidia_key, timeout=httpx.Timeout(45.0))
            try:
                content = await nvidia_client.chat.completions.create(
                    model="nvidia/llama-3.2-11b-vision-instruct",
                    messages=[{"role": "user", "content": [{"type": "text", "text": prompt}, {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}]}],
                    max_tokens=1024,
                )
                return content.choices[0].message.content.strip()
            except Exception as e:
                logger.error(f"NVIDIA vision error: {e}")
        return None

    async def extract_command(self, text: str, available_commands: List[str]) -> Optional[Dict[str, Any]]:
        system_prompt = f"You are the NLU core of JARVIS. AVAILABLE COMMANDS: {', '.join(available_commands)}\n\nOutput ONLY a JSON with 'command_key' (string) and 'params' (Any or null). If no match, set 'command_key' to 'unknown'."
        result = await llm_client.chat(f"Extract command from: '{text}'", language="en", context=system_prompt, max_tokens=256, temperature=0.1)
        if not result:
            return None
        json_text = result.strip()
        if "```json" in json_text:
            json_text = json_text.split("```json", 1)[1].split("```", 1)[0].strip()
        elif "```" in json_text:
            json_text = json_text.split("```", 1)[1].split("```", 1)[0].strip()
        start, end = json_text.find("{"), json_text.rfind("}")
        if start != -1 and end != -1:
            json_text = json_text[start:end + 1]
        try:
            data = json.loads(json_text)
            if isinstance(data, dict) and "command_key" in data:
                return data
        except json.JSONDecodeError:
            logger.error(f"Failed to parse command extraction JSON: {json_text}")
        return None

    async def ping_llm(self) -> bool:
        return await llm_client.ping()

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        return await llm_client.get_embedding(text)

    async def summarize_context(self, conversation_entries: List[Any]) -> str:
        if not conversation_entries:
            return ""
        summary_prompt = "Summarize the following conversation into a single concise paragraph. Focus on the core intent and current user needs. Keep it under 100 words."
        conversation_text = "\n".join(f"User: {e.user_input}\nJARVIS: {e.jarvis_response}" for e in conversation_entries)
        try:
            summary = await self.get_response(text=f"Conversation to summarize:\n{conversation_text}", language="en", context=summary_prompt)
            return summary or ""
        except Exception as e:
            logger.error(f"Summarization error: {e}")
            return ""

    async def get_agent_response(self, query: str, tools_context: str, neural_context: str, history: List[Dict[str, Any]], language: str = "en") -> str:
        system_prompt = AGENT_SYSTEM_PROMPT.format(tools_context=tools_context, neural_context=neural_context, language=language)
        # Feed the ReAct transcript back so each iteration sees prior steps
        transcript: List[Dict[str, Any]] = []
        for step in history:
            transcript.append({"role": "assistant", "content": f"Thought: {step['thought']}\nAction: {step['action']}"})
            transcript.append({"role": "user", "content": f"Observation: {step['observation']}"})
        result = await llm_client.chat(query, language=language, context=system_prompt, history=transcript)
        return result or "Error: No LLM response."


llm_module = LLMModule()
