from fastapi import APIRouter
from modules.health import health_monitor
from utils.database import db_manager

router = APIRouter(tags=["Health"])

@router.get("/health")
async def get_health():
    return await health_monitor.get_health_report()

@router.get("/ready")
async def readiness_probe():
    try:
        result = await db_manager.health_check()
        if result.get("status") == "healthy":
            return {"status": "ready", "database": "connected"}
    except Exception:
        pass
    return {"status": "not ready", "database": "disconnected"}

@router.get("/live")
async def liveness_probe():
    return {"status": "alive"}
