from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, Optional, List
from modules.system import system_module
from models import (
    BaseResponse, SystemStatusResponse, BatteryResponse, 
    TimeResponse, DateResponse, VolumeResponse,
    UptimeResponse, NetworkInfoResponse
)

router = APIRouter(prefix="/system", tags=["System"])

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

@router.get("/performance/history")
async def get_performance_history(limit: int = Query(60, ge=1, le=1440)):
    """Get historical performance metrics"""
    from modules.memory import memory_manager
    history = await memory_manager.get_performance_history(limit)
    return {"success": True, "data": history}

@router.get("/personalities")
async def get_personalities():
    """Get list of available personalities"""
    from modules.personalities import personality_manager
    return {"success": True, "data": personality_manager.get_all_personalities()}

@router.post("/personality/{p_id}")
async def set_personality(p_id: str):
    """Set system personality and theme"""
    from modules.personalities import personality_manager
    if personality_manager.set_personality(p_id):
        # Save to permanent config
        from config import CONFIG, save_config
        CONFIG["personality"] = p_id
        save_config(CONFIG)
        return {"success": True, "message": f"Personality set to {p_id}", "config": personality_manager.get_config()}
    raise HTTPException(status_code=400, detail="Invalid personality ID")

@router.get("/command-insights")
async def get_command_insights(days: int = Query(30, ge=1, le=365)):
    """Get behavioral command analytics"""
    from modules.memory import memory_manager
    data = await memory_manager.get_command_insights(days)
    return {"success": True, "data": data}

@router.get("/security/processes")
async def get_suspicious_processes():
    """Get all running processes for security analysis"""
    # For now, return all processes with basic info
    import psutil
    processes = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'status']):
        try:
            info = proc.info
            processes.append({
                "pid": info['pid'],
                "name": info['name'],
                "cpu_percent": info['cpu_percent'],
                "memory_mb": info['memory_info'].rss / (1024 * 1024),
                "status": info['status'],
                "threat_level": "safe" # Basic stub
            })
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
    return {"success": True, "processes": sorted(processes, key=lambda x: x['cpu_percent'], reverse=True)[:50]}

@router.get("/security/connections")
async def get_network_scan():
    """Get deep network connection scan"""
    connections = await system_module.get_network_connections()
    return {"success": True, "connections": connections}

@router.post("/security/quarantine")
async def quarantine_process(pid: int, action: str = "suspend"):
    """Quarantine a process"""
    success = await system_module.quarantine_process(pid, action)
    return {"success": success, "response": f"Process {pid} {action}ed" if success else "Failed"}
