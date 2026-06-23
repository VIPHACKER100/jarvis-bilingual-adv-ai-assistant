from fastapi import APIRouter
from models import AutomationTaskRequest, BaseResponse, MacroRequest
from modules.automation import automation_manager

router = APIRouter(prefix="/automation", tags=["Automation"])


@router.post("/task", response_model=BaseResponse)
async def create_task(data: AutomationTaskRequest):
    """Schedule a new task"""
    task = automation_manager.create_task(
        name=data.name,
        description=data.name,
        command=data.command,
        schedule_type=data.schedule_type,
        schedule_time=str(data.interval_seconds) if data.interval_seconds else data.cron_expression or "",
        parameters={},
        enabled=data.enabled,
    )
    return {
        "success": task is not None,
        "response": f"Task created: {data.name}" if task else "Failed to create task",
    }


@router.get("/tasks")
async def get_tasks():
    """List all scheduled tasks"""
    tasks = automation_manager.get_all_tasks()
    data = [
        {
            "id": t.id,
            "name": t.name,
            "description": t.description,
            "command": t.command,
            "schedule_type": t.schedule_type,
            "schedule_time": t.schedule_time,
            "enabled": t.enabled,
        }
        for t in tasks
    ]
    return {"success": True, "tasks": data}


@router.post("/task/{task_id}/toggle", response_model=BaseResponse)
async def toggle_task(task_id: str):
    """Enable/Disable a task"""
    result = automation_manager.toggle_task(task_id)
    return {"success": result, "response": f"Task {task_id} toggled"}


@router.delete("/task/{task_id}", response_model=BaseResponse)
async def delete_task(task_id: str):
    """Remove a task"""
    result = automation_manager.delete_task(task_id)
    return {"success": result, "response": f"Task {task_id} deleted"}


@router.post("/macro", response_model=BaseResponse)
async def create_macro(data: MacroRequest):
    """Create a new command macro"""
    macro = automation_manager.create_macro(
        name=data.name,
        description=data.description or "",
        commands=[{"command": c, "delay": 0} for c in data.commands],
        trigger="manual",
        trigger_phrase=data.trigger_phrase or "",
    )
    return {
        "success": macro is not None,
        "response": f"Macro created: {data.name}" if macro else "Failed",
    }


@router.get("/macros")
async def get_macros():
    """List all saved macros"""
    macros = automation_manager.get_all_macros()
    data = [
        {
            "id": m.id,
            "name": m.name,
            "description": m.description,
            "trigger": m.trigger,
            "enabled": m.enabled,
            "commands": m.commands,  # Ensure commands are returned to avoid frontend crash
        }
        for m in macros
    ]
    return {"success": True, "macros": data}


@router.post("/macro/{macro_id}/run", response_model=BaseResponse)
async def run_macro(macro_id: str):
    """Run a macro manually"""
    result = automation_manager.run_macro_manually(macro_id)
    return {"success": result, "response": f"Macro {macro_id} executed"}


@router.get("/status")
async def get_automation_status():
    """Get scheduler engine status"""
    status = automation_manager.get_scheduler_status()
    return {"success": True, "status": status}
