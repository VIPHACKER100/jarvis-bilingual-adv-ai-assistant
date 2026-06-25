from fastapi import APIRouter
from utils.database import db_manager
from utils.logger_structured import logger

# NOTE: intentionally no prefix — these are Kubernetes-style health probes
# (/ready, /live) that must live at predictable flat URLs under /api/v1/.
# K8s ingress controllers often require exact path matching for probes.
router = APIRouter(tags=["Probes"])


@router.get("/ready")
async def readiness_probe():
    """Kubernetes readiness probe — checks DB connectivity"""
    db_healthy = False
    try:
        result = await db_manager.health_check()
        db_healthy = result.get("status") == "healthy"
    except Exception as e:
        logger.warning(f"Readiness probe — DB check failed: {e}")

    if db_healthy:
        return {"status": "ready", "database": "connected"}
    return {"status": "not ready", "database": "disconnected"}


@router.get("/live")
async def liveness_probe():
    """Kubernetes liveness probe — always 200"""
    return {"status": "alive"}
