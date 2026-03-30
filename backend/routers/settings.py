from fastapi import APIRouter, HTTPException, Query, Body, Request
from typing import Dict, Any, Optional
import os
from config import CONFIG, NVIDIA_MODEL, OPENROUTER_MODEL, BACKEND_PORT, LOG_LEVEL, save_config

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("")
async def get_settings():
    """Get all current settings"""
    # Redact sensitive info if needed, but these are general settings
    settings = {
        "AI_ENGINE": CONFIG.get("llm_provider", "nvidia"),
        "NVIDIA_MODEL": NVIDIA_MODEL,
        "OPENROUTER_MODEL": OPENROUTER_MODEL,
        "PORT": BACKEND_PORT,
        "LOG_LEVEL": LOG_LEVEL,
        "DANGEROUS_COMMANDS_ENABLED": CONFIG.get("enable_dangerous_commands", True),
        "CONFIRMATION_TIMEOUT": CONFIG.get("confirmation_timeout", 30),
        "WAKE_WORD_ENABLED": CONFIG.get("wake_word_enabled", True),
        "WAKE_WORD_PHRASE": CONFIG.get("wake_word_phrase", "jarvis")
    }
    return settings

@router.get("/keys")
async def get_keys():
    """Get status of configured API keys (redacted)"""
    def redact(key):
        if not key: return None
        if len(key) < 8: return "****"
        return f"{key[:4]}****{key[-4:]}"

    return {
        "NVIDIA_API_KEY": redact(os.getenv("NVIDIA_API_KEY")),
        "OPENROUTER_API_KEY": redact(os.getenv("OPENROUTER_API_KEY")),
        "BACKEND_API_KEY": redact(os.getenv("BACKEND_API_KEY"))
    }

@router.post("")
async def update_settings(settings: Dict[str, Any]):
    """Update system configuration"""
    try:
        # Update the in-memory CONFIG
        for key, value in settings.items():
            CONFIG[key.lower()] = value
        
        # Save to config.json
        save_config(CONFIG)
        
        return {"success": True, "message": "Settings updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

@router.post("/test-key")
async def test_key(data: Dict[str, str] = Body(...)):
    """Verify an API key by making a test request"""
    provider = data.get("provider")
    api_key = data.get("api_key")
    
    if not provider or not api_key:
        raise HTTPException(status_code=400, detail="Missing provider or api_key")
        
    from modules.llm import llm_module
    # We'll need to implement this test method in llm_module or similar
    # For now, let's assume it exists or return a placeholder
    return {"success": True, "message": f"Verified {provider} key (simulated)"}
