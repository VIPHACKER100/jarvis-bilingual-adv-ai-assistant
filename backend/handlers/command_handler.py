"""
JARVIS v4.0 — Command Handler (Orchestrator)
Delegates to domain-specific handlers. Falls through to Autonomous Agent.
"""

from typing import Any, Dict, Optional

from fastapi import WebSocket
from handlers import (
    desktop_handler,
    file_handler,
    input_handler,
    media_handler,
    memory_handler,
    personality_handler,
    system_handler,
    whatsapp_handler,
    window_handler,
)
from models import CommandResult
from modules.bilingual_parser import parser
from modules.context import context_manager
from modules.memory import ConversationEntry, memory_manager
from modules.security import security
from utils.logger_structured import log_command, logger

DOMAIN_HANDLERS = [
    ("system", system_handler),
    ("window", window_handler),
    ("desktop", desktop_handler),
    ("input", input_handler),
    ("file", file_handler),
    ("media", media_handler),
    ("whatsapp", whatsapp_handler),
    ("personality", personality_handler),
    ("memory", memory_handler),
]


async def dispatch_command(
    command_key: str,
    params: Any,
    current_lang: str,
    command: str = "",
    websocket: Optional[WebSocket] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    for domain_name, handler in DOMAIN_HANDLERS:
        result = await handler.handle(command_key, params, current_lang)
        if result is not None:
            return result

    return {"success": False, "action_type": "UNKNOWN", "response": "Unknown command."}


async def handle_command(
    websocket: Optional[WebSocket],
    command: str,
    language: Optional[str] = None,
    override_params: Optional[Dict[str, Any]] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    command_key, detected_lang, params = parser.parse_command(command)
    current_lang = language or detected_lang

    if override_params:
        params = override_params

    logger.info(f"Command received: '{command}' -> '{command_key}' (lang: {current_lang})")

    result_raw = await dispatch_command(command_key, params, current_lang, command, websocket, session_id)

    if result_raw.get("action_type") != "UNKNOWN":
        result = result_raw
    else:
        logger.info(f"No direct handler for '{command_key}', invoking Autonomous Agent...")

        if websocket:
            try:
                await websocket.send_json({"type": "agent_thinking", "session_id": session_id})
            except Exception:
                pass

        async def on_agent_thought(thought: str):
            if websocket:
                try:
                    await websocket.send_json(
                        {"type": "agent_thinking", "data": {"thought": thought, "session_id": session_id}}
                    )
                except Exception:
                    pass

        from modules.agent import agent_controller

        agent_response = await agent_controller.run_loop(
            command, current_lang, session_id or "default", on_thought=on_agent_thought
        )

        if agent_response:
            result = {"success": True, "action_type": "AGENT_RESOLVED", "response": agent_response}
            log_command(command, "agent", True)
            if websocket:
                try:
                    await websocket.send_json(
                        {"type": "agent_resolved", "data": {"full_response": agent_response, "session_id": session_id}}
                    )
                except Exception:
                    pass
        else:
            result = {
                "success": False,
                "action_type": "UNKNOWN",
                "response": parser.get_response("command_not_understood", current_lang),
            }
            log_command(command, "unknown", False)

    if hasattr(result, "model_dump"):
        result = result.model_dump()

    details = result.get("details") or (params if isinstance(params, dict) else None)
    suggestion = await context_manager.suggest_next_action()

    res_obj = CommandResult(
        success=result.get("success", True),
        response=result.get("response", ""),
        action_type=result.get("action_type", "COMMAND_EXECUTION"),
        command_key=command_key or "unknown",
        language=current_lang,
        suggestion=suggestion,
        details=details,
        data=result.get("data"),
    )

    if res_obj.success and result.get("requires_confirmation") and not result.get("confirmation_id"):
        res_obj.requires_confirmation = True
        res_obj.confirmation_id = security.request_confirmation(
            command_key=command_key,
            command_text=command,
            language=current_lang,
            details={"params": params, "language": current_lang},
        )

    res = res_obj.model_dump()

    try:
        entry = ConversationEntry(
            user_input=command,
            jarvis_response=res["response"],
            command_type=command_key or "conversation",
            success=res["success"],
            language=current_lang,
            session_id=session_id or "",
        )
        await memory_manager.save_conversation(entry)
        await context_manager.update_context(
            command, command_key or "conversation", res["success"], session_id or "default"
        )
    except Exception as e:
        logger.error(f"Error saving to memory in command_handler: {e}")

    return res
