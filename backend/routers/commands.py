from fastapi import APIRouter, HTTPException, Query, Body, Request
from typing import Dict, Any, Optional
from modules.security import security

router = APIRouter(prefix="/api", tags=["Commands"])

@router.post("/command")
async def execute_command(request: Request, command_data: Dict[str, Any] = Body(...)):
    """Execute a single command via REST"""
    from handlers.command_handler import command_handler
    
    command = command_data.get("command")
    language = command_data.get("language", "en")
    
    if not command:
        raise HTTPException(status_code=400, detail="Command not provided")
        
    # Execute via handler (same logic as WebSocket)
    result = await command_handler.handle_command(None, command, language)
    return result

@router.post("/confirm/{confirmation_id}")
async def confirm_command(confirmation_id: str, data: Dict[str, bool] = Body(...)):
    """Confirm or deny a pending dangerous command"""
    from handlers.command_handler import command_handler
    
    approved = data.get("approved", False)
    result = await command_handler.confirm_action(confirmation_id, approved)
    return result

@router.get("/pending")
async def get_pending_actions():
    """List actions awaiting confirmation"""
    return await security.get_pending_actions()
