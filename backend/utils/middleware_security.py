"""
Security Middleware — CSP headers, input sanitization, body limits, per-route rate limiting,
and API key authentication dependency.
"""

import os
import re
import time
import json
import hmac
from typing import Dict, Tuple, Callable, Awaitable, Optional
from fastapi import Request, Response, HTTPException, Depends
from fastapi.security import APIKeyHeader
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp, Scope, Receive, Send, Message
from utils.logger_structured import logger


BLOCKED_PATTERNS = re.compile(
    r"(?:--\s*$|\b(?:DROP|DELETE|TRUNCATE|EXEC|EXECUTE|INSERT)\b)",
    re.IGNORECASE,
)

MAX_BODY_BYTES = 1024 * 512  # 512 KB


class _ReceiveWrapper:
    """Wraps an ASGI receive callable to deliver a pre-read body."""
    def __init__(self, receive: Receive, body: bytes) -> None:
        self._receive = receive
        self._body = body
        self._sent = False

    async def __call__(self) -> Message:
        if not self._sent:
            self._sent = True
            return {"type": "http.request", "body": self._body, "more_body": False}
        return await self._receive()


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "microphone=(self), camera=(self), clipboard-read=(self), clipboard-write=(self)"
        response.headers["Cross-Origin-Embedder-Policy"] = "require-corp"
        response.headers["Cross-Origin-Opener-Policy"] = "same-origin"
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


class SQLInjectionMiddleware:
    """
    ASGI middleware that inspects POST/PUT/PATCH JSON bodies for SQLi patterns.
    Uses raw ASGI receive channel to avoid body-stream exhaustion issues
    that occur with BaseHTTPMiddleware + request.body().
    """
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http" or scope["method"] not in ("POST", "PUT", "PATCH"):
            await self.app(scope, receive, send)
            return

        # Read the full body from the ASGI receive channel
        chunks: list[bytes] = []
        more_body = True
        while more_body:
            message = await receive()
            if message["type"] == "http.request":
                chunks.append(message.get("body", b""))
                more_body = message.get("more_body", False)

        body = b"".join(chunks)

        # Check content-type is JSON
        headers: list[tuple[bytes, bytes]] = scope.get("headers", [])
        is_json = any(n == b"content-type" and b"json" in v for n, v in headers)

        if body and is_json:
            decoded = body.decode("utf-8", errors="ignore")
            if BLOCKED_PATTERNS.search(decoded):
                client_host = ""
                for name, value in headers:
                    if name == b"host":
                        client_host = value.decode()
                        break
                logger.warning(f"Blocked SQLi attempt from {client_host}: {scope['path']}")
                response = JSONResponse(
                    status_code=400,
                    content={"success": False, "error": "Invalid input pattern detected"},
                )
                await self._send_response(response, send)
                return

        # Re-wrap receive with the pre-read body so downstream handlers can read it
        await self.app(scope, _ReceiveWrapper(receive, body), send)

    @staticmethod
    async def _send_response(response: JSONResponse, send: Send) -> None:
        body_bytes = json.dumps(response.body).encode() if isinstance(response.body, dict) else response.body
        headers: list[tuple[bytes, bytes]] = [
            (b"content-type", b"application/json"),
            (b"content-length", str(len(body_bytes)).encode()),
        ]
        await send({
            "type": "http.response.start",
            "status": response.status_code,
            "headers": response.headers.raw if hasattr(response.headers, 'raw') else headers,
        })
        await send({
            "type": "http.response.body",
            "body": body_bytes,
        })


class MaxBodySizeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_BODY_BYTES:
            return JSONResponse(
                status_code=413,
                content={"success": False, "error": "Request body too large"},
            )
        return await call_next(request)


class PerRouteRateLimiter:
    def __init__(self):
        self._buckets: Dict[str, Tuple[float, int]] = {}

    def check(self, key: str, max_calls: int, window_sec: float = 60.0) -> bool:
        now = time.monotonic()
        window_start, count = self._buckets.get(key, (now, 0))
        if now - window_start > window_sec:
            window_start = now
            count = 0
        if count >= max_calls:
            return False
        self._buckets[key] = (window_start, count + 1)
        return True


per_route_limiter = PerRouteRateLimiter()

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def _get_configured_key() -> Optional[str]:
    """Single source for API key — matches main.py module-level BACKEND_API_KEY."""
    return os.getenv("BACKEND_API_KEY") or os.getenv("VITE_JARVIS_API_KEY")


async def verify_api_key(request: Request, api_key: str = Depends(api_key_header)) -> None:
    """FastAPI dependency — requires valid API key for protected routes.

    Bypasses auth for localhost requests (safe in development).
    Uses direct socket IP only (X-Forwarded-For not trusted for auth).
    Returns 403 if key is missing/wrong and BACKEND_API_KEY is configured.
    Uses hmac.compare_digest for constant-time comparison.
    """
    configured_key = _get_configured_key()
    if not configured_key:
        return

    client_host = request.client.host if request.client else ""
    is_local = client_host in ("127.0.0.1", "localhost", "::1")
    if is_local:
        return

    if not api_key or not hmac.compare_digest(api_key, configured_key):
        raise HTTPException(status_code=403, detail="Invalid or missing API Key")
