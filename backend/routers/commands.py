from fastapi import APIRouter, HTTPException, Query, Body, Request
from typing import Dict, Any, Optional, List
from modules.security import security
from models import CommandRequest, CommandResult, ConfirmationRequest, BaseResponse

router = APIRouter(prefix="/api", tags=["Commands"])

@router.post("/command", response_model=CommandResult)
async def execute_command(request: Request, data: CommandRequest):
    """Execute a single command via REST"""
    from handlers.command_handler import handle_command
    
    command = data.command
    language = data.language or "en"
    session_id = data.session_id
    
    if not command:
        raise HTTPException(status_code=400, detail="Command not provided")
        
    # Execute via handler (same logic as WebSocket)
    result = await handle_command(None, command, language, session_id=session_id)
    return result

@router.post("/confirm/{confirmation_id}", response_model=BaseResponse)
async def confirm_command(confirmation_id: str, data: ConfirmationRequest):
    """Confirm or deny a pending dangerous command"""
    from modules.security import security
    
    approved = data.approved
    result = security.confirm_command(confirmation_id, approved)
    return {
        "success": result, 
        "response": "Action confirmed" if approved else "Action cancelled"
    }

@router.get("/pending")
async def get_pending_actions():
    """List actions awaiting confirmation"""
    return await security.get_pending_actions()
