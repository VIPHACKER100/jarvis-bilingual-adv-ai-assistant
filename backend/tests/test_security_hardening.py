"""
JARVIS v4.0 — Phase 2 Security Hardening Tests

Guards the "(now)" security fixes:
- ENABLE_DANGEROUS_COMMANDS defaults to false
- PAIRING_SECRET ships without an insecure fallback
- /api/v1/command bodies pass the SQLi keyword filter ("delete file x" is a
  legitimate command), while other JSON endpoints stay protected
- the body-size cap also catches chunked requests (no Content-Length)
- rate-limiter buckets are evicted (no unbounded growth)
- audit log round-trips through the database
"""

import importlib
import sys
import time
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


# ─── 2.3 dangerous-command default ───────────────────────────────────────────


class TestDangerousCommandsDefault:
    def test_defaults_to_false_when_env_unset(self, monkeypatch):
        monkeypatch.delenv("ENABLE_DANGEROUS_COMMANDS", raising=False)
        import config.defaults as defaults

        reloaded = importlib.reload(defaults)
        assert reloaded.ENABLE_DANGEROUS_COMMANDS is False

    def test_opt_in_still_respected(self, monkeypatch):
        monkeypatch.setenv("ENABLE_DANGEROUS_COMMANDS", "true")
        import config.defaults as defaults

        reloaded = importlib.reload(defaults)
        assert reloaded.ENABLE_DANGEROUS_COMMANDS is True


# ─── 2.4 pairing secret has no insecure fallback ─────────────────────────────


class TestPairingSecret:
    def test_unset_env_yields_none(self, monkeypatch):
        monkeypatch.delenv("PAIRING_SECRET", raising=False)
        import config.environment as environment

        reloaded = importlib.reload(environment)
        assert reloaded.PAIRING_SECRET is None

    def test_no_default_secret_shipped(self):
        """The old hardcoded 'JARVIS-SECRET-KEY' fallback must be gone."""
        import config.environment as environment

        if environment.PAIRING_SECRET is not None:
            assert environment.PAIRING_SECRET != "JARVIS-SECRET-KEY"


# ─── 2.5 SQLi filter exemptions & protections ────────────────────────────────


@pytest.fixture
def quiet_memory():
    """Keep /command tests hermetic (no real DB or memory writes)."""
    from modules.context import context_manager
    from modules.memory import memory_manager

    with (
        patch.object(memory_manager, "save_conversation", new=AsyncMock(return_value=True)),
        patch.object(memory_manager.neural, "log_decision", new=AsyncMock(return_value=True)),
        patch.object(context_manager, "update_context", new=AsyncMock(return_value=None)),
        patch.object(context_manager, "suggest_next_action", new=AsyncMock(return_value=None)),
    ):
        yield


class TestSQLiFilter:
    def test_command_endpoint_accepts_delete_keywords(self, quiet_memory):
        """Regression: 'delete file x' was 400-rejected by the keyword filter
        before ever reaching the (fully parameterized) command pipeline."""
        from fastapi.testclient import TestClient

        from backend.main import app

        client = TestClient(app)
        resp = client.post(
            "/api/v1/command",
            json={"command": "delete file zz_nonexistent_dir/zz_nonexistent_file.txt", "language": "en"},
        )
        assert resp.status_code != 400, "command bodies must not be blocked by the SQLi keyword filter"
        assert resp.status_code == 200

    def test_other_json_endpoints_stay_protected(self):
        from fastapi.testclient import TestClient

        from backend.main import app

        client = TestClient(app)
        resp = client.post(
            "/api/v1/agent/chat",
            json={"query": "test'; DROP TABLE conversations; --", "language": "en", "stream": False},
        )
        assert resp.status_code == 400

    def test_exempt_path_set_contents(self):
        from utils.middleware_security import SQLI_EXEMPT_PATHS

        assert "/api/v1/command" in SQLI_EXEMPT_PATHS


# ─── 2.11 body cap & rate-limiter eviction ───────────────────────────────────


class _CaptureSend:
    def __init__(self):
        self.messages = []

    async def __call__(self, message):
        self.messages.append(message)


class TestBodySizeCap:
    async def test_oversized_chunked_body_rejected(self):
        """Regression: only Content-Length was checked, so chunked requests
        (no Content-Length header) bypassed the cap. Drives the raw ASGI
        middleware with multi-chunk receive, i.e. no Content-Length at all."""
        from utils.middleware_security import SQLInjectionMiddleware

        cap = 1024 * 512
        app_called = []

        async def dummy_app(scope, receive, send):
            app_called.append(True)

        async def receive():
            # Two chunks together exceeding the cap, mimicking a chunked upload
            if not receive.called:
                receive.called = True
                return {"type": "http.request", "body": b"x" * cap, "more_body": True}
            return {"type": "http.request", "body": b"y" * 1024, "more_body": False}

        receive.called = False
        scope = {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/agent/chat",
            "headers": [(b"content-type", b"application/json")],
        }
        send = _CaptureSend()

        middleware = SQLInjectionMiddleware(dummy_app)
        await middleware(scope, receive, send)

        status = next(m["status"] for m in send.messages if m["type"] == "http.response.start")
        assert status == 413
        assert not app_called, "oversized body must never reach the app"

    async def test_normal_body_still_reaches_app(self):
        from utils.middleware_security import SQLInjectionMiddleware

        app_called = []

        async def dummy_app(scope, receive, send):
            app_called.append(True)

        body = b'{"query": "hello"}'
        received = []

        async def receive():
            received.append(1)
            if len(received) == 1:
                return {"type": "http.request", "body": body, "more_body": False}
            return {"type": "http.disconnect"}

        scope = {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/agent/chat",
            "headers": [(b"content-type", b"application/json")],
        }
        send = _CaptureSend()

        middleware = SQLInjectionMiddleware(dummy_app)
        await middleware(scope, receive, send)

        assert app_called == [True]


class TestRateLimiterEviction:
    def test_stale_buckets_are_evicted(self):
        from utils.middleware_security import PerRouteRateLimiter

        limiter = PerRouteRateLimiter()
        now = time.monotonic()
        limiter._buckets["stale-client"] = (now - 400.0, 5)  # idle beyond max age
        limiter._buckets["fresh-client"] = (now - 1.0, 1)

        limiter._evict_stale(now)

        assert "stale-client" not in limiter._buckets
        assert "fresh-client" in limiter._buckets

    def test_eviction_runs_periodically_on_check(self):
        from utils.middleware_security import PerRouteRateLimiter

        limiter = PerRouteRateLimiter()
        with patch.object(limiter, "_evict_stale", wraps=limiter._evict_stale) as spy:
            for _ in range(128):
                limiter.check("k", max_calls=100)
            assert spy.call_count == 1


# ─── 2.9 audit log ───────────────────────────────────────────────────────────


class TestAuditLog:
    async def test_audit_roundtrip(self, test_db):
        from utils.database import db_manager

        assert await db_manager.log_audit("quarantine", {"pid": 4242, "action": "terminate"}) is True

        entries = await db_manager.get_audit_log(limit=10)
        assert any(e["event"] == "quarantine" and "4242" in (e["details"] or "") for e in entries)

    async def test_audit_entries_newest_first(self, test_db):
        from utils.database import db_manager

        await db_manager.log_audit("first")
        await db_manager.log_audit("second")

        entries = await db_manager.get_audit_log(limit=10)
        assert entries[0]["event"] == "second"
