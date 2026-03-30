from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.automation import automation_manager
from models import BaseResponse, AutomationTaskRequest, MacroRequest

router = APIRouter(prefix="/api/automation", tags=["Automation"])

@router.post("/task", response_model=BaseResponse)
async def create_task(data: AutomationTaskRequest):
    """Schedule a new task"""
    return await automation_manager.create_task(data.dict())

@router.get("/tasks")
async def get_tasks():
    """List all scheduled tasks"""
    return await automation_manager.get_all_tasks()

@router.post("/task/{task_id}/toggle", response_model=BaseResponse)
async def toggle_task(task_id: str):
    """Enable/Disable a task"""
    return await automation_manager.toggle_task(task_id)

@router.delete("/task/{task_id}", response_model=BaseResponse)
async def delete_task(task_id: str):
    """Remove a task"""
    return await automation_manager.delete_task(task_id)

@router.post("/macro", response_model=BaseResponse)
async def create_macro(data: MacroRequest):
    """Create a new command macro"""
    return await automation_manager.create_macro(data.dict())

@router.get("/macros")
async def get_macros():
    """List all saved macros"""
    return await automation_manager.get_all_macros()

@router.post("/macro/{macro_id}/run", response_model=BaseResponse)
async def run_macro(macro_id: str):
    """Run a macro manually"""
    return await automation_manager.run_macro_manually(macro_id)

@router.get("/status", response_model=BaseResponse)
async def get_automation_status():
    """Get scheduler engine status"""
    return await automation_manager.get_scheduler_status()
