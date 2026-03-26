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
    from main import handle_command
    
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
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        connected_clients.pop(cid, None)
