import httpx
from utils.logger import logger
import os
import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import BACKEND_PORT, FRONTEND_URL, CONFIG, PLATFORM, LLM_PROVIDER, NVIDIA_MODEL, OPENROUTER_MODEL

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
        self.nvidia_url = "https://integrate.api.nvidia.com/v1/chat/completions"
        
        # Use models from config as primary, with fallbacks
        self.nvidia_model = NVIDIA_MODEL
        self.openrouter_models = [OPENROUTER_MODEL] + [
            "google/gemini-2.0-flash-lite-preview-02-05",
            "deepseek/deepseek-r1",
            "mistralai/mistral-7b-instruct",
            "openrouter/auto"
        ]
        self.current_model_index = 0

    async def get_response(
            self,
            text: str,
            language: str = 'en',
            context: Optional[str] = None) -> Optional[str]:
        """Get a response from the LLM with automatic fallback"""
        
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

        if self.provider == "nvidia" and self.nvidia_api_key:
            return await self._get_nvidia_response(text, system_prompt)
        elif self.provider == "ollama":
            return await self._get_ollama_response(text, system_prompt)
        elif self.openrouter_api_key:
            return await self._get_openrouter_response(text, system_prompt)
        else:
            logger.warning("No LLM API keys or local LLM configured.")
            return None

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

    async def _get_nvidia_response(self, text: str, system_prompt: str) -> Optional[str]:
        """Get response from NVIDIA API"""
        headers = {
            "Authorization": f"Bearer {self.nvidia_api_key}",
            "Accept": "application/json"
        }
        
        payload = {
            "model": self.nvidia_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text}
            ],
            "max_tokens": 1024,
            "temperature": 0.60,
            "top_p": 0.95,
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.nvidia_url,
                    headers=headers,
                    json=payload,
                    timeout=120.0)

            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    return data["choices"][0]["message"]["content"].strip()
                return None
            else:
                logger.error(f"NVIDIA API Error {response.status_code}: {response.text}")
                # Fallback to OpenRouter if NVIDIA fails
                if self.openrouter_api_key:
                    logger.info("Falling back to OpenRouter...")
                    return await self._get_openrouter_response(text, system_prompt)
                return None
        except Exception as e:
            logger.error(f"Exception calling NVIDIA API: {type(e).__name__}: {e}")
            if self.openrouter_api_key:
                return await self._get_openrouter_response(text, system_prompt)
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

                if response.status_code == 200:
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
            # Use a more direct prompt for extraction
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


# Singleton instance
llm_module = LLMModule()
