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
from utils.logger_structured import logger

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
        pass

    async def get_response(self, text: str, language: str = 'en',
                           context: Optional[str] = None) -> Optional[str]:
        from modules.memory import memory_manager
        neural_context = await memory_manager.neural.get_neural_context(text)
        full_context = context or ""
        if neural_context:
            full_context += f"\n\nNEURAL MEMORY MAP (Core Identity & Behavioral Matrix):\n{neural_context}"
        return await llm_gateway.generate(text, language=language, context=full_context)

    async def get_response_stream(self, text: str, language: str = 'en',
                                   context: Optional[str] = None) -> AsyncGenerator[str, None]:
        from modules.memory import memory_manager
        neural_context = await memory_manager.neural.get_neural_context(text)
        full_context = context or ""
        if neural_context:
            full_context += f"\n\nNEURAL MEMORY MAP:\n{neural_context}"
        async for chunk in llm_gateway.generate_stream(text, language=language, context=full_context):
            yield chunk

    async def get_visual_response(self, image_path: str, prompt: str = "Analyze this image and describe what you see.",
                                   language: str = 'en') -> Optional[str]:
        import base64
        import httpx
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
            api_key = os.getenv("OPENROUTER_API_KEY")
            headers = {
                "Authorization": f"Bearer {api_key}",
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
                    async with httpx.AsyncClient() as client:
                        resp = await client.post(
                            "https://openrouter.ai/api/v1/chat/completions",
                            headers=headers, json=payload, timeout=30.0
                        )
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
                content = await nvidia._client.chat.completions.create(
                    model="nvidia/llama-3.2-11b-vision-instruct",
                    messages=[{"role": "user", "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}},
                    ]}],
                    max_tokens=1024,
                )
                return content.choices[0].message.content.strip()
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


llm_module = LLMModule()
llm_client = llm_module
