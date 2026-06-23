import json
import os

from .environment import BACKEND_PORT, DATA_DIR, LOG_LEVEL, WAKE_WORD_ENABLED, WAKE_WORD_PHRASE

# LLM Config
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "nvidia").lower()
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "deepseek-ai/deepseek-v4-pro")
NVIDIA_EMBEDDING_MODEL = os.getenv("NVIDIA_EMBEDDING_MODEL", "nvidia/llama-3.2-nv-embedqc-v1")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "google/gemini-2.0-flash-001")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
OPENAI_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
GOOGLE_EMBEDDING_MODEL = os.getenv("GOOGLE_EMBEDDING_MODEL", "models/text-embedding-004")

# Security
CONFIRMATION_TIMEOUT = int(os.getenv("CONFIRMATION_TIMEOUT", 30))
ENABLE_DANGEROUS_COMMANDS = os.getenv("ENABLE_DANGEROUS_COMMANDS", "true").lower() == "true"

def get_config():
    """Load user config from JSON, merging with defaults"""
    defaults = {
        "language": "en",
        "confirmation_timeout": CONFIRMATION_TIMEOUT,
        "whatsapp_desktop_path": None,
        "auto_start_backend": False,
        "llm_provider": LLM_PROVIDER,
        "nvidia_model": NVIDIA_MODEL,
        "nvidia_embedding_model": NVIDIA_EMBEDDING_MODEL,
        "openrouter_model": OPENROUTER_MODEL,
        "openai_model": OPENAI_MODEL,
        "openai_embedding_model": OPENAI_EMBEDDING_MODEL,
        "ollama_url": OLLAMA_URL,
        "ollama_model": OLLAMA_MODEL,
        "google_embedding_model": GOOGLE_EMBEDDING_MODEL,
        "wake_word_enabled": WAKE_WORD_ENABLED,
        "wake_word_phrase": WAKE_WORD_PHRASE,
        "backend_port": BACKEND_PORT,
        "log_level": LOG_LEVEL,
        "enable_dangerous_commands": ENABLE_DANGEROUS_COMMANDS,
    }
    config_path = DATA_DIR / "config.json"
    if config_path.exists():
        with open(config_path, 'r', encoding='utf-8') as f:
            saved = json.load(f)
        # Merge: saved values override defaults
        defaults.update(saved)
    return defaults

def save_config(config):
    """Save user config to JSON"""
    config_path = DATA_DIR / "config.json"
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2)

CONFIG = get_config()
