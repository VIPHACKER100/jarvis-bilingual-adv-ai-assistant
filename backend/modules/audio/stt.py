"""
Speech-to-Text streaming service.
Providers: OpenAI Whisper, local fallback
"""

import os
from typing import AsyncGenerator, Optional

from utils.logger_structured import logger


class STTService:
    LANGUAGES = {"en": "en", "hi": "hi", "hinglish": "en"}

    def __init__(self):
        pass

    async def transcribe(self, audio_data: bytes, language: str = "en") -> Optional[str]:
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            return await self._transcribe_openai(audio_data, language)
        return None

    async def transcribe_stream(self, audio_chunks: AsyncGenerator[bytes, None], language: str = "en") -> Optional[str]:
        buffer = bytearray()
        async for chunk in audio_chunks:
            buffer.extend(chunk)
        return await self.transcribe(bytes(buffer), language)

    async def _transcribe_openai(self, audio_data: bytes, language: str = "en") -> Optional[str]:
        import httpx
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            return None
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                files = {"file": ("audio.webm", audio_data, "audio/webm")}
                data = {"model": "whisper-1", "language": self.LANGUAGES.get(language, "en")}
                resp = await client.post(
                    "https://api.openai.com/v1/audio/transcriptions",
                    headers={"Authorization": f"Bearer {api_key}"},
                    files=files,
                    data=data,
                )
                resp.raise_for_status()
                result = resp.json()
                return result.get("text")
        except Exception as e:
            logger.error(f"OpenAI STT error: {e}")
            return None


stt_service = STTService()
