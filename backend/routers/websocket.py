from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List, Optional
import asyncio
import json
from datetime import datetime
from modules.system import system_module
from utils.logger import logger, log_system_event
from models import WebSocketMessage, WebSocketResponse

router = APIRouter(tags=["WebSocket"])

# Connected clients
connected_clients: Dict[str, WebSocket] = {}

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, client_id: Optional[str] = None):
    """Real-time bidirectional communication"""
    from handlers.command_handler import handle_command
    
    await websocket.accept()
    cid = client_id or f"client_{id(websocket)}"
    connected_clients[cid] = websocket
    
    logger.info(f"WebSocket client connected: {cid}")
    
    try:
        while True:
            data = await websocket.receive_text()
            message_dict = json.loads(data)
            
            # Validate with Pydantic
            try:
                message = WebSocketMessage(**message_dict)
            except Exception as e:
                await websocket.send_json(WebSocketResponse(
                    type="error",
                    data=f"Invalid message format: {str(e)}"
                ).dict())
                continue

            msg_type = message.type
            
            if msg_type == "command":
                # Execute command
                result = await handle_command(
                    websocket, 
                    message.command, 
                    message.language, 
                    message.params, 
                    message.session_id or cid
                )
                
                # Send result back
                await websocket.send_json(WebSocketResponse(
                    type="command_result",
                    data=result
                ).dict())
            
            elif msg_type == "ping":
                await websocket.send_json(WebSocketResponse(
                    type="pong"
                ).dict())
            
            elif msg_type == "get_status":
                status = await system_module.get_system_status()
                await websocket.send_json(WebSocketResponse(
                    type="system_status",
                    data=status
                ).dict())
                
    except WebSocketDisconnect:
        connected_clients.pop(cid, None)
        logger.info(f"WebSocket client disconnected: {cid}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        if cid in connected_clients:
            connected_clients.pop(cid, None)

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
    
    payload = response.dict()
    
    if not connected_clients:
        return 0
        
    disconnected = []
    count = 0
    for cid, ws in connected_clients.items():
        try:
            await ws.send_json(payload)
            count += 1
        except:
            disconnected.append(cid)
            
    for cid in disconnected:
        connected_clients.pop(cid, None)
        
    return count
