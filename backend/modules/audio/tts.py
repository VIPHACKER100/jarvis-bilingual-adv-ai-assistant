"""
Text-to-Speech streaming service.
Providers: OpenAI TTS, Edge-TTS (local), fallback
"""

from typing import AsyncGenerator, Optional

from utils.logger_structured import logger


class TTSService:
    LANGUAGES = {"en": "en", "hi": "hi", "hinglish": "en"}
    EDGE_VOICES = {
        "en": "en-US-ChristopherNeural",
        "hi": "hi-IN-MadhurNeural",
        "hinglish": "en-US-ChristopherNeural",
    }

    def __init__(self):
        pass

    async def synthesize(self, text: str, voice: str = "alloy", language: str = "en") -> Optional[bytes]:
        openai_key = self._get_openai_key()
        if openai_key:
            result = await self._synthesize_openai(text, voice)
            if result:
                return result
        return await self._synthesize_edge(text, language)

    async def synthesize_stream(self, text: str, voice: str = "alloy", language: str = "en") -> AsyncGenerator[bytes, None]:
        openai_key = self._get_openai_key()
        yielded = False
        if openai_key:
            async for chunk in self._synthesize_openai_stream(text, voice):
                yielded = True
                yield chunk
            if yielded:
                return
        async for chunk in self._synthesize_edge_stream(text, language):
            yield chunk

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

    async def _synthesize_edge(self, text: str, language: str = "en") -> Optional[bytes]:
        try:
            import edge_tts
            voice = self.EDGE_VOICES.get(language, "en-US-ChristopherNeural")
            communicate = edge_tts.Communicate(text, voice)
            chunks = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    chunks.append(chunk["data"])
            return b"".join(chunks) if chunks else None
        except ImportError:
            logger.warning("edge-tts not installed, skipping local TTS fallback")
            return None
        except Exception as e:
            logger.error(f"Edge-TTS error: {e}")
            return None

    async def _synthesize_edge_stream(self, text: str, language: str = "en") -> AsyncGenerator[bytes, None]:
        try:
            import edge_tts
            voice = self.EDGE_VOICES.get(language, "en-US-ChristopherNeural")
            communicate = edge_tts.Communicate(text, voice)
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    yield chunk["data"]
        except ImportError:
            logger.warning("edge-tts not installed, cannot stream TTS")
        except Exception as e:
            logger.error(f"Edge-TTS stream error: {e}")

    def _get_openai_key(self) -> Optional[str]:
        import os
        return os.getenv("OPENAI_API_KEY")


tts_service = TTSService()
