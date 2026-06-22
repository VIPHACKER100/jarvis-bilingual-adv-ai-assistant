"""
Security Middleware — CSP headers, input sanitization, body limits, per-route rate limiting.
"""

import re
import time
from typing import Dict, Tuple
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from utils.logger_structured import logger


BLOCKED_PATTERNS = re.compile(
    r"(?:--\s*$|\b(?:DROP|DELETE|TRUNCATE|EXEC|EXECUTE|INSERT)\b)",
    re.IGNORECASE,
)

MAX_BODY_BYTES = 1024 * 512  # 512 KB


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


class SQLInjectionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "PATCH"):
            content_type = request.headers.get("content-type", "")
            body = await request.body()
            if len(body) > 0 and body and "json" in content_type:
                decoded = body.decode("utf-8", errors="ignore")
                if BLOCKED_PATTERNS.search(decoded):
                    logger.warning(f"Blocked SQLi attempt from {request.client.host}: {request.url.path}")
                    return JSONResponse(
                        status_code=400,
                        content={"success": False, "error": "Invalid input pattern detected"},
                    )
                request._body = body
        return await call_next(request)


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
