from enum import Enum
from typing import Any, Dict, List


class PersonalityType(str, Enum):
    STARK = "stark"
    MIDNIGHT = "midnight"
    AVENUE = "avenue"
    LINEAR = "linear"


class PersonalityManager:
    """Manages JARVIS personalities, themes, and conversational styles"""

    PERSONALITIES = {
        PersonalityType.STARK: {
            "name": "Stark Legacy",
            "accent": "#facc15",  # Yellow/Gold
            "primary": "#3b82f6",  # Blue
            "secondary": "#1d4ed8",
            "voice_pitch": 1.0,
            "voice_rate": 1.0,
            "style": "Confident, helpful, occasionally refers to 'Mr. Stark' or 'Sir'.",
            "motto": "I am JARVIS. At your service.",
        },
        PersonalityType.MIDNIGHT: {
            "name": "Midnight Protocol",
            "accent": "#f43f5e",  # Rose/Red
            "primary": "#881337",  # Dark Red
            "secondary": "#4c0519",
            "voice_pitch": 0.8,
            "voice_rate": 1.1,
            "style": "Concise, technical, cyberpunk aesthetic. Uses hacker terminology.",
            "motto": "System breach neutralized. Access granted.",
        },
        PersonalityType.AVENUE: {
            "name": "Avenue Glass",
            "accent": "#10b981",  # Emerald
            "primary": "#064e3b",  # Dark Green
            "secondary": "#065f46",
            "voice_pitch": 1.1,
            "voice_rate": 0.9,
            "style": "Polite, formal, executive assistant vibe. Very professional.",
            "motto": "Good day. How may I facilitate your operations today?",
        },
        PersonalityType.LINEAR: {
            "name": "Linear Zero",
            "accent": "#ffffff",  # White
            "primary": "#0f172a",  # Slate
            "secondary": "#1e293b",
            "voice_pitch": 1.0,
            "voice_rate": 1.2,
            "style": "Minimalist, zero small talk, data-driven. Ultra-concise.",
            "motto": "Status: Ready. Input required.",
        },
    }

    def __init__(self, current_type: str = "stark"):
        try:
            self.current = PersonalityType(current_type)
        except ValueError:
            self.current = PersonalityType.STARK

    def set_personality(self, p_type: str) -> bool:
        try:
            self.current = PersonalityType(p_type)
            return True
        except ValueError:
            return False

    def get_config(self) -> Dict[str, Any]:
        """Get the configuration for the current personality"""
        config = self.PERSONALITIES[self.current].copy()
        config["id"] = self.current.value
        return config

    def get_all_personalities(self) -> List[Dict]:
        """Get list of all available personalities for UI selection"""
        return [{"id": k.value, "name": v["name"], "accent": v["accent"]} for k, v in self.PERSONALITIES.items()]


# Singleton instance
personality_manager = PersonalityManager()
