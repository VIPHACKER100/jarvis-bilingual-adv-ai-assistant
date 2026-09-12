"""
JARVIS v4.0 — P0 Regression Tests

Guards the Phase-0 fixes against regressions:
- log_command accepts an optional details dict (volume/mute/brightness reporting)
- dangerous commands create confirmations, and approving them re-executes the action
- the agent ReAct loop reaches a Final Answer through the LLM wrapper
- WebSocketMessage carries a "confirmation" data payload
- the /ws handler survives malformed JSON frames
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


# ─── 0.1 log_command signature ───────────────────────────────────────────────


class TestLogCommandSignature:
    def test_accepts_details_dict(self, caplog):
        """4-arg form used by system.volume_up etc. must not raise."""
        from utils.logger_structured import log_command

        log_command("volume_up", "volume_up", True, {"from": 50, "to": 60, "amount": 10})

    def test_accepts_details_kwarg(self, caplog):
        """details= kwarg form used by security.confirm_command must not raise."""
        from utils.logger_structured import log_command

        log_command("shutdown", "shutdown", success=True, details={"confirmed": True, "confirmation_id": "x"})

    def test_backward_compatible_three_args(self):
        from utils.logger_structured import log_command

        log_command("time", "time", True)

    def test_details_reach_the_log_record(self, caplog):
        import logging

        from utils.logger_structured import log_command

        with caplog.at_level(logging.INFO, logger="jarvis.event"):
            log_command("volume_up", "volume_up", True, {"to": 60})
        assert "to=60" in caplog.text


# ─── 0.1 volume endpoints report success ─────────────────────────────────────


class TestVolumeReporting:
    async def test_volume_up_reports_success(self):
        """Regression: log_command TypeError used to be swallowed by the broad
        except, making a successful volume change report 'not understood'."""
        from modules.system import system_module

        with patch("modules.system.get_volume", new=AsyncMock(return_value=50)), patch(
            "modules.system.set_volume", new=AsyncMock(return_value=True)
        ):
            result = await system_module.volume_up(10, "en")

        assert result["success"] is True
        assert result["volume"] == 60
        assert "not understood" not in result["response"].lower()

    async def test_mute_reports_success(self):
        from modules.system import system_module

        with patch("modules.system.is_muted", new=AsyncMock(return_value=False)), patch(
            "modules.system.set_mute", new=AsyncMock(return_value=True)
        ):
            result = await system_module.toggle_mute("en")

        assert result["success"] is True
        assert result["is_muted"] is True
        assert "not understood" not in result["response"].lower()


# ─── 0.2 confirmation flow end-to-end ────────────────────────────────────────


@pytest.fixture
def quiet_memory():
    """Silence memory/context writes so tests stay hermetic."""
    from modules.context import context_manager
    from modules.memory import memory_manager

    with (
        patch.object(memory_manager, "save_conversation", new=AsyncMock(return_value=True)),
        patch.object(memory_manager.neural, "log_decision", new=AsyncMock(return_value=True)),
        patch.object(context_manager, "update_context", new=AsyncMock(return_value=None)),
        patch.object(context_manager, "suggest_next_action", new=AsyncMock(return_value=None)),
    ):
        yield


class TestConfirmationFlow:
    async def test_shutdown_creates_confirmation_and_approval_executes(self, quiet_memory):
        """Regression: handle_command required success=True before creating a
        confirmation (shutdown returns success=False when unconfirmed), and
        confirm_command never re-executed the action. Both are covered here."""
        from modules.command_handler import handle_command
        from modules.security import security

        with patch("modules.system.shutdown_system", new=AsyncMock(return_value=(True, "", ""))) as mock_shutdown:
            result = await handle_command(None, "shutdown the computer", "en", session_id="test")

            assert result["requires_confirmation"] is True
            cid = result["confirmation_id"]
            assert cid, "a pending confirmation id must be returned to the client"
            assert mock_shutdown.await_count == 0, "shutdown must not execute before approval"

            outcome = await security.confirm_command(cid, True)

        assert outcome is not None
        assert outcome["confirmed"] is True
        assert outcome["result"]["success"] is True
        assert mock_shutdown.await_count == 1, "approval must re-dispatch the command"

    async def test_denial_does_not_execute(self, quiet_memory):
        from modules.command_handler import handle_command
        from modules.security import security

        with patch("modules.system.shutdown_system", new=AsyncMock(return_value=(True, "", ""))) as mock_shutdown:
            result = await handle_command(None, "shutdown the computer", "en", session_id="test")
            outcome = await security.confirm_command(result["confirmation_id"], False)

        assert outcome == {"confirmed": False, "result": None}
        assert mock_shutdown.await_count == 0

    async def test_unknown_confirmation_id_returns_none(self):
        from modules.security import security

        assert await security.confirm_command("no-such-id", True) is None

    async def test_double_decision_returns_none(self, quiet_memory):
        from modules.command_handler import handle_command
        from modules.security import security

        with patch("modules.system.shutdown_system", new=AsyncMock(return_value=(True, "", ""))):
            result = await handle_command(None, "shutdown the computer", "en", session_id="test")
            cid = result["confirmation_id"]
            first = await security.confirm_command(cid, True)
            second = await security.confirm_command(cid, True)

        assert first is not None
        assert second is None, "a decided confirmation must not be re-decided"

    async def test_pending_actions_listing(self, quiet_memory):
        """Regression: GET /pending called security.get_pending_actions()
        which did not exist (AttributeError -> 500)."""
        from modules.command_handler import handle_command
        from modules.security import security

        assert isinstance(security.get_pending_actions(), list), "must not raise"

        with patch("modules.system.shutdown_system", new=AsyncMock(return_value=(True, "", ""))):
            await handle_command(None, "shutdown the computer", "en", session_id="test")

        pending = security.get_pending_actions()
        assert any(p["command_key"] == "shutdown" for p in pending)


# ─── 0.3 agent loop / LLM wrapper ────────────────────────────────────────────


class TestAgentLoop:
    async def test_get_agent_response_uses_real_client_and_injects_context(self):
        """Regression: a module-level alias once made every wrapper method
        call itself (AttributeError), and doubled braces kept tools/neural
        context out of the prompt entirely."""
        import modules.llm_client as lc

        with patch.object(lc, "llm_client") as mock_client:
            mock_client.chat = AsyncMock(return_value="Thought: done.\nFinal Answer: 42")
            result = await lc.llm_module.get_agent_response(
                query="What is the answer?",
                tools_context='[{"name": "system_status"}]',
                neural_context="NEURAL_FACT_123",
                history=[{"thought": "t1", "action": '{"name": "time"}', "observation": "10:00"}],
                language="en",
            )

        assert result == "Thought: done.\nFinal Answer: 42"

        kwargs = mock_client.chat.await_args.kwargs
        context = kwargs["context"]
        assert '[{"name": "system_status"}]' in context, "tools_context must be injected into the prompt"
        assert "NEURAL_FACT_123" in context, "neural_context must be injected into the prompt"
        assert "{tools_context}" not in context, "format placeholder must not leak literally"

        history = kwargs["history"]
        assert any("Thought: t1" in m["content"] for m in history), "ReAct history must reach the LLM"
        assert any("Observation: 10:00" in m["content"] for m in history)

    async def test_wrapper_chat_methods_reach_real_client(self):
        """Regression: get_response/ping_llm/get_embedding once resolved to a
        self-alias and raised AttributeError. They must reach the client."""
        import modules.llm_client as lc

        with patch.object(lc, "llm_client") as mock_client:
            mock_client.chat = AsyncMock(return_value="hello")
            mock_client.chat_stream = AsyncMock(return_value=iter(["a", "b"]))
            mock_client.ping = AsyncMock(return_value=True)
            mock_client.get_embedding = AsyncMock(return_value=[0.1, 0.2])

            assert await lc.llm_module.get_response("hi") == "hello"
            assert await lc.llm_module.ping_llm() is True
            assert await lc.llm_module.get_embedding("hi") == [0.1, 0.2]

    async def test_run_loop_reaches_final_answer(self):
        """Full ReAct loop: one iteration must produce the final answer
        instead of exhausting MAX_ITERATIONS on AttributeError retries."""
        import modules.llm_client as lc
        from modules.agent import agent_controller
        from modules.memory import memory_manager

        with (
            patch.object(lc, "llm_client") as mock_client,
            patch.object(memory_manager.neural, "get_neural_context", new=AsyncMock(return_value="")),
        ):
            mock_client.chat = AsyncMock(return_value="Thought: I have all the information needed.\nFinal Answer: The answer is 42.")
            result = await agent_controller.run_loop("What is the answer to everything?", "en", "test-session")

        assert "42" in result
        assert "couldn't reach a final conclusion" not in result
        assert mock_client.chat.await_count == 1, "a Final Answer must stop the loop after one iteration"


# ─── Live-run regressions (caught during the first real server session) ──────


class TestPydanticCommandResponses:
    async def test_time_command_returns_dict(self, quiet_memory):
        """Regression: get_time returns a Pydantic TimeResponse, but
        handle_command called .get() on the result — 'what time is it'
        500'd via REST and WS. dispatch_command must normalize models."""
        from modules.command_handler import handle_command

        result = await handle_command(None, "what time is it", "en", session_id="test")
        assert isinstance(result, dict)
        assert result["success"] is True
        assert result["response"]

    async def test_dispatch_normalizes_pydantic_models(self):
        from modules.command_handler import dispatch_command

        result = await dispatch_command("date", None, "en")
        assert isinstance(result, dict), "Pydantic responses must be model_dump'ed"
        assert result.get("success") is True


