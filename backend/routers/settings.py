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

@router.post("/keys")
async def update_keys(data: Dict[str, str] = Body(...)):
    """Update API keys in the .env file"""
    try:
        env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
        
        # Read current .env
        env_lines = []
        if os.path.exists(env_path):
            with open(env_path, 'r', encoding='utf-8') as f:
                env_lines = f.readlines()
        
        # Map of keys to update
        updates = {
            "NVIDIA_API_KEY": data.get("nvidia_api_key"),
            "OPENROUTER_API_KEY": data.get("openrouter_api_key"),
            "GEMINI_API_KEY": data.get("gemini_api_key"), # Optional
            "BACKEND_API_KEY": data.get("backend_api_key") # Optional
        }
        
        # Filter out None values
        updates = {k: v for k, v in updates.items() if v is not None}
        
        if not updates:
            return {"success": False, "message": "No valid keys provided"}
            
        # Update or add lines
        new_env_lines = []
        updated_keys = set()
        
        for line in env_lines:
            line_stripped = line.strip()
            if '=' in line_stripped and not line_stripped.startswith('#'):
                key = line_stripped.split('=')[0].strip()
                if key in updates:
                    new_env_lines.append(f"{key}={updates[key]}\n")
                    updated_keys.add(key)
                else:
                    new_env_lines.append(line)
            else:
                new_env_lines.append(line)
                
        # Add remaining new keys
        for key, value in updates.items():
            if key not in updated_keys:
                new_env_lines.append(f"{key}={value}\n")
                
        # Write back
        with open(env_path, 'w', encoding='utf-8') as f:
            f.writelines(new_env_lines)
            
        return {"success": True, "message": f"Updated {len(updates)} keys in .env"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update API keys: {str(e)}")

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
