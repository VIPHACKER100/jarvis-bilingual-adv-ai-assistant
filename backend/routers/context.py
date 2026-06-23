from typing import Any, Dict, List

from fastapi import APIRouter, HTTPException
from modules.context import context_manager
from modules.memory import memory_manager
from utils.logger_structured import logger

router = APIRouter(prefix="/context", tags=["context"])

@router.get("/suggestion")
async def get_suggestion(language: str = "en"):
    """Get a context-aware proactive suggestion on demand"""
    try:
        suggestion = await context_manager.suggest_next_action()
        return {
            "success": True,
            "suggestion": suggestion,
            "topic": context_manager.current_context.active_topic,
            "mood": context_manager.current_context.user_mood
        }
    except Exception as e:
        logger.error(f"Error getting suggestion: {e}")
        return {"success": False, "error": "Failed to get suggestion"}

@router.get("/quick-actions")
async def get_quick_actions():
    """Get list of user-configured quick actions"""
    try:
        # Fetch from memory settings or a dedicated table
        actions = await memory_manager.get_setting("quick_actions", [])
        if not actions:
            # Return defaults if none configured
            actions = [
                {"id": "status", "label": "System Status", "command": "system status", "icon": "Zap", "color": "text-cyan-400"},
                {"id": "security", "label": "Network Audit", "command": "scan network", "icon": "Shield", "color": "text-emerald-400"},
                {"id": "process", "label": "Process Audit", "command": "list processes", "icon": "Terminal", "color": "text-amber-400"},
                {"id": "web", "label": "Web Search", "command": "search the web", "icon": "Globe", "color": "text-indigo-400"},
            ]
        return {"success": True, "actions": actions}
    except Exception as e:
        logger.error(f"Error getting quick actions: {e}")
        return {"success": False, "error": "Failed to get quick actions"}

@router.post("/quick-actions")
async def update_quick_actions(actions: List[Dict[str, Any]]):
    """Update user-configured quick actions"""
    try:
        await memory_manager.save_setting("quick_actions", actions)
        return {"success": True, "message": "Quick actions updated"}
    except Exception as e:
        logger.error(f"Error updating quick actions: {e}")
        raise HTTPException(status_code=500, detail=str(e))
