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
            "You are JARVIS, a highly intelligent and helpful AI assistant. "
            f"Respond in a natural, polite, and human-like manner in {lang_desc}. "
            "Keep it concise (max 2-3 sentences). "
            "You can help with system commands, web search, and general conversation. "
        )

        if context:
            system_prompt += f"\n\nUSER CONTEXT:\n{context}\n\nUse this information to provide more personalized and relevant responses."
        
        system_prompt += "\nIf the user asks for a command you can't perform, explain it politely."

        if self.provider == "nvidia" and self.nvidia_api_key:
            return await self._get_nvidia_response(text, system_prompt)
        elif self.openrouter_api_key:
            return await self._get_openrouter_response(text, system_prompt)
        else:
            logger.warning("No LLM API keys found.")
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
            "HTTP-Referer": "https://viphacker100.com",
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


# Singleton instance
llm_module = LLMModule()
