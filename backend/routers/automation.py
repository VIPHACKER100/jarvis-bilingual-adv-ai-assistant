from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.automation import automation_manager

router = APIRouter(prefix="/api/automation", tags=["Automation"])

@router.post("/task")
async def create_task(task_data: Dict[str, Any]):
    """Schedule a new task"""
    return await automation_manager.create_task(task_data)

@router.get("/tasks")
async def get_tasks():
    """List all scheduled tasks"""
    return await automation_manager.get_all_tasks()

@router.post("/task/{task_id}/toggle")
async def toggle_task(task_id: str):
    """Enable/Disable a task"""
    return await automation_manager.toggle_task(task_id)

@router.delete("/task/{task_id}")
async def delete_task(task_id: str):
    """Remove a task"""
    return await automation_manager.delete_task(task_id)

@router.post("/macro")
async def create_macro(macro_data: Dict[str, Any]):
    """Create a new command macro"""
    return await automation_manager.create_macro(macro_data)

@router.get("/macros")
async def get_macros():
    """List all saved macros"""
    return await automation_manager.get_all_macros()

@router.post("/macro/{macro_id}/run")
async def run_macro(macro_id: str):
    """Run a macro manually"""
    # Assuming macro_cmd_callback handled in background if needed
    return await automation_manager.run_macro_manually(macro_id)

@router.get("/status")
async def get_automation_status():
    """Get scheduler engine status"""
    return await automation_manager.get_scheduler_status()
