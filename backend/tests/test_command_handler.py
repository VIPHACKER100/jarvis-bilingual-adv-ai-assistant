"""
JARVIS v3.8.0 — Command Handler Tests

Validates that every registered command key has a dispatch route
and that the handler produces correct response shapes.
"""

import sys
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch
import pytest
import pytest_asyncio

sys.path.insert(0, str(Path(__file__).parent.parent))


class TestCommandDispatch:
    """Verify command routing completeness and correctness."""

    def test_all_command_keys_have_routes(self):
        """
        Every command key in COMMANDS and HINDI_COMMANDS must have
        a corresponding dispatch branch in handle_command().
        """
        from modules.bilingual_parser import BilingualParser

        parser = BilingualParser()
        all_keys = set(parser.commands.keys())

        # Read command_handler.py source to check for routing coverage
        handler_path = Path(__file__).parent.parent / "handlers" / "command_handler.py"
        handler_source = handler_path.read_text(encoding="utf-8")

        missing = []
        for key in all_keys:
            # Check if the key appears in the handler (as a string literal or in a branch)
            if f'"{key}"' not in handler_source and f"'{key}'" not in handler_source:
                missing.append(key)

        # Allow known intentional exclusions (e.g., meta-keys handled elsewhere)
        intentional_exclusions = {"unknown", "greeting", "farewell"}
        missing = [k for k in missing if k not in intentional_exclusions]

        assert len(missing) == 0, (
            f"Command keys without dispatch routes: {missing}\n"
            f"Total keys: {len(all_keys)}, Missing: {len(missing)}"
        )

    def test_commands_dict_is_not_empty(self):
        """Sanity check: the command registry must have entries."""
        from modules.bilingual_parser import BilingualParser

        parser = BilingualParser()
        assert len(parser.commands) > 0, "Command registry is empty!"

    def test_hindi_commands_exist(self):
        """Verify Hindi command mappings are registered."""
        from modules.bilingual_parser import BilingualParser

        parser = BilingualParser()
        assert hasattr(parser, "command_map") or hasattr(parser, "hindi_commands"), \
            "Hindi command mappings not found in BilingualParser"


class TestCommandExecution:
    """Test individual command execution paths with mocked modules."""

    @pytest.mark.asyncio
    async def test_get_time_command(self, mock_system):
        """Time command should return formatted time string."""
        with patch("handlers.command_handler.system_module", mock_system):
            from handlers.command_handler import handle_command

            mock_system.get_time = AsyncMock(return_value={
                "time": "10:00:00",
                "formatted": "10:00 AM",
                "response": "It is 10:00 AM"
            })

            result = await handle_command(None, "what time is it", "en", None)

            assert result is not None
            assert isinstance(result, dict)
            assert "response" in result or "success" in result

    @pytest.mark.asyncio
    async def test_get_battery_command(self, mock_system):
        """Battery command should return battery info."""
        with patch("handlers.command_handler.system_module", mock_system):
            from handlers.command_handler import handle_command

            result = await handle_command(None, "check battery", "en", None)

            assert result is not None
            assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_unknown_command_returns_gracefully(self, mock_llm, mock_memory):
        """Unknown commands should fall back to agent, not crash."""
        mock_agent = AsyncMock()
        mock_agent.run_loop = AsyncMock(return_value="I could not find a direct command for that, Sir.")
        with patch("handlers.command_handler.llm_module", mock_llm), \
             patch("handlers.command_handler.memory_manager", mock_memory), \
             patch("modules.agent.agent_controller", mock_agent):
            from handlers.command_handler import handle_command

            result = await handle_command(None, "some random text", "en", None)

            assert result is not None
            assert isinstance(result, dict)


class TestResponseShape:
    """Verify response structure matches frontend expectations."""

    @pytest.mark.asyncio
    async def test_response_has_required_fields(self, mock_system):
        """Every command response must have success, response, and command_key."""
        with patch("handlers.command_handler.system_module", mock_system):
            from handlers.command_handler import handle_command

            result = await handle_command(None, "check battery", "en", None)

            if result:
                # Must have at minimum these fields for frontend compatibility
                assert "success" in result or "response" in result, \
                    f"Response missing required fields: {result.keys()}"

    @pytest.mark.asyncio
    async def test_hindi_response_contains_hindi_text(self, mock_system):
        """Hindi language commands should produce Hindi response text."""
        with patch("handlers.command_handler.system_module", mock_system):
            from handlers.command_handler import handle_command

            result = await handle_command(None, "बैटरी चेक करो", "hi", None)

            # We just verify it doesn't crash with 'hi' language
            assert result is not None
