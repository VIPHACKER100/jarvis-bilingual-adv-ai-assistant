from config import HINDI_COMMANDS, RESPONSES
from typing import Dict, Tuple, Optional
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))


class BilingualParser:
    """Parse and translate between Hindi and English commands"""

    def __init__(self):
        self.command_map = self._build_command_map()

    def _build_command_map(self) -> Dict[str, str]:
        """Build reverse mapping from Hindi phrases to command keys"""
        mapping = {}
        for command_key, phrases in HINDI_COMMANDS.items():
            for phrase in phrases:
                mapping[phrase.lower()] = command_key
        return mapping

    def detect_language(self, text: str) -> str:
        """Detect if text is Hindi or English"""
        # Check for Devanagari script
        devanagari_chars = set(
            'ंःअआइईउऊऋऌऍऎएऐऑऒओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह़ािीुूृॄॅेैॉोौ्')
        if any(char in devanagari_chars for char in text):
            return 'hi'

        # Check for common Hindi words in Latin script
        hindi_words = {
            'kholo',
            'band',
            'karo',
            'chalao',
            'bhejo',
            'kaun',
            'kya',
            'hai',
            'samay',
            'tareekh',
            'din',
            'aaj',
            'kal',
            'suno',
            'sun',
            'raha',
            'mujhe',
            'tum',
            'aap',
            'namaste',
            'shukriya',
            'dhanyavad',
            'kaise',
            'madad',
            'sakte',
            'ho',
            'btao',
            'batao',
            'dekhna',
            'ruko',
            'dheere',
            'tez',
            'badhao',
            'kam',
            'aawaz',
            'awaz',
            'par',
            'ko',
            'me',
            'se',
            'ka',
            'ki',
            'aur',
            'kahan',
            'kab',
            'kyu',
            'mausam',
            'tapman',
            'garmi',
            'sardi',
            'hisab',
            'jodo',
            'ghatao',
            'guna',
            'bhag'}

        words = set(text.lower().split())
        if words & hindi_words:
            return 'hi'

        return 'en'

    def parse_command(self, text: str) -> Tuple[str, str, Optional[str]]:
        """
        Parse command text and return (command_key, language, parameters)
        """
        text_lower = text.lower().strip()
        lang = self.detect_language(text_lower)

        # Try to match against Hindi command phrases
        for phrase, command_key in self.command_map.items():
            if phrase in text_lower:
                # Extract parameters (text after the command phrase)
                param_start = text_lower.find(phrase) + len(phrase)
                params = text[param_start:].strip()
                return command_key, lang, params if params else None

        # Try English patterns
        if any(
            word in text_lower for word in [
                'shutdown',
                'turn off',
                'power off']):
            return 'shutdown', lang, None
        elif any(word in text_lower for word in ['restart', 'reboot']):
            return 'restart', lang, None
        elif any(word in text_lower for word in ['sleep', 'suspend']):
            return 'sleep', lang, None
        elif 'volume up' in text_lower or 'increase volume' in text_lower:
            return 'volume_up', lang, None
        elif 'volume down' in text_lower or 'decrease volume' in text_lower:
            return 'volume_down', lang, None
        elif 'mute' in text_lower:
            return 'mute', lang, None
        elif any(word in text_lower for word in ['time', 'what time']):
            return 'time', lang, None
        elif any(word in text_lower for word in ['date', 'what date', 'today']):
            return 'date', lang, None
        elif any(word in text_lower for word in ['battery', 'charge']):
            return 'battery', lang, None
        elif any(word in text_lower for word in ['system status', 'pc status', 'status check']):
            return 'system_status', lang, None

        return 'unknown', lang, None

    def get_response(self, response_key: str, lang: str, *args) -> str:
        """Get response text in the appropriate language"""
        responses = RESPONSES.get(lang, RESPONSES['en'])
        template = responses.get(
            response_key, RESPONSES['en'].get(
                response_key, 'Unknown response'))
        return template.format(*args) if args else template


# Singleton instance
parser = BilingualParser()
