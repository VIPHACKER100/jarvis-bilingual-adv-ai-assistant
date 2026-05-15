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

from config import BACKEND_PORT, FRONTEND_URL, CONFIG, PLATFORM, LLM_PROVIDER, NVIDIA_MODEL, OPENROUTER_MODEL
from modules.memory import memory_manager

load_dotenv()


class LLMModule:
    """Module for handling conversational AI using OpenRouter or NVIDIA"""

    def __init__(self):
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.nvidia_api_key = os.getenv("NVIDIA_API_KEY")
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
        
        # Use models from config as primary, with fallbacks
        self.nvidia_model = NVIDIA_MODEL
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
        try:
            import base64
            
            path = Path(image_path).expanduser().resolve()
            if not path.exists():
                logger.error(f"Image not found for vision analysis: {path}")
                return None

            # Read and encode image asynchronously
            def read_image():
                with open(path, "rb") as image_file:
                    return base64.b64encode(image_file.read()).decode('utf-8')
            
            base64_image = await asyncio.to_thread(read_image)

            if self.provider == "nvidia" and self.nvidia_api_key:
                # Use a vision-capable model
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
            
            elif self.openrouter_api_key:
                # Fallback to OpenRouter with a vision model
                model = "google/gemini-2.0-flash-001"
                headers = {
                    "Authorization": f"Bearer {self.openrouter_api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://aryanahirwar.in",
                    "X-Title": "JARVIS AI Assistant"
                }
                
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
                
            return None

        except Exception as e:
            logger.error(f"Error in visual analysis: {e}")
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

# Singleton instance
llm_module = LLMModule()
llm_client = llm_module
