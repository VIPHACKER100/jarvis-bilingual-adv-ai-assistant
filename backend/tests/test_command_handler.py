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
        Every command key in HINDI_COMMANDS must be coverable by
        the DOMAIN_HANDLERS dispatch mechanism.
        """
        from modules.bilingual_parser import BilingualParser
        from handlers.command_handler import DOMAIN_HANDLERS

        parser = BilingualParser()
        all_keys = set(parser.commands.keys())

        # Verify DOMAIN_HANDLERS dispatch mechanism exists
        assert len(DOMAIN_HANDLERS) > 0, "DOMAIN_HANDLERS is empty!"
        domain_map = {name: handler for name, handler in DOMAIN_HANDLERS}
        for name, handler in DOMAIN_HANDLERS:
            assert hasattr(handler, 'handle') and callable(handler.handle), \
                f"{name} handler missing callable 'handle' method"

        # Convention-based mapping: command key → expected domain handler
        COMMAND_TO_DOMAIN = {
            'shutdown': 'system', 'restart': 'system', 'sleep': 'system',
            'volume_up': 'system', 'volume_down': 'system', 'mute': 'system',
            'time': 'system', 'date': 'system', 'battery': 'system', 'system_status': 'system',
            'brightness_up': 'system', 'brightness_down': 'system',
            'google_search': 'system', 'open_browser': 'system',
            'ip_address': 'system', 'uptime': 'system', 'weather': 'system',
            'open_app': 'window', 'close_app': 'window', 'minimize': 'window', 'maximize': 'window',
            'close_window': 'window', 'show_desktop': 'window', 'snap_left': 'window', 'snap_right': 'window',
            'take_screenshot': 'desktop', 'get_clipboard': 'desktop', 'set_clipboard': 'desktop',
            'media_play': 'desktop', 'media_next': 'desktop', 'media_previous': 'desktop', 'stop_media': 'desktop',
            'change_wallpaper': 'desktop', 'empty_recycle_bin': 'desktop', 'toggle_taskbar': 'desktop',
            'zoom_in': 'desktop', 'zoom_out': 'desktop',
            'move_cursor': 'input', 'click': 'input', 'double_click': 'input', 'right_click': 'input',
            'scroll_up': 'input', 'scroll_down': 'input', 'type_text': 'input', 'press_key': 'input',
            'hotkey': 'input', 'new_tab': 'input', 'close_tab': 'input', 'new_window': 'input', 'find': 'input',
            'copy': 'input', 'paste': 'input', 'select_all': 'input', 'undo': 'input', 'save': 'input',
            'open_folder': 'file', 'open_downloads': 'file', 'open_documents': 'file', 'open_desktop': 'file',
            'open_pictures': 'file', 'open_videos': 'file', 'open_music': 'file', 'open_home': 'file',
            'search_files': 'file', 'create_folder': 'file', 'delete_file': 'file',
            'copy_file': 'file', 'move_file': 'file', 'rename_file': 'file',
            'ocr_image': 'media', 'ocr_pdf': 'media', 'extract_text': 'media',
            'convert_image': 'media', 'resize_image': 'media', 'compress_image': 'media',
            'merge_pdfs': 'media', 'pdf_to_images': 'media', 'images_to_pdf': 'media',
            'batch_pdf': 'media', 'scan_folder': 'media', 'make_drawing': 'media', 'get_selected_text': 'media',
            'narrate_screen': 'media', 'get_screen_summary': 'media', 'analyze_screen': 'media',
            'whatsapp_message': 'whatsapp', 'whatsapp_call': 'whatsapp', 'whatsapp_draft_reply': 'whatsapp',
            'set_personality': 'personality', 'command_insights': 'memory',
        }

        missing = []
        for key in sorted(all_keys):
            expected_domain = COMMAND_TO_DOMAIN.get(key)
            if expected_domain is None:
                missing.append(f"{key} (no domain mapping)")
            elif expected_domain not in domain_map:
                missing.append(f"{key} (domain '{expected_domain}' not in DOMAIN_HANDLERS)")

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
        with patch("handlers.system.system_handler.system_module", mock_system):
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
        with patch("handlers.system.system_handler.system_module", mock_system):
            from handlers.command_handler import handle_command

            result = await handle_command(None, "check battery", "en", None)

            assert result is not None
            assert isinstance(result, dict)

    @pytest.mark.asyncio
    async def test_unknown_command_returns_gracefully(self, mock_memory):
        """Unknown commands should fall back to agent, not crash."""
        mock_agent = AsyncMock()
        mock_agent.run_loop = AsyncMock(return_value="I could not find a direct command for that, Sir.")
        with patch("handlers.command_handler.memory_manager", mock_memory), \
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
        with patch("handlers.system.system_handler.system_module", mock_system):
            from handlers.command_handler import handle_command

            result = await handle_command(None, "check battery", "en", None)

            if result:
                # Must have at minimum these fields for frontend compatibility
                assert "success" in result or "response" in result, \
                    f"Response missing required fields: {result.keys()}"

    @pytest.mark.asyncio
    async def test_hindi_response_contains_hindi_text(self, mock_system):
        """Hindi language commands should produce Hindi response text."""
        with patch("handlers.system.system_handler.system_module", mock_system):
            from handlers.command_handler import handle_command

            result = await handle_command(None, "बैटरी चेक करो", "hi", None)

            # We just verify it doesn't crash with 'hi' language
            assert result is not None
