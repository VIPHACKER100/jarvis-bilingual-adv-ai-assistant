"""
JARVIS v4.0 — LLM Module (Backward Compatible Wrapper)
Delegates to the simplified LLM client (modules/llm_client.py).
Maintains backward compatibility for existing imports.
"""

import asyncio
import json
import os
from pathlib import Path
from typing import Any, AsyncGenerator, Dict, List, Optional

import httpx
from modules.llm_client import llm_client
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

    async def get_response(self, text: str, language: str = "en", context: Optional[str] = None) -> Optional[str]:
        from modules.memory import memory_manager
        neural_context = await memory_manager.neural.get_neural_context(text)
        full_context = context or ""
        if neural_context:
            full_context += f"\n\nNEURAL MEMORY MAP (Core Identity & Behavioral Matrix):\n{neural_context}"
        return await llm_client.chat(text, language=language, context=full_context)

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
                       "HTTP-Referer": "https://aryanahirwar.in", "X-Title": "JARVIS AI Assistant"}
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
            nvidia_client = __import__("openai").AsyncOpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=nvidia_key, timeout=httpx.Timeout(45.0))
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
        messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": query}]
        for step in history:
            messages.append({"role": "assistant", "content": f"Thought: {step['thought']}\nAction: {step['action']}"})
            messages.append({"role": "user", "content": f"Observation: {step['observation']}"})
        result = await llm_client.chat(messages[-1]["content"], language=language, context=system_prompt)
        return result or "Error: No LLM response."


llm_module = LLMModule()
llm_client = llm_module  # backward compat alias
