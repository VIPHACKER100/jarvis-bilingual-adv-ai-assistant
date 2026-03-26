from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional
from modules.desktop import desktop_manager

router = APIRouter(prefix="/api/desktop", tags=["Desktop Utilities"])

@router.get("/screenshot")
async def take_screenshot(save: bool = True, language: str = "en"):
    """Full screen capture"""
    return await desktop_manager.take_screenshot(save, language)

@router.post("/screenshot/region")
async def screenshot_region(x: int, y: int, width: int, height: int, save: bool = True, language: str = "en"):
    """Capture specific area"""
    return await desktop_manager.screenshot_region(x, y, width, height, save, language)

@router.get("/clipboard/text")
async def get_clipboard_text(language: str = "en"):
    """Read clipboard text"""
    return await desktop_manager.get_clipboard_text(language)

@router.post("/clipboard/text")
async def set_clipboard_text(text: str, language: str = "en"):
    """Copy text to clipboard"""
    return await desktop_manager.set_clipboard_text(text, language)

@router.delete("/clipboard")
async def clear_clipboard(language: str = "en"):
    """Clear clipboard"""
    return await desktop_manager.clear_clipboard(language)

@router.post("/media/play")
async def play_pause(language: str = "en"):
    """Media Play/Pause"""
    return await desktop_manager.media_play_pause(language)

@router.post("/media/next")
async def next_track(language: str = "en"):
    """Media Next"""
    return await desktop_manager.media_next_track(language)

@router.post("/media/previous")
async def previous_track(language: str = "en"):
    """Media Previous"""
    return await desktop_manager.media_previous_track(language)

@router.post("/media/stop")
async def stop_music(language: str = "en"):
    """Media Stop"""
    return await desktop_manager.media_stop(language)

@router.post("/wallpaper")
async def change_wallpaper(image_path: str, language: str = "en"):
    """Change desktop wallpaper"""
    return await desktop_manager.change_wallpaper(image_path, language)

@router.post("/zoom")
async def zoom_screen(level: int, language: str = "en"):
    """Zoom screen"""
    return await desktop_manager.zoom_screen(level, language)
