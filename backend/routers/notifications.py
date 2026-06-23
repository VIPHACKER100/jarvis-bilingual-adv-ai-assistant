from fastapi import APIRouter, HTTPException
from models import NotificationRequest, NotificationResponse
from routers.websocket import broadcast_notification
from utils.logger_structured import logger

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("", response_model=NotificationResponse)
async def push_notification(data: NotificationRequest):
    """Push a notification to all connected WebSocket clients"""
    try:
        count = await broadcast_notification(data.title, data.message, data.type, data.duration)
        return {"success": True, "clients_notified": count, "response": f"Broadcast to {count} clients"}
    except Exception as e:
        logger.error(f"Error pushing notification: {e}")
        raise HTTPException(status_code=500, detail=str(e))
