from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional, List
from modules.input_control import input_controller
from models import BaseResponse, CursorPositionResponse, ShortcutRequest

router = APIRouter(prefix="/api/input", tags=["Input Control"])

@router.get("/cursor", response_model=CursorPositionResponse)
async def get_cursor_position():
    """Get current cursor position"""
    return await input_controller.get_cursor_position()

@router.post("/move", response_model=BaseResponse)
async def move_cursor(x: int, y: int):
    """Move cursor to position"""
    return await input_controller.move_cursor(x, y)

@router.post("/click", response_model=BaseResponse)
async def click_mouse(button: str = "left"):
    """Click mouse button"""
    return await input_controller.click(button)

@router.post("/double_click", response_model=BaseResponse)
async def double_click():
    """Double click"""
    return await input_controller.double_click()

@router.post("/right_click", response_model=BaseResponse)
async def right_click():
    """Right click"""
    return await input_controller.right_click()

@router.post("/type", response_model=BaseResponse)
async def type_text(text: str = Body(..., embed=True)):
    """Type text keyboard simulation"""
    return await input_controller.type_text(text)

@router.post("/press", response_model=BaseResponse)
async def press_key(key: str = Body(..., embed=True)):
    """Press keyboard key"""
    return await input_controller.press_key(key)

@router.post("/scroll", response_model=BaseResponse)
async def scroll(amount: int = Body(..., embed=True)):
    """Scroll mouse wheel"""
    return await input_controller.scroll(amount)

@router.post("/drag", response_model=BaseResponse)
async def drag_to(x: int, y: int):
    """Drag mouse to position"""
    return await input_controller.drag_to(x, y)

@router.post("/shortcut", response_model=BaseResponse)
async def hotkey(data: ShortcutRequest):
    """Run keyboard shortcut (hotkey combo)"""
    return await input_controller.hotkey(data.keys)
