from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Any, List, Optional
import asyncio
import json
from datetime import datetime
from modules.system import system_module
from utils.logger import logger, log_system_event

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
            message = json.loads(data)
            msg_type = message.get("type")
            
            if msg_type == "command":
                command = message.get("command")
                language = message.get("language", "en")
                params = message.get("params")
                session_id = message.get("session_id", cid)
                
                # Execute command
                result = await handle_command(websocket, command, language, params, session_id)
                
                # Send result back
                await websocket.send_json({
                    "type": "command_result",
                    "data": result,
                    "timestamp": datetime.now().isoformat()
                })
            
            elif msg_type == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.now().isoformat()
                })
            
            elif msg_type == "get_status":
                status = await system_module.get_system_status()
                await websocket.send_json({
                    "type": "system_status",
                    "data": status,
                    "timestamp": datetime.now().isoformat()
                })
                
    except WebSocketDisconnect:
        connected_clients.pop(cid, None)
        logger.info(f"WebSocket client disconnected: {cid}")
    finally:
        if cid in connected_clients:
            connected_clients.pop(cid, None)

async def broadcast_notification(title: str, message: str, type: str = "info", duration: int = 5000):
    """Broadcast a UI notification to all connected WebSocket clients"""
    payload = {
        "type": "notification",
        "data": {
            "title": title,
            "message": message,
            "type": type,
            "duration": duration,
            "timestamp": datetime.now().isoformat()
        }
    }
    
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
