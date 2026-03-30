from fastapi import APIRouter, HTTPException, Query, Body, Request
from typing import Dict, Any, Optional
from modules.security import security

router = APIRouter(prefix="/api", tags=["Commands"])

@router.post("/command")
async def execute_command(request: Request, command_data: Dict[str, Any] = Body(...)):
    """Execute a single command via REST"""
    from handlers.command_handler import handle_command
    
    command = command_data.get("command")
    language = command_data.get("language", "en")
    
    if not command:
        raise HTTPException(status_code=400, detail="Command not provided")
        
    # Execute via handler (same logic as WebSocket)
    result = await handle_command(None, command, language)
    return result

@router.post("/confirm/{confirmation_id}")
async def confirm_command(confirmation_id: str, data: Dict[str, bool] = Body(...)):
    """Confirm or deny a pending dangerous command"""
    from modules.security import security
    
    approved = data.get("approved", False)
    result = security.confirm_command(confirmation_id, approved)
    return {"success": result, "message": "Action confirmed" if approved else "Action cancelled"}

@router.get("/pending")
async def get_pending_actions():
    """List actions awaiting confirmation"""
    return await security.get_pending_actions()
