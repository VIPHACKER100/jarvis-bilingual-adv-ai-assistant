"""
JARVIS v4.0 — LLM Gateway
Unified interface for all LLM providers with:
- Provider adapters (NVIDIA, OpenRouter, OpenAI, Ollama)
- Automatic failover with circuit breaker
- Per-provider cost tracking
- Streaming support via async generators
"""

import os
import time
import json
import asyncio
from typing import Dict, Any, Optional, List, AsyncGenerator, Type
from dataclasses import dataclass, field
from pathlib import Path

from utils.logger import logger
from config import (
    LLM_PROVIDER, NVIDIA_MODEL, OPENROUTER_MODEL, OPENAI_MODEL,
    NVIDIA_EMBEDDING_MODEL, OPENAI_EMBEDDING_MODEL, GOOGLE_EMBEDDING_MODEL,
)
