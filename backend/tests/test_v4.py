"""
JARVIS v4.0 — Tests for LLM Gateway, RAG Pipeline, Agent Router, Security Middleware
"""

import sys
import json
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))


# ─── LLM Gateway Tests ────────────────────────────────────────────────────────

class TestCostTracker:
    @pytest.fixture
    def cost_tracker(self):
        from modules.llm_gateway.cost import CostTracker
        ct = CostTracker()
        ct.track("test_provider", tokens_input=100, tokens_output=50, duration_ms=200)
        ct.track("test_provider", tokens_input=50, tokens_output=25, duration_ms=100)
        return ct

    def test_track_and_stats(self, cost_tracker):
        stats = cost_tracker.stats()
        assert stats["total_requests"] == 2
        assert stats["total_tokens_input"] == 150
        assert stats["total_tokens_output"] == 75
        assert stats["total_duration_ms"] == 300

    def test_reset(self, cost_tracker):
        cost_tracker.reset()
        stats = cost_tracker.stats()
        assert stats["total_requests"] == 0

    def test_estimate_cost(self):
        from modules.llm_gateway.cost import CostTracker
        ct = CostTracker()
        cost = ct.estimate_cost("nvidia", 100, 50)
        assert cost > 0


class TestCircuitBreaker:
    @pytest.fixture
    def cb(self):
        from modules.llm_gateway.adapters import CircuitBreaker
        return CircuitBreaker(max_failures=2, reset_timeout=1.0)

    @pytest.mark.asyncio
    async def test_initial_state(self, cb):
        assert cb.state == "closed"

    @pytest.mark.asyncio
    async def test_trip_on_failures(self, cb):
        cb.record_failure()
        cb.record_failure()
        assert cb.state == "open"

    @pytest.mark.asyncio
    async def test_reset_after_timeout(self, cb):
        cb.record_failure()
        cb.record_failure()
        assert cb.state == "open"
        import asyncio
        await asyncio.sleep(1.1)
        assert cb.state == "half-open"

    @pytest.mark.asyncio
    async def test_success_resets(self, cb):
        cb.record_failure()
        cb.record_failure()
        assert cb.state == "open"
        import asyncio
        await asyncio.sleep(1.1)
        assert cb.allow_request()
        cb.record_success()
        assert cb.state == "closed"


@pytest.mark.asyncio
class TestLLMGateway:
    async def test_no_provider_returns_none(self):
        with patch.dict("os.environ", {}, clear=True):
            from modules.llm_gateway.gateway import LLMGateway
            gw = LLMGateway()
            result = await gw.generate("hello")
            assert result is None

    async def test_gateway_import(self):
        from modules.llm_wrapper import llm_module, llm_client
        assert llm_module is not None
        assert llm_client is not None


# ─── RAG Pipeline Tests ───────────────────────────────────────────────────────

@pytest.mark.asyncio
class TestRAGPipeline:
    async def test_empty_context(self):
        from modules.rag import rag_pipeline
        ctx = await rag_pipeline.retrieve("hello world", force_refresh=False)
        assert ctx is not None
        assert ctx.query == "hello world"

    async def test_format_context(self):
        from modules.rag import rag_pipeline
        result = await rag_pipeline.format_context_for_llm("test query", max_tokens=100)
        assert isinstance(result, str)


# ─── Agent Router Tests ───────────────────────────────────────────────────────

class TestAgentRouter:
    def test_health_endpoint(self):
        from backend.main import app
        client = TestClient(app)
        resp = client.get("/api/v1/agent/health")
        assert resp.status_code == 403 or resp.status_code == 200

    def test_chat_endpoint_validation(self):
        from backend.main import app
        client = TestClient(app)
        resp = client.post("/api/v1/agent/chat", json={"query": ""})
        # Empty query should fail validation
        assert resp.status_code in (422, 403)

    def test_rag_endpoint(self):
        from backend.main import app
        client = TestClient(app)
        resp = client.post("/api/v1/agent/rag", json={"query": "test"})
        assert resp.status_code in (200, 403)


# ─── Security Middleware Tests ─────────────────────────────────────────────────

class TestSecurityMiddleware:
    def test_security_headers(self):
        from backend.main import app
        client = TestClient(app)
        resp = client.get("/health")
        headers = resp.headers
        assert "X-Content-Type-Options" in headers
        assert "X-Frame-Options" in headers
        assert "X-XSS-Protection" in headers

    def test_sqli_blocked(self):
        from backend.main import app
        client = TestClient(app)
        # SQL injection attempt in JSON body
        resp = client.post(
            "/api/v1/memory/fact",
            json={"key": "test'; DROP TABLE conversations; --", "value": "test", "category": "test"},
        )
        # Should either be blocked (400) or pass through to auth (403)
        assert resp.status_code in (400, 403)

    def test_per_route_limiter(self):
        from utils.middleware_security import per_route_limiter
        key = "test_key"
        # First 3 calls should pass
        assert per_route_limiter.check(key, max_calls=3, window_sec=60)
        assert per_route_limiter.check(key, max_calls=3, window_sec=60)
        assert per_route_limiter.check(key, max_calls=3, window_sec=60)
        # 4th should fail
        assert not per_route_limiter.check(key, max_calls=3, window_sec=60)


# ─── Audio Module Tests ───────────────────────────────────────────────────────

class TestAudioServices:
    def test_tts_service_init(self):
        from modules.audio import tts_service
        assert tts_service is not None

    def test_stt_service_init(self):
        from modules.audio import stt_service
        assert stt_service is not None
