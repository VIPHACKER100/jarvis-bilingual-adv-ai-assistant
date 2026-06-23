from backend.config import BACKEND_PORT, HINDI_COMMANDS, RESPONSES


def test_config_loading():
    assert BACKEND_PORT is not None
    assert isinstance(HINDI_COMMANDS, dict)
    assert "open_browser" in HINDI_COMMANDS
    assert isinstance(RESPONSES, dict)
    assert "greeting" in RESPONSES


def test_bilingual_responses():
    greeting = RESPONSES.get("greeting")
    assert greeting is not None
    assert "en" in greeting
    assert "hi" in greeting
