from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional, List
from modules.window_manager import window_manager
from models import BaseResponse, WindowListResponse, AppListResponse

router = APIRouter(prefix="/api", tags=["Windows & Applications"])

@router.get("/windows/list", response_model=WindowListResponse)
async def list_windows():
    """List open windows"""
    return await window_manager.list_windows()

@router.get("/apps/list", tags=["Applications"], response_model=AppListResponse)
async def list_apps():
    """List running apps"""
    return await window_manager.list_apps()

@router.post("/apps/open", tags=["Applications"], response_model=BaseResponse)
async def open_app(app_name: str, language: str = "en"):
    """Open application"""
    return await window_manager.open_app(app_name, language)

@router.post("/apps/close", tags=["Applications"], response_model=BaseResponse)
async def close_app(app_name: str, language: str = "en", confirmed: bool = False):
    """Close application"""
    return await window_manager.close_app(app_name, language, confirmed)

@router.post("/windows/minimize", response_model=BaseResponse)
async def minimize_window(title: Optional[str] = None, language: str = "en"):
    """Minimize active window or specified window"""
    return await window_manager.minimize_window(title, language)

@router.post("/windows/maximize", response_model=BaseResponse)
async def maximize_window(title: Optional[str] = None, language: str = "en"):
    """Maximize active window or specified window"""
    return await window_manager.maximize_window(title, language)

@router.post("/windows/restore", response_model=BaseResponse)
async def restore_window(title: Optional[str] = None, language: str = "en"):
    """Restore window"""
    return await window_manager.restore_window(title, language)

@router.post("/windows/activate", response_model=BaseResponse)
@router.post("/windows/focus", response_model=BaseResponse)
async def activate_window(title: str, language: str = "en"):
    """Activate window by title"""
    return await window_manager.activate_window(title, language)
