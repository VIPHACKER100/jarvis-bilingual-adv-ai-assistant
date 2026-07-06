import asyncio
import hmac
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

# Add current directory to path for imports when run from elsewhere
sys.path.insert(0, str(Path(__file__).parent))

from contextlib import asynccontextmanager

from config import BACKEND_PORT, FRONTEND_URL, PLATFORM, VERSION
from config.environment import get_backend_api_key
from fastapi import APIRouter, FastAPI, Request, Response
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from modules.automation import automation_manager
from modules.memory import memory_manager
from modules.proactive import proactive_manager
from modules.system import system_module
from modules.whatsapp import whatsapp_manager

# Import routers
from routers import (
    agent,
    audio,
    automation,
    commands,
    context,
    desktop,
    files,
    health,
    image_tools,
    input_control,
    media,
    memory,
    notifications,
    pdf_tools,
    settings,
    sync,
    system,
    websocket,
    whatsapp,
    windows,
)
from utils.logger_structured import log_system_event, logger
from utils.middleware_security import MaxBodySizeMiddleware, SecurityHeadersMiddleware, SQLInjectionMiddleware

# Security — centralized API key resolution (see config.environment.get_backend_api_key)
BACKEND_API_KEY = get_backend_api_key()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("JARVIS Backend starting up (Modular Architecture)...")
    startup_info = {"port": BACKEND_PORT, "platform": PLATFORM, "version": VERSION}
    log_system_event("STARTUP", startup_info)

    # Initialize managers
    from config import CONFIG
    from modules.personalities import personality_manager

    personality_manager.set_personality(CONFIG.get("personality", "stark"))

    try:
        await memory_manager.initialize()
    except Exception as e:
        logger.warning(f"Database unavailable — running in degraded mode: {e}")
    await whatsapp_manager.initialize()
    await automation_manager.initialize()
    await automation_manager.start()
    await proactive_manager.start()

    # Start background tasks
    status_broadcast_task = asyncio.create_task(broadcast_system_status())
    lag_monitor_task = asyncio.create_task(monitor_event_loop_lag())
    prune_task = asyncio.create_task(periodic_prune_conversations())

    # Start mDNS Broadcaster
    from config import MDNS_ENABLED, MDNS_SERVICE_NAME
    from utils.mdns import mdns_broadcaster

    if MDNS_ENABLED:
        mdns_broadcaster.port = BACKEND_PORT
        mdns_broadcaster.service_name = MDNS_SERVICE_NAME or "JARVIS-CORE"
        await mdns_broadcaster.start()

    yield

    # Cleanup
    if MDNS_ENABLED:
        await mdns_broadcaster.stop()

    status_broadcast_task.cancel()
    lag_monitor_task.cancel()
    prune_task.cancel()
    await automation_manager.stop()
    await proactive_manager.stop()
    logger.info("JARVIS Backend shutting down...")
    log_system_event("SHUTDOWN", {})


app = FastAPI(
    title="JARVIS Backend",
    description="Modular AI assistant backend with high-fidelity HUD support",
    version=VERSION,
    lifespan=lifespan,
)

# CORS middleware — accept requests from the frontend dev server,
# production Docker deployment (http://localhost), and common dev ports.
# FRONTEND_URL is configurable via .env (defaults to http://localhost:5173).
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register security middleware (order matters — run first)
app.add_middleware(MaxBodySizeMiddleware)
app.add_middleware(SQLInjectionMiddleware)
app.add_middleware(SecurityHeadersMiddleware)


# Request timing middleware for all routes
@app.middleware("http")
async def response_time_middleware(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"Error processing request {request.url.path}: {e}")
        return JSONResponse(status_code=500, content={"success": False, "error": "Internal server error"})

    process_time = round(time.time() - start_time, 4)
    response.headers["X-Response-Time"] = str(process_time)

    # Attach response_time to JSON responses if possible, but safely
    # Avoid reading the body if it's a stream or if it might hang
    if response.media_type == "application/json" and hasattr(response, "body"):
        try:
            # Only attempt if it's a standard JSONResponse or has body already read
            # Note: For many responses, .body is not available in middleware
            pass  # We keep headers updated, but skip body mutation to avoid stream issues
        except Exception:
            pass

    return response


# Request ID Middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    import uuid

    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Authentication Middleware for REST API
# NOTE: This middleware only checks paths starting with /api/. WebSocket
# endpoints (/ws, /audio/ws/audio) skip this middleware by design because
# the browser WebSocket API cannot set custom HTTP headers like X-API-Key.
# Instead, WS endpoints pass the API key as a query parameter and perform
# their own authentication inside the handler (see routers/websocket.py
# and routers/audio.py). This is a conscious trade-off: the WS handshake
# is authenticated via query param + constant-time comparison in the handler.
HEALTH_EXEMPT_PREFIXES = (
    "/api/v1/health",
    "/api/v1/agent/health",
    "/api/v1/ready",
    "/api/v1/live",
    # Audio WebSocket is auth-protected inside its own handler (query param)
    # and must bypass the middleware because browsers can't set X-API-Key headers.
    "/api/v1/audio/",
)


@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    path = request.url.path
    if path.startswith("/api/") and BACKEND_API_KEY and not path.startswith(HEALTH_EXEMPT_PREFIXES):
        api_key = request.headers.get("X-API-Key")

        client_host = request.client.host if request.client else ""
        is_local = client_host in ("127.0.0.1", "localhost", "::1")
        if is_local:
            return await call_next(request)

        if not api_key or not hmac.compare_digest(api_key, BACKEND_API_KEY):
            return JSONResponse(status_code=403, content={"success": False, "detail": "Invalid or missing API Key"})
    return await call_next(request)


# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled error [ID: {request_id}]: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An internal server error occurred",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
        },
    )


# Register Routers
api_v1 = APIRouter(prefix="/api/v1")

# Include routers in V1
api_v1.include_router(system.router)
api_v1.include_router(windows.router)
api_v1.include_router(windows.apps_router)
api_v1.include_router(files.router)
api_v1.include_router(media.router)
api_v1.include_router(pdf_tools.router)
api_v1.include_router(image_tools.router)
api_v1.include_router(desktop.router)
api_v1.include_router(memory.router)
api_v1.include_router(automation.router)
api_v1.include_router(commands.router)
api_v1.include_router(settings.router)
api_v1.include_router(whatsapp.router)
api_v1.include_router(input_control.router)
api_v1.include_router(notifications.router)
api_v1.include_router(sync.router)
api_v1.include_router(health.router)
api_v1.include_router(context.router)
api_v1.include_router(agent.router)
api_v1.include_router(audio.router)
app.include_router(api_v1)

# WebSocket does not need prefix as it is typically handled separately
app.include_router(websocket.router)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Serve favicon.ico"""
    favicon_path = Path(__file__).parent / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(favicon_path)
    return Response(status_code=404)


# Global state for performance monitoring
current_event_loop_lag = 0.0


async def monitor_event_loop_lag(interval: float = 1.0, threshold_ms: float = 100.0):
    """Monitor event loop latency to detect blocking calls"""
    logger.info(f"Event loop monitor started (threshold={threshold_ms}ms)")
    while True:
        try:
            start = time.perf_counter()
            await asyncio.sleep(interval)
            end = time.perf_counter()

            # The lag is the difference between intended sleep and actual sleep
            actual_delay = end - start
            lag_ms = (actual_delay - interval) * 1000

            global current_event_loop_lag
            current_event_loop_lag = round(lag_ms, 2)

            if lag_ms > threshold_ms:
                logger.warning(f"CRITICAL: Event loop lag detected! {lag_ms:.2f}ms. Some code is blocking the loop.")
                log_system_event("EVENT_LOOP_LAG", {"lag_ms": current_event_loop_lag})

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in event loop monitor: {e}")
            await asyncio.sleep(interval)


async def broadcast_system_status():
    """Broadcast system status to all connected clients every 5 seconds"""
    from modules.memory import memory_manager
    from modules.personalities import personality_manager
    from utils.websocket_manager import manager

    while True:
        try:
            await asyncio.sleep(5)
            status = await system_module.get_system_status()

            # Update status with current lag and personality before broadcasting
            status.event_loop_lag = current_event_loop_lag
            status.personality = personality_manager.get_config()

            # Save to database for history
            await memory_manager.save_performance_metric(
                current_event_loop_lag, status.cpu.percent, status.memory.percent
            )

            if manager.active_connections:
                message = {
                    "type": "system_status",
                    "data": jsonable_encoder(status),
                    "timestamp": datetime.now().isoformat(),
                }
                await manager.broadcast(message)

        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in status broadcast: {e}")


async def periodic_prune_conversations():
    """Periodically prune old conversations to prevent unbounded table growth."""
    logger.info("Periodic conversation pruning started (every 5 minutes)")
    while True:
        try:
            await asyncio.sleep(300)  # 5 minutes
            deleted = await memory_manager.prune_conversations(limit=500)
            if deleted > 0:
                logger.info(f"Periodic prune: removed {deleted} old conversation entries")
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in periodic pruning: {e}")


# Frontend static file serving logic extracted from original main.py
def _find_frontend_dir() -> Optional[Path]:
    """Find the frontend directory in various environments (dev, bundled)"""
    candidates = []

    # 1. Check if we're running as a PyInstaller bundle
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        mei_path = Path(sys._MEIPASS)
        candidates.extend(
            [
                mei_path / "frontend",
                mei_path / "dist",
                mei_path / "_internal" / "frontend",
                mei_path / "_internal" / "dist",
            ]
        )

    # 2. Check relative to current file (works in dev)
    try:
        base_path = Path(__file__).resolve().parent.parent
        candidates.extend([base_path / "dist", base_path / "frontend"])
    except Exception:
        pass

    # 3. Check relative to CWD
    cwd = Path.cwd()
    candidates.extend(
        [
            cwd / "dist",
            cwd / "frontend",
            cwd / "release" / "backend" / "_internal" / "frontend",  # Extra backup for local release testing
        ]
    )

    for c in candidates:
        # logger.debug(f"Checking frontend candidate: {c}")
        if c.exists() and (c / "index.html").exists():
            return c

    logger.warning(f"Frontend directory not found! Checked {len(candidates)} candidates.")
    return None


frontend_dir = _find_frontend_dir()
if frontend_dir is not None:
    logger.info(f"Serving frontend from {frontend_dir}")
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")
else:

    @app.get("/")
    async def root():
        """Health check and root info (Frontend fallback)"""
        return {
            "status": "online",
            "system": "JARVIS",
            "version": VERSION,
            "platform": PLATFORM,
            "developer": "VIPHACKER100",
            "note": "Frontend directory not found",
        }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=BACKEND_PORT)
