import json
import re
import sys
from pathlib import Path
from typing import Dict, Optional, Tuple

from rapidfuzz import fuzz

# Load command data from JSON file
_commands_path = Path(__file__).parent.parent / "config" / "commands.json"
_commands_data = {}
if _commands_path.exists():
    with open(_commands_path, "r", encoding="utf-8") as _f:
        _commands_data = json.load(_f)

HINDI_COMMANDS: dict = _commands_data.get("hindi_commands", {})
RESPONSES: dict = _commands_data.get("responses", {})

sys.path.insert(0, str(Path(__file__).parent.parent))


class BilingualParser:
    """Parse and translate between Hindi and English commands"""

    def __init__(self):
        self.commands = HINDI_COMMANDS
        self.command_map = self._build_command_map()

    def _build_command_map(self) -> Dict[str, str]:
        """Build reverse mapping from Hindi phrases to command keys"""
        mapping = {}
        for command_key, phrases in HINDI_COMMANDS.items():
            for phrase in phrases:
                key = phrase.lower().strip()
                if key and key not in mapping:
                    mapping[key] = command_key
        return mapping

    def _phrase_matches(self, phrase: str, text_lower: str) -> bool:
        """Match phrase with word boundaries for single-token triggers."""
        if text_lower == phrase:
            return True
        if " " in phrase:
            return phrase in text_lower
        return bool(re.search(r"(?<!\w)" + re.escape(phrase) + r"(?!\w)", text_lower))

    def detect_language(self, text: str) -> str:
        """Detect if text is Hindi or English"""
        # Check for Devanagari script
        devanagari_chars = set("ंःअआइईउऊऋऌऍऎएऐऑऒओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह़ािीुूृॄॅेैॉोौ्")
        if any(char in devanagari_chars for char in text):
            return "hi"

        # Check for common Hindi words in Latin script
        hindi_words = {
            "kholo",
            "band",
            "karo",
            "chalao",
            "bhejo",
            "kaun",
            "kya",
            "hai",
            "samay",
            "tareekh",
            "din",
            "aaj",
            "kal",
            "suno",
            "sun",
            "raha",
            "mujhe",
            "tum",
            "aap",
            "namaste",
            "shukriya",
            "dhanyavad",
            "kaise",
            "madad",
            "sakte",
            "ho",
            "btao",
            "batao",
            "dekhna",
            "ruko",
            "dheere",
            "tez",
            "badhao",
            "kam",
            "aawaz",
            "awaz",
            "par",
            "ko",
            "me",
            "se",
            "ka",
            "ki",
            "aur",
            "kahan",
            "kab",
            "kyu",
            "mausam",
            "tapman",
            "garmi",
            "sardi",
            "hisab",
            "jodo",
            "ghatao",
            "guna",
            "bhag",
            "kardo",
            "dijiye",
            "nikalo",
            "banao",
            "dikhao",
            "zyada",
            "kam",
        }

        words = set(text.lower().split())
        if words & hindi_words:
            return "hi"

        return "en"

    def parse_command(self, text: str) -> Tuple[str, str, Optional[str]]:
        """
        Parse command text and return (command_key, language, parameters)
        """
        text_lower = text.lower().strip()
        lang = self.detect_language(text_lower)

        # Try to match against Hindi command phrases (sorted by length to match longest first)
        sorted_phrases = sorted(self.command_map.items(), key=lambda x: len(x[0]), reverse=True)

        best_match = None
        best_score = 0
        best_phrase = ""

        # Phase 1: longest exact phrase wins (avoids fuzzy stealing short inputs)
        for phrase, cmd_key in sorted_phrases:
            if self._phrase_matches(phrase, text_lower) and len(phrase) > len(best_phrase):
                best_score = 100
                best_match = cmd_key
                best_phrase = phrase

        # Phase 2: fuzzy only if no exact match
        if not best_match:
            for phrase, cmd_key in sorted_phrases:
                if len(phrase) >= 8:
                    if " " in phrase and " " not in text_lower:
                        score = 0
                    elif len(text_lower) >= len(phrase) * 0.45:
                        score = fuzz.partial_ratio(phrase, text_lower)
                    else:
                        score = 0
                else:
                    score = 0
                if score > best_score and score >= 85:
                    best_score = score
                    best_match = cmd_key
                    best_phrase = phrase

        if best_match:
            command_key = best_match
            phrase = best_phrase

            # Special handling for "search" to avoid matching "search file" incorrectly
            if phrase == "search" and "search file" in text_lower:
                pass  # Don't return here, let English fallback handle it if no other match
            else:
                # For fuzzy matches, finding the exact index for parameter extraction is tricky.
                # We'll use a simple approach: if it was a perfect match, we extract exactly.
                # If fuzzy, we might just pass the whole text as params and clean it later.
                if best_score == 100:
                    phrase_index = text_lower.find(phrase)
                    params_after = text[phrase_index + len(phrase) :].strip()
                    params_before = text[:phrase_index].strip()
                else:
                    # For fuzzy, we can't easily split. Assume the whole text (minus some noise) is the param or there are no params
                    params_after = text_lower
                    params_before = ""

                # Clean up Hindi trailing noise words
                noise_hindi_words = {
                    "karo",
                    "khol",
                    "chalao",
                    "kholiye",
                    "dikhaiye",
                    "bataiye",
                    "kijiye",
                    "kar",
                    "kardo",
                    "dijiye",
                    "nikalo",
                    "banao",
                    "dikhao",
                    "dekhoo",
                    "dekhao",
                    "mein",
                    "me",
                    "se",
                    "ka",
                    "ki",
                    "करो",
                    "खोलें",
                    "चालू करो",
                    "चलाओ",
                    "कीजिए",
                    "बताओ",
                    "दिखाओ",
                    "में",
                    "को",
                    "पर",
                    "कर",
                    "दो",
                    "करदो",
                    "निकालो",
                    "बनाओ",
                }
                clean_after = params_after
                for _ in range(2):
                    for word in noise_hindi_words:
                        if clean_after.endswith(" " + word):
                            clean_after = clean_after[: -(len(word) + 1)].strip()
                        elif clean_after == word:
                            clean_after = ""
                        if clean_after.startswith(word + " "):
                            clean_after = clean_after[len(word) + 1 :].strip()
                        elif clean_after == word:
                            clean_after = ""

                # Parameter extraction logic
                if lang == "hi":
                    if params_before and clean_after:
                        params = f"{params_before} {clean_after}"
                    elif params_before:
                        params = params_before
                    else:
                        params = clean_after if clean_after else params_after
                else:
                    params = params_after

                # Cleanup parameters
                prev_params = None
                clean_params = params
                while clean_params != prev_params:
                    prev_params = clean_params
                    clean_params = re.sub(
                        r"^(?:and|for|ki|ka|ko|se|mein|me|search|search\s+for|google|google\s+search|open|start|with)\s+",
                        "",
                        clean_params,
                        flags=re.IGNORECASE,
                    ).strip()

                # If parameters were cleaned but now look like a search, change command_key
                if (
                    clean_params
                    and command_key in ["open_browser", "open_app"]
                    and ("search" in text_lower or "new tab" in text_lower)
                ):
                    return "google_search", lang, clean_params

                # If fuzzy match, clean_params might just be the whole string.
                # That's fine for search, but for things like 'shutdown' we don't want params.
                if best_score < 100 and command_key in [
                    "shutdown",
                    "restart",
                    "sleep",
                    "mute",
                    "volume_up",
                    "volume_down",
                ]:
                    clean_params = None

                return command_key, lang, clean_params if clean_params else None

        # Try English patterns
        if any(word in text_lower for word in ["google search", "search google for", "search for"]):
            query = (
                text_lower.replace("google search", "")
                .replace("search google for", "")
                .replace("search for", "")
                .strip()
            )
            return "google_search", lang, query if query else None
        elif any(word in text_lower for word in ["new tab", "open browser", "open chrome", "search"]):
            query = (
                text_lower.replace("new tab", "")
                .replace("open browser", "")
                .replace("open chrome", "")
                .replace("search", "")
                .strip()
            )
            # If there's content after "search", it's a google search
            if query and ("search" in text_lower or "new tab" in text_lower or "open" in text_lower):
                # Aggressively cleanup leading particles
                prev_query = None
                while query != prev_query:
                    prev_query = query
                    query = re.sub(
                        r"^(?:and|for|ki|ko|search|search\s+for|google|google\s+search|open|start|with)\s+",
                        "",
                        query,
                        flags=re.IGNORECASE,
                    ).strip()

                if query:
                    return "google_search", lang, query
            return "open_browser", lang, None
        elif any(word in text_lower for word in ["shutdown", "turn off", "power off"]):
            return "shutdown", lang, None
        elif any(word in text_lower for word in ["restart", "reboot"]):
            return "restart", lang, None
        elif any(word in text_lower for word in ["sleep", "suspend"]):
            return "sleep", lang, None
        elif any(
            kw in text_lower
            for kw in [
                "volume up",
                "increase volume",
                "increase sound",
                "increase audio",
                "raise volume",
                "raise sound",
                "louder",
            ]
        ):
            return "volume_up", lang, None
        elif any(
            kw in text_lower
            for kw in [
                "volume down",
                "decrease volume",
                "decrease sound",
                "decrease audio",
                "lower volume",
                "lower sound",
                "quieter",
            ]
        ):
            return "volume_down", lang, None
        elif any(kw in text_lower for kw in ["mute", "silence", "no sound", "toggle mute", "unmute"]):
            return "mute", lang, None
        elif any(word in text_lower for word in ["time", "what time"]):
            return "time", lang, None
        elif any(word in text_lower for word in ["date", "what date", "today"]):
            return "date", lang, None
        elif any(word in text_lower for word in ["battery", "charge"]):
            return "battery", lang, None
        elif any(word in text_lower for word in ["system status", "pc status", "status check"]):
            return "system_status", lang, None
        # Media playback English fallback
        elif any(
            kw in text_lower
            for kw in [
                "play music",
                "play song",
                "play audio",
                "play video",
                "start music",
                "start song",
                "start playing",
                "resume music",
                "resume song",
                "resume media",
                "resume playing",
                "pause music",
                "pause song",
                "pause media",
                "toggle music",
                "toggle media",
                "play media",
                "play pause",
            ]
        ):
            return "media_play", lang, None
        elif any(kw in text_lower for kw in ["next track", "next song", "next music", "skip song", "skip track"]):
            return "media_next", lang, None
        elif any(
            kw in text_lower for kw in ["previous track", "previous song", "previous music", "prev track", "prev song"]
        ):
            return "media_previous", lang, None
        # Screenshot English fallback
        elif any(kw in text_lower for kw in ["take screenshot", "screenshot", "screen capture"]):
            return "take_screenshot", lang, None

        return "unknown", lang, None

    def get_response(self, response_key: str, lang: str, *args) -> str:
        """Get response text in the appropriate language with random variety support"""
        import random

        lang_key = "hi" if lang in ("hi", "hi-IN") else "en"
        entry = RESPONSES.get(response_key, {})
        template = entry.get(lang_key, entry.get("en", "Unknown response"))

        if isinstance(template, list):
            template = random.choice(template)

        return template.format(*args) if args else template


# Singleton instance
parser = BilingualParser()
