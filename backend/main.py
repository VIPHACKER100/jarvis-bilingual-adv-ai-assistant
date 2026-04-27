import os
import sys
import asyncio
import time
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

# Add current directory to path for imports when run from elsewhere
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Response, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import BACKEND_PORT, FRONTEND_URL, PLATFORM
from modules.system import system_module
from modules.automation import automation_manager
from utils.logger import logger, log_system_event

# Import routers
from routers import (
    system, windows, files, media, pdf_tools, 
    image_tools, desktop, memory, automation, 
    commands, websocket, settings, whatsapp,
    input_control, notifications, sync
)

# Security
BACKEND_API_KEY = os.getenv("BACKEND_API_KEY") or os.getenv("VITE_JARVIS_API_KEY")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info("JARVIS Backend starting up (Modular Architecture)...")
    log_system_event("STARTUP", {
        "port": BACKEND_PORT, 
        "platform": PLATFORM,
        "version": "3.4.0"
    })
    
    # Start background tasks
    status_broadcast_task = asyncio.create_task(broadcast_system_status())
    
    # Start automation scheduler
    automation_manager.start_scheduler()
    automation_manager.create_preset_tasks()
    automation_manager.create_preset_macros()
    
    yield
    
    # Cleanup
    status_broadcast_task.cancel()
    automation_manager.stop_scheduler()
    logger.info("JARVIS Backend shutting down...")
    log_system_event("SHUTDOWN", {})

app = FastAPI(
    title="JARVIS Backend",
    description="Modular AI assistant backend with high-fidelity HUD support",
    version="3.4.1",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL, 
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:3000", "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware for all routes
@app.middleware("http")
async def response_time_middleware(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
    except Exception as e:
        logger.error(f"Error processing request {request.url.path}: {e}")
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": str(e)}
        )

    process_time = round(time.time() - start_time, 4)
    response.headers["X-Response-Time"] = str(process_time)

    # Attach response_time to JSON responses if possible, but safely
    # Avoid reading the body if it's a stream or if it might hang
    if response.media_type == "application/json" and hasattr(response, "body"):
        try:
            # Only attempt if it's a standard JSONResponse or has body already read
            # Note: For many responses, .body is not available in middleware
            pass # We keep headers updated, but skip body mutation to avoid stream issues
        except Exception:
            pass

    return response


# Authentication Middleware for REST API
@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    # Only protect /api/ routes, exclude static files and root
    if request.url.path.startswith("/api/") and BACKEND_API_KEY:
        api_key = request.headers.get("X-API-Key")
        if api_key != BACKEND_API_KEY:
            return JSONResponse(
                status_code=403,
                content={"success": False, "detail": "Invalid or missing API Key"}
            )
    return await call_next(request)

# Register Routers
app.include_router(system.router)
app.include_router(windows.router)
app.include_router(files.router)
app.include_router(media.router)
app.include_router(pdf_tools.router)
app.include_router(image_tools.router)
app.include_router(desktop.router)
app.include_router(memory.router)
app.include_router(automation.router)
app.include_router(commands.router)
app.include_router(settings.router)
app.include_router(whatsapp.router)
app.include_router(input_control.router)
app.include_router(notifications.router)
app.include_router(sync.router)
app.include_router(websocket.router)

@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    """Serve favicon.ico"""
    favicon_path = Path(__file__).parent / "favicon.ico"
    if favicon_path.exists():
        return FileResponse(favicon_path)
    return Response(status_code=404)

async def broadcast_system_status():
    """Broadcast system status to all connected clients every 5 seconds"""
    from routers.websocket import connected_clients
    while True:
        try:
            await asyncio.sleep(5)
            if connected_clients:
                status = await system_module.get_system_status()
                message = {
                    "type": "system_status",
                    "data": status,
                    "timestamp": datetime.now().isoformat()
                }
                # Send to all connected clients
                disconnected = []
                for client_id, ws in connected_clients.items():
                    try:
                        await ws.send_json(message)
                    except:
                        disconnected.append(client_id)
                
                # Remove disconnected clients
                for client_id in disconnected:
                    connected_clients.pop(client_id, None)
                        
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Error in status broadcast: {e}")

# Frontend static file serving logic extracted from original main.py
def _find_frontend_dir() -> Optional[Path]:
    candidates = [
        Path(__file__).resolve().parent.parent / "dist",
        Path(__file__).resolve().parent.parent / "frontend",
        Path.cwd() / "dist",
        Path.cwd() / "frontend"
    ]
    for c in candidates:
        # print(f"Checking frontend candidate: {c}") # Debug
        if c.exists() and (c / "index.html").exists():
            return c
    logger.warning(f"Frontend directory not found! Checked: {[str(c) for c in candidates]}")
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
            "version": "3.4.1",
            "platform": PLATFORM,
            "developer": "VIPHACKER100",
            "note": "Frontend directory not found"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=BACKEND_PORT)
