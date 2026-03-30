from fastapi import APIRouter, Body, HTTPException
from typing import Dict, Any, Optional
from datetime import datetime
from routers.websocket import broadcast_notification
from utils.logger import logger

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.post("")
async def push_notification(data: Dict[str, Any] = Body(...)):
    """Push a notification to all connected WebSocket clients"""
    try:
        title = data.get("title", "System Alert")
        message = data.get("message", "")
        notif_type = data.get("type", "info") # info, success, warning, error, system
        duration = data.get("duration", 5000)
        
        count = await broadcast_notification(title, message, notif_type, duration)
                
        return {"success": True, "clients_notified": count}
    except Exception as e:
        logger.error(f"Error pushing notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))