class TestDecisionLogging:
    async def test_log_decision_writes_without_missing_sync(self, tmp_path):
        """Regression: log_decision scheduled a self.sync_vectors() task that
        no longer exists — every decision log raised AttributeError in a
        fire-and-forget task."""
        from modules.memory import NeuralMemoryManager

        m = NeuralMemoryManager()
        m.memory_dir = tmp_path  # keep the write hermetic
        await m.log_decision("test command", "test_action", "APPROVED", "automated regression test")
        content = await m.get_node("decisions.md")
        assert content is not None and "test_action" in content


# ─── 0.4 WebSocket message schema ────────────────────────────────────────────


class TestWebSocketSchema:
    def test_confirmation_payload_accepted(self):
        """Regression: WebSocketMessage had no `data` field, so the /ws
        'confirmation' branch crashed with AttributeError."""
        from models import WebSocketMessage

        msg = WebSocketMessage(type="confirmation", data={"confirmation_id": "abc", "approved": True})
        assert msg.data == {"confirmation_id": "abc", "approved": True}

    def test_command_payload_still_works(self):
        from models import WebSocketMessage

        msg = WebSocketMessage(type="command", command="what time is it", language="en")
        assert msg.command == "what time is it"
        assert msg.data is None


class TestWebSocketHandler:
    def test_malformed_json_gets_error_frame_not_disconnect(self):
        """Regression: json.loads sat outside the validation try, so malformed
        JSON killed the connection instead of returning an error frame."""
        from fastapi.testclient import TestClient
        from main import app

        client = TestClient(app)
        with client.websocket_connect("/ws?client_id=p0test") as ws:
            ws.send_text("this is not json")
            resp = ws.receive_json()
            assert resp["type"] == "error"

            # Connection must still be alive
            ws.send_text('{"type": "ping"}')
            assert ws.receive_json()["type"] == "pong"
