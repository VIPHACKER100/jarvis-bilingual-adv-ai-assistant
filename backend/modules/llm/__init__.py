"""
JARVIS v4.0 — LLM Module (Backward Compatible Package)
Delegates to the LLM Gateway (modules/llm_gateway/) with adapter-based providers.
Maintains backward compatibility for all existing imports.
"""

# Import the wrapper module that provides backward-compatible API
from modules.llm_wrapper import (
    llm_module,
    llm_client,
    get_response,
    get_visual_response,
    extract_command,
    summarize_context,
    get_agent_response,
    get_embedding,
    ping_llm,
    get_response_stream,
    _get_nvidia_response,
    _get_openrouter_response,
    _get_openai_response,
    _get_ollama_response,
    _stream_nvidia,
    _stream_openrouter,
    _stream_openai,
    _stream_ollama,
    _call_nvidia_raw,
    _call_openrouter_raw,
    _call_openai_raw,
    _call_ollama_raw,
    AGENT_SYSTEM_PROMPT,
    SYSTEM_PROMPT_TEMPLATE,
)

__all__ = [
    "llm_module",
    "llm_client",
    "get_response",
    "get_visual_response",
    "extract_command",
    "summarize_context",
    "get_agent_response",
    "get_embedding",
    "ping_llm",
    "get_response_stream",
    "_get_nvidia_response",
    "_get_openrouter_response",
    "_get_openai_response",
    "_get_ollama_response",
    "_stream_nvidia",
    "_stream_openrouter",
    "_stream_openai",
    "_stream_ollama",
    "_call_nvidia_raw",
    "_call_openrouter_raw",
    "_call_openai_raw",
    "_call_ollama_raw",
    "AGENT_SYSTEM_PROMPT",
    "SYSTEM_PROMPT_TEMPLATE",
]
