from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from modules.system import system_module
from modules.memory import memory_manager
from utils.logger import logger

router = APIRouter(prefix="/api/sync", tags=["sync"])

# In-memory store for paired devices (should be moved to DB for production)
paired_devices = {}

@router.get("/status")
async def get_sync_status():
    """Get system status for mobile dashboard"""
    status = await system_module.get_system_status()
    
    # Enrich with mobile-specific fields
    return {
        "success": True,
        "device_name": "JARVIS-MAIN",
        "system_status": status,
        "active_tasks": [], # Placeholder for active automation tasks
        "last_updated": datetime.now().isoformat()
    }

@router.post("/pair")
async def pair_device(device_info: Dict[str, Any]):
    """Pair a new mobile device"""
    pairing_code = device_info.get("pairing_code")
    device_name = device_info.get("device_name", "Unknown Mobile")
    
    # Simple pairing logic: if code matches (mocked to 'JARVIS-SYNC')
    if pairing_code == "JARVIS-SYNC":
        device_id = str(uuid.uuid4())
        paired_devices[device_id] = {
            "name": device_name,
            "paired_at": datetime.now().isoformat(),
            "last_seen": datetime.now().isoformat()
        }
        
        # Save to persistent settings
        devices = memory_manager.get_setting("paired_devices", [])
        devices.append({"id": device_id, "name": device_name})
        memory_manager.save_setting("paired_devices", devices)
        
        return {
            "success": True,
            "device_id": device_id,
            "message": f"Successfully paired {device_name}"
        }
    
    raise HTTPException(status_code=400, detail="Invalid pairing code")

@router.get("/devices")
async def get_paired_devices():
    """List all paired mobile devices"""
    devices = memory_manager.get_setting("paired_devices", [])
    return {"success": True, "devices": devices}
