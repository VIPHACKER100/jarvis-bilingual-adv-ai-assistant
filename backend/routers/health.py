from fastapi import APIRouter
from modules.health import health_monitor

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def get_health():
    """Get backend health and performance metrics"""
    return await health_monitor.get_health_report()
