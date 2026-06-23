"""
Audio Streaming Router — WebSocket endpoint for bidirectional TTS/STT streaming.
Supports streaming TTS (incremental audio chunks) and full-audio STT.
"""

import base64
import hmac
import json
import os
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from modules.audio.stt import stt_service
from modules.audio.tts import tts_service
from utils.logger_structured import logger

router = APIRouter(prefix="/audio", tags=["Audio"])

MAX_AUDIO_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_TTS_TEXT = 2000


@router.websocket("/ws/audio")
async def audio_websocket(websocket: WebSocket, language: str = "en", api_key: Optional[str] = None):
    configured_key = os.getenv("BACKEND_API_KEY") or os.getenv("VITE_JARVIS_API_KEY")
    if configured_key:
        client_host = websocket.client.host if websocket.client else ""
        is_local = client_host in ("127.0.0.1", "localhost", "::1")
        if not is_local:
            if not api_key or not hmac.compare_digest(api_key, configured_key):
                logger.warning("Unauthorized Audio WS attempt from %s", client_host)
                await websocket.close(code=1008)
                return
    await websocket.accept()
    logger.info(f"Audio WS connected (lang={language})")

    try:
        while True:
            raw = await websocket.receive_text()
            if len(raw) > MAX_AUDIO_BYTES:
                await websocket.send_json({"type": "error", "error": "Message too large"})
                continue

            msg = json.loads(raw)
            msg_type = msg.get("type")

            if msg_type == "stt":
                audio_b64 = msg.get("audio")
                if audio_b64:
                    audio_bytes = base64.b64decode(audio_b64)
                    if len(audio_bytes) > MAX_AUDIO_BYTES:
                        await websocket.send_json({"type": "error", "error": "Audio data too large"})
                        continue
                    text = await stt_service.transcribe(audio_bytes, language)
                    await websocket.send_json({"type": "stt_result", "text": text or ""})

            elif msg_type == "tts":
                text = (msg.get("text") or "")[:MAX_TTS_TEXT]
                voice = msg.get("voice", "alloy")
                if text:
                    audio_data = await tts_service.synthesize(text, voice, language)
                    if audio_data:
                        await websocket.send_json({
                            "type": "tts_audio",
                            "audio": base64.b64encode(audio_data).decode(),
                            "format": "opus",
                        })
                    else:
                        await websocket.send_json({"type": "tts_error", "error": "TTS failed"})

            elif msg_type == "tts_stream":
                text = (msg.get("text") or "")[:MAX_TTS_TEXT]
                voice = msg.get("voice", "alloy")
                if text:
                    async for chunk in tts_service.synthesize_stream(text, voice, language):
                        await websocket.send_json({
                            "type": "tts_chunk",
                            "audio": base64.b64encode(chunk).decode(),
                            "format": "opus",
                        })
                    await websocket.send_json({"type": "tts_end"})
                else:
                    await websocket.send_json({"type": "tts_error", "error": "Empty text"})

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        logger.info("Audio WS disconnected")
    except json.JSONDecodeError:
        await websocket.send_json({"type": "error", "error": "Invalid JSON"})
    except Exception as e:
        logger.error(f"Audio WS error: {e}")
