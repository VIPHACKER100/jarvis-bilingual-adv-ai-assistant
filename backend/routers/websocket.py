import asyncio
import hmac
import json
from typing import Optional

from config.environment import get_backend_api_key
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from models import WebSocketMessage, WebSocketResponse
from modules.system import system_module
from utils.logger_structured import logger
from utils.websocket_manager import manager

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    client_id: Optional[str] = None,
    token: Optional[str] = None,
    device_id: Optional[str] = None,
    api_key: Optional[str] = None,
):
    """Real-time bidirectional communication with authentication"""
    from modules.command_handler import handle_command
    from modules.memory import memory_manager

    # API key gate — uses centralized resolver from config.environment
    configured_key = get_backend_api_key()
    if configured_key:
        client_host = websocket.client.host if websocket.client else ""
        is_local = client_host in ("127.0.0.1", "localhost", "::1")
        if not is_local:
            if not api_key or not hmac.compare_digest(api_key, configured_key):
                logger.warning("Unauthorized WebSocket connection attempt (bad API key)")
                await websocket.close(code=1008)
                return

    # Device auth check for mobile devices
    if device_id and token:
        devices = await memory_manager.get_setting("paired_devices", [])
        is_valid = any(d["id"] == device_id and d["token"] == token for d in devices)

        if not is_valid:
            logger.warning(f"Unauthorized WebSocket connection attempt: {device_id}")
            await websocket.close(code=1008)  # Policy Violation
            return

    cid = client_id or device_id or f"client_{id(websocket)}"
    await manager.connect(websocket, cid)

    try:
        while True:
            data = await websocket.receive_text()
            message_dict = json.loads(data)

            # Validate with Pydantic
            try:
                message = WebSocketMessage(**message_dict)
            except Exception as e:
                await manager.send_personal_message(
                    jsonable_encoder(WebSocketResponse(type="error", data=f"Invalid message format: {str(e)}")), cid
                )
                continue

            msg_type = message.type

            if msg_type == "command":
                # Execute command in background to allow concurrent processing
                async def execute_task(msg, cid):
                    try:
                        result = await handle_command(
                            websocket, msg.command, msg.language, msg.params, msg.session_id or cid
                        )

                        # Send result back
                        await manager.send_personal_message(
                            jsonable_encoder(WebSocketResponse(type="command_result", data=result)), cid
                        )
                    except Exception as e:
                        logger.error(f"Error executing background command: {e}")
                        await manager.send_personal_message(
                            jsonable_encoder(
                                WebSocketResponse(type="error", data=f"Command execution failed: {str(e)}")
                            ),
                            cid,
                        )

                asyncio.create_task(execute_task(message, cid))

            elif msg_type == "confirmation":
                from modules.security import security

                conf_data = message.data
                if isinstance(conf_data, dict):
                    cid_to_confirm = conf_data.get("confirmation_id")
                    approved = conf_data.get("approved", False)
                    if cid_to_confirm:
                        success = await security.confirm_command(cid_to_confirm, approved)
                        await manager.send_personal_message(
                            jsonable_encoder(
                                WebSocketResponse(
                                    type="notification",
                                    data={
                                        "title": "Security Protocol",
                                        "message": "Action approved" if approved else "Action cancelled",
                                        "type": "success" if success else "error",
                                    },
                                )
                            ),
                            cid,
                        )

            elif msg_type == "ping":
                await manager.send_personal_message(jsonable_encoder(WebSocketResponse(type="pong")), cid)

            elif msg_type == "get_status":
                status = await system_module.get_system_status()
                await manager.send_personal_message(
                    jsonable_encoder(WebSocketResponse(type="system_status", data=status)), cid
                )

    except WebSocketDisconnect:
        manager.disconnect(cid)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(cid)


async def broadcast_notification(title: str, message: str, type: str = "info", duration: int = 5000):
    """Broadcast a UI notification to all connected WebSocket clients"""
    response = WebSocketResponse(
        type="notification", data={"title": title, "message": message, "type": type, "duration": duration}
    )

    await manager.broadcast(jsonable_encoder(response))
    return len(manager.active_connections)
