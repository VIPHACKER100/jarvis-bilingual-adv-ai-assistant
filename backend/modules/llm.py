import os
import requests
import json
import sys
from pathlib import Path
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))
from utils.logger import logger

load_dotenv()

class LLMModule:
    """Module for handling conversational AI using OpenRouter or Gemini"""
    
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "google/gemini-2.0-flash-lite-preview-02-05:free"  # A good free model
        
    async def get_response(self, text: str, language: str = 'en') -> Optional[str]:
        """Get a response from the LLM"""
        if not self.api_key:
            logger.warning("No OpenRouter API key found.")
            return None
            
        system_prompt = (
            "You are JARVIS, a highly intelligent and helpful AI assistant. "
            f"Respond in a natural, polite, and human-like manner in {'Hindi' if language == 'hi' else 'English'}. "
            "Keep it concise (max 2-3 sentences). "
            "You can help with system commands, web search, and general conversation. "
            "If the user asks for a command you can't perform, explain it politely."
        )
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://viphacker100.com",
                "X-Title": "JARVIS AI Assistant"
            }
            
            payload = {
                "model": "nvidia/nemotron-3-nano-30b-a3b:free",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ]
            }
            
            response = requests.post(self.base_url, headers=headers, json=payload, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"OpenRouter Error {response.status_code}: {response.text}")
                return None
                
            data = response.json()
            if "choices" in data and len(data["choices"]) > 0:
                return data["choices"][0]["message"]["content"].strip()
            
            logger.error(f"Unexpected OpenRouter response format: {data}")
            return None
            
        except Exception as e:
            logger.error(f"Error calling OpenRouter: {e}")
            return None

# Singleton instance
llm_module = LLMModule()
