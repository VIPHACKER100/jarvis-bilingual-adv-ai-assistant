"""
JARVIS v4.0 — Tests for LLM Gateway, RAG Pipeline, Agent Router, Security Middleware
"""

import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))


# ─── LLM Client Tests ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
class TestLLMClient:
    async def test_no_provider_returns_none(self):
        with patch.dict("os.environ", {}, clear=True):
            from modules.llm_client import LLMClient

            client = LLMClient()
            result = await client.chat("hello")
            assert result is None

    async def test_client_import(self):
        from modules.llm_wrapper import llm_client, llm_module

        assert llm_module is not None
        assert llm_client is not None


# ─── Agent Router Tests ───────────────────────────────────────────────────────


class TestAgentRouter:
    def test_health_endpoint(self):
        from backend.main import app

        client = TestClient(app)
        resp = client.get("/api/v1/agent/health")
        # Health endpoints are auth-exempt; TestClient comes from localhost
        # where the auth bypass applies, so this must always succeed
        assert resp.status_code == 200

    def test_chat_endpoint_validation(self):
        from backend.main import app

        client = TestClient(app)
        resp = client.post("/api/v1/agent/chat", json={"query": ""})
        # Empty query fails min_length validation (no auth failure: localhost bypass)
        assert resp.status_code == 422




# ─── Security Middleware Tests ─────────────────────────────────────────────────


class TestSecurityMiddleware:
    def test_security_headers(self):
        from backend.main import app

        client = TestClient(app)
        resp = client.get("/api/v1/health")
        assert resp.status_code == 200
        headers = resp.headers
        assert "X-Content-Type-Options" in headers
        assert "X-Frame-Options" in headers
        assert "X-XSS-Protection" in headers

    def test_sqli_blocked(self):
        from backend.main import app

        client = TestClient(app)
        # SQL injection attempt in JSON body
        resp = client.post(
            "/api/v1/agent/chat",
            json={"query": "test'; DROP TABLE conversations; --", "language": "en", "stream": False},
        )
        # The SQLi pattern filter rejects the body with 400 before it reaches
        # the endpoint (known over-blocking trade-off, see security report)
        assert resp.status_code == 400

# ─── Audio Module Tests ───────────────────────────────────────────────────────


class TestAudioServices:
    def test_tts_service_init(self):
        from modules.audio import tts_service

        assert tts_service is not None

    def test_stt_service_init(self):
        from modules.audio import stt_service

        assert stt_service is not None
