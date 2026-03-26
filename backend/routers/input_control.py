from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from modules.input_control import input_controller

router = APIRouter(prefix="/api/input", tags=["Input Control"])

@router.get("/cursor")
async def get_cursor_position():
    """Get current cursor position"""
    return await input_controller.get_cursor_position()

@router.post("/move")
async def move_cursor(x: int, y: int):
    """Move cursor to position"""
    return await input_controller.move_cursor(x, y)

@router.post("/click")
async def click_mouse(button: str = "left"):
    """Click mouse button"""
    return await input_controller.click(button)

@router.post("/double_click")
async def double_click():
    """Double click"""
    return await input_controller.double_click()

@router.post("/right_click")
async def right_click():
    """Right click"""
    return await input_controller.right_click()

@router.post("/type")
async def type_text(text: str):
    """Type text keyboard simulation"""
    return await input_controller.type_text(text)

@router.post("/press")
async def press_key(key: str):
    """Press keyboard key"""
    return await input_controller.press_key(key)

@router.post("/scroll")
async def scroll(amount: int):
    """Scroll mouse wheel"""
    return await input_controller.scroll(amount)

@router.post("/drag")
async def drag_to(x: int, y: int):
    """Drag mouse to position"""
    return await input_controller.drag_to(x, y)

@router.post("/shortcut")
async def hotkey(keys: list):
    """Run keyboard shortcut (hotkey combo)"""
    return await input_controller.hotkey(keys)
