import asyncio
from typing import Dict, Any, Optional, List, AsyncGenerator
import httpx
from utils.logger import logger
import os
import json
import sys
import time
from openai import OpenAI
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import BACKEND_PORT, FRONTEND_URL, CONFIG, PLATFORM, LLM_PROVIDER, NVIDIA_MODEL, OPENROUTER_MODEL, OPENAI_MODEL, NVIDIA_EMBEDDING_MODEL, OPENAI_EMBEDDING_MODEL, GOOGLE_EMBEDDING_MODEL
from modules.memory import memory_manager

load_dotenv()

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
    """Module for handling conversational AI using OpenRouter or NVIDIA"""

    def __init__(self):
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.nvidia_api_key = os.getenv("NVIDIA_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.provider = LLM_PROVIDER
        
        from config import OLLAMA_URL, OLLAMA_MODEL
        self.ollama_url = OLLAMA_URL
        self.ollama_model = OLLAMA_MODEL
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        self.nvidia_url = "https://integrate.api.nvidia.com/v1"
        
        # Initialize OpenAI client for NVIDIA
        if self.nvidia_api_key:
            self.nvidia_client = OpenAI(
                base_url=self.nvidia_url,
                api_key=self.nvidia_api_key
            )
        else:
            self.nvidia_client = None
            
        # Initialize OpenAI client for ChatGPT
        if self.openai_api_key:
            self.openai_client = OpenAI(api_key=self.openai_api_key)
        else:
            self.openai_client = None

        # Initialize OpenAI client for OpenRouter
        if self.openrouter_api_key:
            self.openrouter_client = OpenAI(
                base_url="https://openrouter.ai/api/v1",
                api_key=self.openrouter_api_key
            )
        else:
            self.openrouter_client = None
        
        # Use models from config as primary, with fallbacks
        self.nvidia_model = NVIDIA_MODEL
        self.openai_model = OPENAI_MODEL
        self.openrouter_models = [OPENROUTER_MODEL] + [
            "google/gemini-2.0-flash-lite-preview-02-05",
            "deepseek/deepseek-r1",
            "mistralai/mistral-7b-instruct",
            "openrouter/auto"
        ]
        self.current_model_index = 0
        self.provider_status = {
            "nvidia": {"healthy": True, "last_failure": 0},
            "openrouter": {"healthy": True, "last_failure": 0},
            "openai": {"healthy": True, "last_failure": 0},
            "ollama": {"healthy": True, "last_failure": 0}
        }

    async def get_response(
            self,
            text: str,
            language: str = 'en',
            context: Optional[str] = None) -> Optional[str]:
        """Get a response from the LLM with automatic context optimization"""
        
        # Trigger contextual pruning if history gets too long
        await memory_manager.prune_conversations(limit=25)
        
        if language == 'hi':
            lang_desc = "Hindi (Devanagari script)"
        elif language == 'hinglish':
            lang_desc = "Hinglish (Hindi words written in Latin/English script)"
        else:
            lang_desc = "English"

        system_prompt = (
            "You are JARVIS, a highly intelligent and helpful AI assistant designed for efficiency and clarity. "
            f"Respond in {lang_desc}, using a natural, professional, and conversational tone. "
            "Guidelines: "
            "(1) Keep responses concise—typically 1-3 sentences for quick queries, longer for complex topics requiring depth. "
            "(2) Structure multi-part answers with brief headers or bullet points if helpful. "
            "(3) Be honest about limitations; clarify if you need more context. "
            "(4) For system commands, provide clear, safe instructions with explanations. "
            "(5) For web search queries, summarize findings concisely and cite sources when relevant. "
            "(6) Adapt your explanation depth based on the user's apparent expertise level. "
            "Capabilities: system commands, web search, code assistance, general conversation, and research."
        )

        if context:
            system_prompt += f"\n\nUSER CONTEXT:\n{context}\n\nUse this information to provide more personalized and relevant responses."
        
        system_prompt += "\nIf the user asks for a command you can't perform, explain it politely."

        # Inject Neural Memory context (Query-aware in v3.6.0)
        neural_context = await memory_manager.neural.get_neural_context(text)
        if neural_context:
            system_prompt += f"\n\nNEURAL MEMORY MAP (Core Identity & Behavioral Matrix):\n{neural_context}"

        if self.provider == "nvidia" and self.nvidia_api_key:
            # Check if nvidia is locked out
            if not self.provider_status["nvidia"]["healthy"] and time.time() - self.provider_status["nvidia"]["last_failure"] < 600:
                logger.warning("NVIDIA is currently in lockout due to recent failures. Using OpenRouter instead.")
                return await self._get_openrouter_response(text, system_prompt)
            return await self._get_nvidia_response(text, system_prompt)
        elif self.provider == "openai" and self.openai_api_key:
            return await self._get_openai_response(text, system_prompt)
        elif self.provider == "ollama":
            return await self._get_ollama_response(text, system_prompt)
        elif self.openrouter_api_key:
            return await self._get_openrouter_response(text, system_prompt)
        else:
            logger.warning("No LLM API keys or local LLM configured.")
            return None

    async def get_response_stream(
            self,
            text: str,
            language: str = 'en',
            context: Optional[str] = None) -> AsyncGenerator[str, None]:
        """Stream chunks from the LLM for progressive UI updates"""
        
        await memory_manager.prune_conversations(limit=25)
        
        if language == 'hi':
            lang_desc = "Hindi (Devanagari script)"
        elif language == 'hinglish':
            lang_desc = "Hinglish (Hindi words written in Latin/English script)"
        else:
            lang_desc = "English"

        system_prompt = (
            "You are JARVIS, a highly intelligent and helpful AI assistant. "
            f"Respond in {lang_desc}. Keep responses concise and conversational. "
            "Guidelines: 1-3 sentences for quick queries, longer for depth. "
            "Capabilities: system commands, web search, code assistance, and research."
        )

        if context:
            system_prompt += f"\n\nUSER CONTEXT:\n{context}"
        
        neural_context = await memory_manager.neural.get_neural_context(text)
        if neural_context:
            system_prompt += f"\n\nNEURAL MEMORY MAP:\n{neural_context}"

        if self.provider == "nvidia" and self.nvidia_api_key:
            async for chunk in self._stream_nvidia(text, system_prompt):
                yield chunk
        elif self.provider == "openai" and self.openai_api_key:
            async for chunk in self._stream_openai(text, system_prompt):
                yield chunk
        elif self.provider == "ollama":
            async for chunk in self._stream_ollama(text, system_prompt):
                yield chunk
        else:
            # Fallback to streaming via OpenRouter if possible
            async for chunk in self._stream_openrouter(text, system_prompt):
                yield chunk

    async def _get_ollama_response(self, text: str, system_prompt: str) -> Optional[str]:
        """Get response from local Ollama instance"""
        payload = {
            "model": self.ollama_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.ollama_url,
                    json=payload,
                    timeout=60.0)

            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    return data["message"]["content"].strip()
                return None
            else:
                logger.error(f"Ollama Error {response.status_code}: {response.text}")
                # Fallback to OpenRouter if available
                if self.openrouter_api_key:
                    return await self._get_openrouter_response(text, system_prompt)
                return None
        except Exception as e:
            logger.error(f"Exception calling Ollama: {e}")
            if self.openrouter_api_key:
                return await self._get_openrouter_response(text, system_prompt)
            return None

    async def _get_nvidia_response(self, text: str, system_prompt: str, timeout: float = 45.0) -> Optional[str]:
        """Get response from NVIDIA API using OpenAI client and DeepSeek reasoning"""
        if not self.nvidia_client:
            logger.error("NVIDIA client not initialized. Check NVIDIA_API_KEY.")
            return None

        model = "deepseek-ai/deepseek-v4-pro"
        
        start_time = time.time()
        logger.info(f"NVIDIA API Call: Model={model}, Input='{text[:50]}...'")
        try:
            # Note: client.chat.completions.create is blocking, 
            # so we run it in a thread to keep the event loop free
            import asyncio
            
            def call_nvidia():
                completion = self.nvidia_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text}
                    ],
                    temperature=1,
                    top_p=0.95,
                    max_tokens=16384,
                    extra_body={
                        "chat_template_kwargs": {
                            "thinking": False
                        }
                    },
                    stream=True
                )
                
                full_content = ""
                full_reasoning = ""
                
                for chunk in completion:
                    if not getattr(chunk, "choices", None):
                        continue
                    
                    reasoning = getattr(chunk.choices[0].delta, "reasoning", None) or \
                                getattr(chunk.choices[0].delta, "reasoning_content", None)
                    
                    if reasoning:
                        full_reasoning += reasoning
                        # We could log reasoning or print it for debugging
                        # print(reasoning, end="", flush=True)
                        
                    if chunk.choices and chunk.choices[0].delta.content is not None:
                        content = chunk.choices[0].delta.content
                        full_content += content
                        # print(content, end="", flush=True)
                
                if full_reasoning:
                    logger.debug(f"NVIDIA Reasoning: {full_reasoning}")
                    
                return full_content.strip()

            response = await asyncio.wait_for(asyncio.to_thread(call_nvidia), timeout=timeout)
            elapsed = time.time() - start_time
            logger.info(f"NVIDIA API Response received in {elapsed:.2f}s")
            
            # Reset health on success
            self.provider_status["nvidia"]["healthy"] = True
            
            return response if response else None
        except asyncio.TimeoutError:
            logger.error(f"NVIDIA API Call timed out after {timeout}s")
            # Mark as unhealthy
            self.provider_status["nvidia"]["healthy"] = False
            self.provider_status["nvidia"]["last_failure"] = time.time()
            
            if self.openrouter_api_key:
                logger.info("Falling back to OpenRouter due to timeout...")
                return await self._get_openrouter_response(text, system_prompt)
            return None

        except Exception as e:
            logger.error(f"Exception calling NVIDIA API: {type(e).__name__}: {e}")
            if self.openrouter_api_key:
                logger.info("Falling back to OpenRouter...")
                return await self._get_openrouter_response(text, system_prompt)
            return None

    async def get_visual_response(
            self,
            image_path: str,
            prompt: str = "Analyze this image and describe what you see.",
            language: str = 'en') -> Optional[str]:
        """Get a response from a vision-capable LLM based on an image"""
        import base64

        path = Path(image_path).expanduser().resolve()
        if not path.exists():
            logger.error(f"Image not found for vision analysis: {path}")
            return None

        def read_image():
            with open(path, "rb") as image_file:
                return base64.b64encode(image_file.read()).decode('utf-8')

        try:
            base64_image = await asyncio.to_thread(read_image)
        except Exception as e:
            logger.error(f"Error reading image file: {e}")
            return None

        if self.provider == "nvidia" and self.nvidia_api_key:
            try:
                model = "nvidia/llama-3.2-11b-vision-instruct"

                def call_nvidia_vision():
                    completion = self.nvidia_client.chat.completions.create(
                        model=model,
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {"url": f"data:image/png;base64,{base64_image}"},
                                    },
                                ],
                            }
                        ],
                        max_tokens=1024,
                        stream=False
                    )
                    return completion.choices[0].message.content.strip()

                return await asyncio.to_thread(call_nvidia_vision)
            except Exception as e:
                logger.error(f"NVIDIA vision analysis error: {e}")
                if self.openrouter_api_key:
                    logger.info("Falling back to OpenRouter for vision...")
                else:
                    return None

        if self.openrouter_api_key:
            vision_models = [
                "google/gemini-2.0-flash-001",
                "google/gemini-2.0-flash-exp",
                "openai/gpt-4o",
                "anthropic/claude-3.5-sonnet"
            ]
            headers = {
                "Authorization": f"Bearer {self.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://aryanahirwar.in",
                "X-Title": "JARVIS AI Assistant"
            }

            for model in vision_models:
                payload = {
                    "model": model,
                    "messages": [
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:image/png;base64,{base64_image}"}
                                }
                            ]
                        }
                    ]
                }

                try:
                    async with httpx.AsyncClient() as client:
                        response = await client.post(
                            self.openrouter_url,
                            headers=headers,
                            json=payload,
                            timeout=30.0)

                    if response.status_code == 200:
                        data = response.json()
                        if "choices" in data and len(data["choices"]) > 0:
                            return data["choices"][0]["message"]["content"].strip()
                    else:
                        error_body = response.text
                        logger.error(f"OpenRouter Vision API Error {response.status_code} for model {model}: {error_body}")
                        continue
                except Exception as model_err:
                    logger.error(f"Exception calling OpenRouter vision model {model}: {model_err}")
                    continue

            logger.error(f"All OpenRouter vision models failed for {image_path}. The model does not support image input or the API key lacks access.")
            raise RuntimeError(
                f"Cannot read '{path.name}' — this model does not support image input. "
                "Please check your OpenRouter API key has access to a vision-capable model."
            )

        return None

    async def _get_openrouter_response(self, text: str, system_prompt: str) -> Optional[str]:
        """Get response from OpenRouter API"""
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://aryanahirwar.in",
            "X-Title": "JARVIS AI Assistant"
        }

        # Try models in order until one works or we run out
        for i in range(len(self.openrouter_models)):
            model = self.openrouter_models[(self.current_model_index + i) % len(self.openrouter_models)]
            
            start_time = time.time()
            logger.info(f"OpenRouter API Call: Model={model}, Input='{text[:50]}...'")
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text}
                    ]
                }

                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.openrouter_url,
                        headers=headers,
                        json=payload,
                        timeout=15.0)

                elapsed = time.time() - start_time
                if response.status_code == 200:
                    logger.info(f"OpenRouter API Response received in {elapsed:.2f}s (Model: {model})")
                    # Update current model index
                    self.current_model_index = (self.current_model_index + i) % len(self.openrouter_models)
                    
                    data = response.json()
                    if "choices" in data and len(data["choices"]) > 0:
                        return data["choices"][0]["message"]["content"].strip()
                elif response.status_code == 401:
                    logger.error(f"OpenRouter Unauthorized (401) for model {model}: {response.text}. Check OPENROUTER_API_KEY.")
                    return None
                elif response.status_code == 429:
                    logger.warning(f"Rate limit hit for model {model}. Trying next...")
                    continue
                else:
                    logger.error(f"OpenRouter Error {response.status_code} for {model}: {response.text}")
                    continue

            except Exception as e:
                logger.error(f"Exception calling OpenRouter with {model}: {e}")
                continue

        return None

    async def summarize_context(self, conversation_entries: List[Any]) -> str:
        """Generate a concise semantic summary of past interactions to save tokens"""
        if not conversation_entries:
            return ""
            
        summary_prompt = (
            "Summarize the following conversation into a single concise paragraph. "
            "Focus on the core intent, entities mentioned, and current user needs. "
            "Ignore system chatter or filler. Keep it under 100 words."
        )
        
        conversation_text = "\n".join([f"User: {e.user_input}\nJARVIS: {e.jarvis_response}" for e in conversation_entries])
        
        try:
            summary = await self.get_response(
                text=f"Conversation to summarize:\n{conversation_text}",
                language='en',
                context=summary_prompt
            )
            return summary or ""
        except Exception as e:
            logger.error(f"Error generating semantic summary: {e}")
            return ""


    async def extract_command(self, text: str, available_commands: List[str]) -> Optional[Dict[str, Any]]:
        """Use LLM to extract structured command and params from natural language"""
        system_prompt = (
            "You are the NLU (Natural Language Understanding) core of JARVIS. "
            "Your task is to map a user's natural language request to a specific system command. "
            f"AVAILABLE COMMANDS: {', '.join(available_commands)}\n\n"
            "Rules:\n"
            "1. Output ONLY a valid JSON object.\n"
            "2. Fields: 'command_key' (string, from the list above) and 'params' (Any, typically string or object, or null).\n"
            "3. If no command matches, set 'command_key' to 'unknown'.\n"
            "4. Language: The input may be in English, Hindi, or Hinglish. Understand all.\n"
        )

        try:
            # Use a more direct prompt for extraction with shorter timeout
            if self.provider == "nvidia" and self.nvidia_api_key:
                 raw_response = await self._get_nvidia_response(f"Extract command from user input: '{text}'", system_prompt, timeout=15.0)
            else:
                 raw_response = await self.get_response(f"Extract command from user input: '{text}'", language='en', context=system_prompt)
            
            if not raw_response:
                return None

            # Robust JSON extraction
            json_text = raw_response.strip()
            
            # Handle markdown blocks
            if '```json' in json_text:
                json_text = json_text.split('```json', 1)[1].split('```', 1)[0].strip()
            elif '```' in json_text:
                json_text = json_text.split('```', 1)[1].split('```', 1)[0].strip()
            
            # Find the first { and last } to handle any chatter before/after
            start = json_text.find('{')
            end = json_text.rfind('}')
            if start != -1 and end != -1:
                json_text = json_text[start:end+1]
            
            data = json.loads(json_text)
            
            # Basic validation of the extracted command
            if isinstance(data, dict) and 'command_key' in data:
                return data
            return None
                
        except Exception as e:
            logger.error(f"Error parsing LLM command extraction JSON: {e}")
            logger.debug(f"Raw response was: {raw_response}")
            return None

    async def ping_llm(self) -> bool:
        """Verify LLM connectivity with a tiny request"""
        try:
            res = await self.get_response("ping", context="Respond ONLY with 'pong'")
            return res is not None and "pong" in res.lower()
        except:
            return False


    async def _stream_nvidia(self, text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        """Stream response from NVIDIA API"""
        if not self.nvidia_client:
            yield "Error: NVIDIA client not initialized."
            return

        model = "deepseek-ai/deepseek-v4-pro"
        try:
            # We use to_thread because the OpenAI sync client is used here
            # For a fully async experience, we'd use AsyncOpenAI
            def get_stream():
                return self.nvidia_client.chat.completions.create(
                    model=model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text}
                    ],
                    stream=True
                )

            completion = await asyncio.to_thread(get_stream)
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"NVIDIA Streaming Error: {e}")
            yield f"Error in NVIDIA stream: {str(e)}"

    async def _stream_ollama(self, text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        """Stream response from Ollama"""
        payload = {
            "model": self.ollama_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            "stream": True
        }
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", self.ollama_url, json=payload, timeout=60.0) as response:
                    async for line in response.aiter_lines():
                        if not line: continue
                        data = json.loads(line)
                        if "message" in data:
                            yield data["message"]["content"]
                        if data.get("done"):
                            break
        except Exception as e:
            logger.error(f"Ollama Streaming Error: {e}")
            yield f"Error in Ollama stream: {str(e)}"

    async def _stream_openrouter(self, text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        """Stream response from OpenRouter"""
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://aryanahirwar.in",
            "X-Title": "JARVIS AI Assistant"
        }
        model = self.openrouter_models[self.current_model_index]
        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            "stream": True
        }
        try:
            async with httpx.AsyncClient() as client:
                async with client.stream("POST", self.openrouter_url, headers=headers, json=payload, timeout=30.0) as response:
                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            data_str = line[6:]
                            if data_str == "[DONE]": break
                            try:
                                data = json.loads(data_str)
                                if "choices" in data and data["choices"][0]["delta"].get("content"):
                                    yield data["choices"][0]["delta"]["content"]
                            except: continue
        except Exception as e:
            logger.error(f"OpenRouter Streaming Error: {e}")
            yield f"Error in OpenRouter stream: {str(e)}"

    async def _get_openai_response(self, text: str, system_prompt: str) -> Optional[str]:
        """Get response from OpenAI API"""
        if not self.openai_client:
            return None
        try:
            import asyncio
            def call_openai():
                completion = self.openai_client.chat.completions.create(
                    model=self.openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text}
                    ]
                )
                return completion.choices[0].message.content.strip()
            
            return await asyncio.to_thread(call_openai)
        except Exception as e:
            logger.error(f"OpenAI Error: {e}")
            return None

    async def _stream_openai(self, text: str, system_prompt: str) -> AsyncGenerator[str, None]:
        """Stream response from OpenAI API"""
        if not self.openai_client:
            yield "Error: OpenAI client not initialized."
            return
        try:
            import asyncio
            def get_stream():
                return self.openai_client.chat.completions.create(
                    model=self.openai_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": text}
                    ],
                    stream=True
                )
            completion = await asyncio.to_thread(get_stream)
            for chunk in completion:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            logger.error(f"OpenAI Streaming Error: {e}")
            yield f"Error in OpenAI stream: {str(e)}"

    async def get_embedding(self, text: str) -> Optional[List[float]]:
        """Generate a vector embedding for the given text"""
        if not text:
            return None

        # Try NVIDIA if it's the provider or if key is available
        if self.provider == "nvidia" and self.nvidia_client:
            try:
                def call_nvidia():
                    response = self.nvidia_client.embeddings.create(
                        input=[text],
                        model=NVIDIA_EMBEDDING_MODEL
                    )
                    return response.data[0].embedding
                
                return await asyncio.to_thread(call_nvidia)
            except Exception as e:
                logger.error(f"Error getting NVIDIA embedding: {e}")
                # Fallback to OpenAI if available

        if self.openai_client:
            try:
                def call_openai():
                    response = self.openai_client.embeddings.create(
                        input=[text],
                        model=OPENAI_EMBEDDING_MODEL
                    )
                    return response.data[0].embedding
                
                return await asyncio.to_thread(call_openai)
            except Exception as e:
                logger.error(f"Error getting OpenAI embedding: {e}")

        # If we reach here, try Google if configured
        try:
            import google.generativeai as genai
            api_key = os.getenv("GOOGLE_API_KEY")
            if api_key:
                genai.configure(api_key=api_key)
                def call_google():
                    result = genai.embed_content(
                        model=GOOGLE_EMBEDDING_MODEL,
                        content=text,
                        task_type="retrieval_document"
                    )
                    return result['embedding']
                
                return await asyncio.to_thread(call_google)
        except Exception as e:
            logger.debug(f"Google embedding failed or not configured: {e}")

        return None

    async def get_agent_response(self, query: str, tools_context: str, neural_context: str, history: List[Dict[str, Any]], language: str = "en") -> str:
        """
        Generate the next step in the agentic loop.
        """
        system_prompt = AGENT_SYSTEM_PROMPT.format(
            tools_context=tools_context,
            neural_context=neural_context,
            language=language
        )
        
        # Build conversation history for the agent
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add user query
        messages.append({"role": "user", "content": query})
        
        # Add loop history
        for step in history:
            messages.append({"role": "assistant", "content": f"Thought: {step['thought']}\nAction: {step['action']}"})
            messages.append({"role": "user", "content": f"Observation: {step['observation']}"})
        
        # Call the LLM (using the primary provider)
        try:
            if self.provider == "nvidia":
                response = await self._call_nvidia_raw(messages)
                return response
            elif self.provider == "openrouter":
                response = await self._call_openrouter_raw(messages)
                return response
            else:
                response = await self._call_openai_raw(messages)
                return response
        except Exception as e:
            logger.error(f"Agent LLM Call Error: {e}")
            return f"Error: {str(e)}"

    async def _call_nvidia_raw(self, messages: List[Dict[str, str]]) -> str:
        if not self.nvidia_client: return "Error: NVIDIA client not initialized."
        def call():
            completion = self.nvidia_client.chat.completions.create(
                model=NVIDIA_MODEL,
                messages=messages,
                temperature=0.2 # Lower temperature for reasoning
            )
            return completion.choices[0].message.content
        return await asyncio.to_thread(call)

    async def _call_openrouter_raw(self, messages: List[Dict[str, str]]) -> str:
        if not self.openrouter_client: return "Error: OpenRouter client not initialized."
        def call():
            completion = self.openrouter_client.chat.completions.create(
                model=OPENROUTER_MODEL,
                messages=messages,
                temperature=0.2
            )
            return completion.choices[0].message.content
        return await asyncio.to_thread(call)

    async def _call_openai_raw(self, messages: List[Dict[str, str]]) -> str:
        if not self.openai_client: return "Error: OpenAI client not initialized."
        def call():
            completion = self.openai_client.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                temperature=0.2
            )
            return completion.choices[0].message.content
        return await asyncio.to_thread(call)

# Singleton instance
llm_module = LLMModule()
llm_client = llm_module
