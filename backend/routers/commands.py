from fastapi import APIRouter, HTTPException, Request
from models import BaseResponse, CommandRequest, CommandResult, ConfirmationRequest
from modules.security import security

# NOTE: prefix="" is intentional — these are top-level REST action endpoints
# (/command, /confirm/{id}, /pending) that sit directly under /api/v1/.
# This keeps the URL short for client convenience. All other routers use
# a domain prefix (e.g. /system, /files, /settings).
router = APIRouter(prefix="", tags=["Commands"])


@router.post("/command", response_model=CommandResult)
async def execute_command(request: Request, data: CommandRequest):
    """Execute a single command via REST"""
    from modules.command_handler import handle_command

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
    """Confirm or deny a pending dangerous command.

    On approval the original command is re-dispatched with the confirmed
    flag set, so the action actually executes.
    """
    outcome = await security.confirm_command(confirmation_id, data.approved)
    if outcome is None:
        raise HTTPException(status_code=404, detail="Confirmation not found, already decided, or expired")

    exec_result = outcome.get("result") or {}
    if outcome["confirmed"]:
        response_text = exec_result.get("response") or "Action confirmed"
        success = bool(exec_result.get("success", True))
    else:
        response_text = "Action cancelled"
        success = True
    return {"success": success, "response": response_text}


@router.get("/pending")
async def get_pending_actions():
    """List actions awaiting confirmation"""
    return security.get_pending_actions()
