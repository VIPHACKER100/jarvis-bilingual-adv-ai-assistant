"""
Text-to-Speech streaming service.
Providers: OpenAI TTS, Edge-TTS (local), fallback
"""

import base64
import asyncio
from typing import AsyncGenerator, Optional
from utils.logger import logger


class TTSService:
    LANGUAGES = {"en": "english", "hi": "hindi", "hinglish": "english"}

    def __init__(self):
        pass

    async def synthesize(self, text: str, voice: str = "alloy", language: str = "en") -> Optional[bytes]:
        openai_key = self._get_openai_key()
        if openai_key:
            return await self._synthesize_openai(text, voice)
        logger.warning("No TTS provider available")
        return None

    async def synthesize_stream(self, text: str, voice: str = "alloy", language: str = "en") -> AsyncGenerator[bytes, None]:
        openai_key = self._get_openai_key()
        if openai_key:
            async for chunk in self._synthesize_openai_stream(text, voice):
                yield chunk
            return

    async def _synthesize_openai(self, text: str, voice: str = "alloy") -> Optional[bytes]:
        import httpx
        api_key = self._get_openai_key()
        if not api_key:
            return None
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://api.openai.com/v1/audio/speech",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"model": "tts-1", "input": text, "voice": voice, "response_format": "opus"},
                )
                resp.raise_for_status()
                return resp.content
        except Exception as e:
            logger.error(f"OpenAI TTS error: {e}")
            return None

    async def _synthesize_openai_stream(self, text: str, voice: str = "alloy") -> AsyncGenerator[bytes, None]:
        import httpx
        api_key = self._get_openai_key()
        if not api_key:
            return
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                async with client.stream(
                    "POST",
                    "https://api.openai.com/v1/audio/speech",
                    headers={"Authorization": f"Bearer {api_key}"},
                    json={"model": "tts-1", "input": text, "voice": voice, "response_format": "opus"},
                ) as resp:
                    resp.raise_for_status()
                    async for chunk in resp.aiter_bytes():
                        yield chunk
        except Exception as e:
            logger.error(f"OpenAI TTS stream error: {e}")

    def _get_openai_key(self) -> Optional[str]:
        import os
        return os.getenv("OPENAI_API_KEY") or os.getenv("OPENROUTER_API_KEY")


tts_service = TTSService()
