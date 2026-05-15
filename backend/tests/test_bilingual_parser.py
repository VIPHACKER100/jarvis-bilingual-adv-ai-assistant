"""
JARVIS v3.8.0 — Bilingual Parser Tests
"""
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


class TestBilingualParsing:
    """Test bilingual command parsing accuracy."""

    def test_english_command_parsing(self):
        from modules.bilingual_parser import BilingualParser
        parser = BilingualParser()
        result = parser.parse_command("what time is it")
        assert result is not None
        key, lang, params = result
        assert key is not None
        assert lang in ("en", "hi", "hinglish")

    def test_hindi_command_parsing(self):
        from modules.bilingual_parser import BilingualParser
        parser = BilingualParser()
        result = parser.parse_command("समय बताओ")
        assert result is not None

    def test_empty_string_handling(self):
        from modules.bilingual_parser import BilingualParser
        parser = BilingualParser()
        result = parser.parse_command("")
        # Should return None or a default "unknown" mapping, not crash
        assert result is None or result[0] == "unknown"

    def test_language_detection_english(self):
        from modules.bilingual_parser import BilingualParser
        parser = BilingualParser()
        assert parser.detect_language("open chrome browser") in ("en", "hinglish")

    def test_language_detection_hindi(self):
        from modules.bilingual_parser import BilingualParser
        parser = BilingualParser()
        assert parser.detect_language("ब्राउज़र खोलो") == "hi"

    def test_all_commands_have_phrases(self):
        """Every command key should have at least one trigger phrase."""
        from modules.bilingual_parser import BilingualParser
        parser = BilingualParser()
        for key, phrases in parser.commands.items():
            assert len(phrases) > 0, f"Command '{key}' has no trigger phrases"

    def test_reverse_hindi_mapping(self):
        """Hindi phrases should map back to valid command keys."""
        from modules.bilingual_parser import BilingualParser
        parser = BilingualParser()
        if hasattr(parser, "command_map"):
            for phrase, key in parser.command_map.items():
                assert key in parser.commands, \
                    f"Hindi phrase '{phrase}' maps to unknown key '{key}'"
