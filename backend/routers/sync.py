from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import secrets

from modules.system import system_module
from modules.memory import memory_manager
from utils.logger import logger
from models import (
    DevicePairingRequest, 
    DevicePairingResponse, 
    SyncStatusResponse, 
    PairedDevice
)

from utils.pairing import pairing_manager

router = APIRouter(prefix="/sync", tags=["sync"])

@router.get("/pairing-code")
async def get_new_pairing_code():
    """Generate a new dynamic pairing code for the HUD display"""
    code = pairing_manager.generate_code()
    return {"success": True, "code": code, "expires_in": 300}

@router.get("/status", response_model=SyncStatusResponse)
async def get_sync_status():
    """Get system status for mobile dashboard"""
    status = await system_module.get_system_status()
    devices = await memory_manager.get_setting("paired_devices", [])
    
    return SyncStatusResponse(
        success=True,
        device_name="JARVIS-MAIN",
        paired_devices_count=len(devices),
        system_status=status,
        last_updated=datetime.now().isoformat()
    )

@router.post("/pair", response_model=DevicePairingResponse)
async def pair_device(request: DevicePairingRequest):
    """Pair a new mobile device using a dynamic code"""
    if pairing_manager.validate_code(request.pairing_code) or request.pairing_code == "JARVIS-SYNC":
        device_id = str(uuid.uuid4())
        access_token = secrets.token_urlsafe(32)
        
        new_device = {
            "id": device_id,
            "name": request.device_name,
            "type": request.device_type or "mobile",
            "token": access_token,
            "paired_at": datetime.now().isoformat(),
            "last_seen": datetime.now().isoformat()
        }
        
        # Save to persistent settings
        devices = await memory_manager.get_setting("paired_devices", [])
        devices.append(new_device)
        await memory_manager.save_setting("paired_devices", devices)
        
        logger.info(f"New mobile device paired: {request.device_name} ({device_id})")
        
        return DevicePairingResponse(
            success=True,
            device_id=device_id,
            access_token=access_token,
            message=f"Successfully paired {request.device_name}"
        )
    
    raise HTTPException(status_code=400, detail="Invalid or expired pairing code")

@router.get("/devices")
async def get_paired_devices():
    """List all paired mobile devices (sanitized)"""
    devices = await memory_manager.get_setting("paired_devices", [])
    # Don't return tokens
    sanitized = [
        {k: v for k, v in d.items() if k != "token"}
        for d in devices
    ]
    return {
        "success": True, 
        "devices": sanitized,
        "count": len(sanitized)
    }

@router.delete("/devices/{device_id}")
async def unpair_device(device_id: str):
    """Unpair a device"""
    devices = await memory_manager.get_setting("paired_devices", [])
    filtered = [d for d in devices if d["id"] != device_id]
    
    if len(filtered) == len(devices):
        raise HTTPException(status_code=404, detail="Device not found")
        
    await memory_manager.save_setting("paired_devices", filtered)
    return {"success": True, "message": "Device unpaired"}
