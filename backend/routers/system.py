from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from modules.system import system_module
from models import (
    BaseResponse, SystemStatusResponse, BatteryResponse, 
    TimeResponse, DateResponse, VolumeResponse,
    UptimeResponse, NetworkInfoResponse
)

router = APIRouter(prefix="/api/system", tags=["System"])

@router.get("/status", response_model=SystemStatusResponse)
async def get_system_status(language: str = "en"):
    """Get complete system status"""
    return await system_module.get_system_status(language)

@router.get("/battery", response_model=BatteryResponse)
async def get_battery_status(language: str = "en"):
    """Get battery information"""
    return await system_module.get_battery_status(language)

@router.get("/time", response_model=TimeResponse)
async def get_time(language: str = "en"):
    """Get current time"""
    return await system_module.get_time(language)

@router.get("/date", response_model=DateResponse)
async def get_date(language: str = "en"):
    """Get current date"""
    return await system_module.get_date(language)

@router.post("/shutdown", response_model=BaseResponse)
async def shutdown(language: str = "en", confirmed: bool = False):
    """Shutdown computer"""
    return await system_module.shutdown(language, confirmed)

@router.post("/restart", response_model=BaseResponse)
async def restart(language: str = "en", confirmed: bool = False):
    """Restart computer"""
    return await system_module.restart(language, confirmed)

@router.post("/sleep", response_model=BaseResponse)
async def sleep(language: str = "en", confirmed: bool = False):
    """Sleep/suspend computer"""
    return await system_module.sleep(language, confirmed)

@router.post("/volume/up", response_model=VolumeResponse)
async def volume_up(amount: Optional[int] = None, language: str = "en"):
    """Increase volume"""
    return await system_module.volume_up(amount, language)

@router.post("/volume/down", response_model=VolumeResponse)
async def volume_down(amount: Optional[int] = None, language: str = "en"):
    """Decrease volume"""
    return await system_module.volume_down(amount, language)

@router.post("/mute", response_model=BaseResponse)
async def toggle_mute(language: str = "en"):
    """Toggle system mute state"""
    return await system_module.toggle_mute(language)

@router.get("/uptime", response_model=UptimeResponse)
async def get_uptime(language: str = "en"):
    """Get system uptime"""
    return await system_module.get_uptime(language)

@router.get("/network", response_model=NetworkInfoResponse)
async def get_network_info(language: str = "en"):
    """Get network connection information"""
    return await system_module.get_network_info(language)

@router.get("/weather", response_model=BaseResponse)
async def get_weather(city: Optional[str] = None, language: str = "en"):
    """Get weather info"""
    return await system_module.get_weather(city, language)

@router.post("/search", response_model=BaseResponse)
async def google_search(query: str, language: str = "en"):
    """Open web browser for Google search"""
    return await system_module.google_search(query, language)
