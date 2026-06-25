from typing import Optional

from fastapi import APIRouter
from models import AppListResponse, BaseResponse, WindowListResponse
from modules.window_manager import window_manager

# Standardized prefix pattern: two routers in one file since /apps/* and
# /windows/* share the window_manager dependency. Both are exported and
# included separately in main.py under the /api/v1/ prefix.
router = APIRouter(prefix="/windows", tags=["Windows"])
apps_router = APIRouter(prefix="/apps", tags=["Applications"])


@router.get("/list", response_model=WindowListResponse)
async def list_windows():
    """List open windows"""
    return await window_manager.get_window_list()


@apps_router.get("/list", response_model=AppListResponse)
async def list_apps():
    """List running apps"""
    return await window_manager.list_running_apps()


@apps_router.post("/open", response_model=BaseResponse)
async def open_app(app_name: str, language: str = "en"):
    """Open application"""
    return await window_manager.open_app(app_name, language)


@apps_router.post("/close", response_model=BaseResponse)
async def close_app(app_name: str, language: str = "en", confirmed: bool = False):
    """Close application"""
    return await window_manager.close_app(app_name, language, confirmed)


@router.post("/minimize", response_model=BaseResponse)
async def minimize_window(title: Optional[str] = None, language: str = "en"):
    """Minimize active window or specified window"""
    return await window_manager.minimize_window(title, language)


@router.post("/maximize", response_model=BaseResponse)
async def maximize_window(title: Optional[str] = None, language: str = "en"):
    """Maximize active window or specified window"""
    return await window_manager.maximize_window(title, language)


@router.post("/restore", response_model=BaseResponse)
async def restore_window(title: Optional[str] = None, language: str = "en"):
    """Restore window"""
    return await window_manager.restore_window(title, language)


@router.post("/activate", response_model=BaseResponse)
@router.post("/focus", response_model=BaseResponse)
async def activate_window(title: str, language: str = "en"):
    """Activate window by title"""
    return await window_manager.activate_window(title, language)
