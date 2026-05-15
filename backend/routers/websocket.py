from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.encoders import jsonable_encoder
from typing import Dict, Any, List, Optional
import asyncio
import json
from datetime import datetime
from modules.system import system_module
from utils.logger import logger, log_system_event
from models import WebSocketMessage, WebSocketResponse
from utils.websocket_manager import manager

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, client_id: Optional[str] = None):
    """Real-time bidirectional communication"""
    from handlers.command_handler import handle_command
    
    cid = client_id or f"client_{id(websocket)}"
    await manager.connect(websocket, cid)
    
    try:
        while True:
            data = await websocket.receive_text()
            message_dict = json.loads(data)
            
            # Validate with Pydantic
            try:
                message = WebSocketMessage(**message_dict)
            except Exception as e:
                await manager.send_personal_message(jsonable_encoder(WebSocketResponse(
                    type="error",
                    data=f"Invalid message format: {str(e)}"
                )), cid)
                continue

            msg_type = message.type
            
            if msg_type == "command":
                # Execute command in background to allow concurrent processing
                async def execute_task(msg, cid):
                    try:
                        result = await handle_command(
                            websocket, 
                            msg.command, 
                            msg.language, 
                            msg.params, 
                            msg.session_id or cid
                        )
                        
                        # Send result back
                        await manager.send_personal_message(jsonable_encoder(WebSocketResponse(
                            type="command_result",
                            data=result
                        )), cid)
                    except Exception as e:
                        logger.error(f"Error executing background command: {e}")
                        await manager.send_personal_message(jsonable_encoder(WebSocketResponse(
                            type="error",
                            data=f"Command execution failed: {str(e)}"
                        )), cid)

                asyncio.create_task(execute_task(message, cid))
            
            elif msg_type == "ping":
                await manager.send_personal_message(jsonable_encoder(WebSocketResponse(
                    type="pong"
                )), cid)
            
            elif msg_type == "get_status":
                status = await system_module.get_system_status()
                await manager.send_personal_message(jsonable_encoder(WebSocketResponse(
                    type="system_status",
                    data=status
                )), cid)
                
    except WebSocketDisconnect:
        manager.disconnect(cid)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(cid)

async def broadcast_notification(title: str, message: str, type: str = "info", duration: int = 5000):
    """Broadcast a UI notification to all connected WebSocket clients"""
    response = WebSocketResponse(
        type="notification",
        data={
            "title": title,
            "message": message,
            "type": type,
            "duration": duration
        }
    )
    
    await manager.broadcast(jsonable_encoder(response))
    return len(manager.active_connections)
