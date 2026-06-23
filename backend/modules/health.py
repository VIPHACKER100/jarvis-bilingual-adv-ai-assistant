import asyncio
import time
from typing import Any, Dict

import psutil
from config import VERSION
from modules.automation import automation_manager
from modules.memory import memory_manager
from utils.logger_structured import logger


class HealthMonitor:
    """Advanced health monitoring for JARVIS backend"""

    def __init__(self):
        self.start_time = time.time()

    async def get_health_report(self) -> Dict[str, Any]:
        """Generate a comprehensive health report"""
        now = time.time()
        uptime = now - self.start_time

        # Memory Database Latency
        db_latency = getattr(memory_manager, "last_query_latency", 0.0)

        # Background Automation Stats
        active_macros = len(automation_manager._active_macros) if hasattr(automation_manager, "_active_macros") else 0

        # System Resource Usage
        cpu_usage = await asyncio.to_thread(psutil.cpu_percent)
        memory = await asyncio.to_thread(psutil.virtual_memory)
        memory_usage = memory.percent

        # Trigger garbage collection if memory is high (>80%)
        if memory_usage > 80:
            import gc

            gc.collect()
            logger.info(f"High memory detected ({memory_usage}%). Garbage collection triggered.")
            # Refresh memory stats after GC
            memory = await asyncio.to_thread(psutil.virtual_memory)
            memory_usage = memory.percent

        return {
            "status": "healthy" if memory_usage < 90 else "degraded",
            "version": VERSION,
            "uptime_seconds": round(uptime, 2),
            "timestamp": time.time(),
            "performance": {
                "db_latency_ms": round(db_latency, 2),
                "cpu_usage_percent": cpu_usage,
                "memory_usage_percent": memory_usage,
            },
            "automation": {
                "active_macros": active_macros,
                "scheduler_active": True,  # Placeholder
            },
        }


health_monitor = HealthMonitor()
