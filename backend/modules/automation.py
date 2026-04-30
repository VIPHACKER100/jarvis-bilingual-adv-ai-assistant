import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any, cast
from dataclasses import dataclass, asdict
from pathlib import Path

from config import DATA_DIR
from utils.logger import logger


@dataclass
class ScheduledTask:
    """A scheduled task"""
    id: str
    name: str
    description: str
    command: str  # Command to execute
    schedule_type: str  # 'daily', 'weekly', 'once', 'interval'
    schedule_time: str  # Time in HH:MM format or interval
    # For weekly: ['monday', 'wednesday', etc.]
    days: Optional[List[str]] = None
    enabled: bool = True
    created_at: str = ""
    last_run: str = ""
    run_run: str = ""
    run_count: int = 0
    parameters: Optional[Dict[str, Any]] = None  # Additional parameters
    condition: Optional[str] = None  # e.g., 'battery < 20', 'cpu > 80'


@dataclass
class Macro:
    """A macro - sequence of commands"""
    id: str
    name: str
    description: str
    # List of {command: str, delay: int, parameters: dict}
    commands: List[Dict]
    trigger: str  # 'voice', 'hotkey', 'manual'
    trigger_phrase: str = ""  # Voice trigger phrase
    hotkey: str = ""  # Keyboard shortcut
    enabled: bool = True
    created_at: str = ""
    run_count: int = 0


class AutomationManager:
    """Manage scheduled tasks and macros"""

    def __init__(self):
        self.tasks: Dict[str, ScheduledTask] = {}
        self.macros: Dict[str, Macro] = {}
        self.task_callbacks: Dict[str, Callable] = {}
        self.running: bool = False
        self._scheduler_task: Optional[asyncio.Task] = None

    async def initialize(self):
        """Asynchronously initialize the automation manager"""
        await self._load_data()
        self.create_preset_tasks()
        self.create_preset_macros()
        await self.start_scheduler()
        logger.info("AutomationManager initialized")

    async def _load_data(self):
        """Load tasks and macros from file asynchronously"""
        tasks_file = DATA_DIR / "scheduled_tasks.json"
        macros_file = DATA_DIR / "macros.json"

        def read_file(path):
            if path.exists():
                with open(path, 'r') as f:
                    return json.load(f)
            return None

        if tasks_file.exists():
            try:
                data = await asyncio.to_thread(read_file, tasks_file)
                if data:
                    for task_data in data:
                        task = ScheduledTask(**cast(Any, task_data))
                        self.tasks[task.id] = task
                logger.info(f"Loaded {len(self.tasks)} scheduled tasks")
            except Exception as e:
                logger.error(f"Error loading tasks: {e}")

        if macros_file.exists():
            try:
                data = await asyncio.to_thread(read_file, macros_file)
                if data:
                    for macro_data in data:
                        macro = Macro(**cast(Any, macro_data))
                        self.macros[macro.id] = macro
                logger.info(f"Loaded {len(self.macros)} macros")
            except Exception as e:
                logger.error(f"Error loading macros: {e}")

    async def _save_data(self):
        """Save tasks and macros to file asynchronously"""
        def write_files():
            try:
                tasks_file = DATA_DIR / "scheduled_tasks.json"
                with open(tasks_file, 'w') as f:
                    json.dump([asdict(cast(Any, task))
                              for task in self.tasks.values()], f, indent=2)

                macros_file = DATA_DIR / "macros.json"
                with open(macros_file, 'w') as f:
                    json.dump([asdict(cast(Any, macro))
                              for macro in self.macros.values()], f, indent=2)
                return True
            except Exception as e:
                logger.error(f"Error saving automation data in thread: {e}")
                return False

        success = await asyncio.to_thread(write_files)
        if success:
            logger.debug("Saved automation data")

    async def start_scheduler(self):
        """Start the scheduler as an async task"""
        if self.running:
            return

        self.running = True
        self._scheduler_task = asyncio.create_task(self._run_scheduler_loop())
        logger.info("Automation scheduler started")

    async def stop_scheduler(self):
        """Stop the scheduler"""
        self.running = False
        if self._scheduler_task:
            self._scheduler_task.cancel()
            try:
                await self._scheduler_task
            except asyncio.CancelledError:
                pass
        logger.info("Automation scheduler stopped")

    async def _run_scheduler_loop(self):
        """Run the async scheduler loop"""
        logger.info("Starting async automation scheduler loop")
        while self.running:
            try:
                now = datetime.now()
                for task in list(self.tasks.values()):
                    if not task.enabled:
                        continue
                    
                    if await self._should_run_task(task, now):
                        # Run task in background to not block the loop
                        asyncio.create_task(self._execute_task(task.id))
                
                # Check every minute for precision
                await asyncio.sleep(60)
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                await asyncio.sleep(10)

    async def _should_run_task(self, task: ScheduledTask, now: datetime) -> bool:
        """Determine if a task should run based on its schedule and condition"""
        try:
            # Skip if already run in the last minute to avoid double triggers
            if task.last_run:
                last_run_dt = datetime.fromisoformat(task.last_run)
                if (now - last_run_dt).total_seconds() < 55:
                    return False

            # Check Condition first if present
            if task.condition:
                if not await self._evaluate_condition(task.condition):
                    return False

            current_time = now.strftime("%H:%M")
            current_day = now.strftime("%A").lower()

            if task.schedule_type == 'daily':
                return current_time == task.schedule_time

            elif task.schedule_type == 'weekly':
                if task.days and current_day in [d.lower() for d in task.days]:
                    return current_time == task.schedule_time

            elif task.schedule_type == 'interval':
                if not task.last_run:
                    return True # Run once at startup if never run
                
                last_run_dt = datetime.fromisoformat(task.last_run)
                interval_minutes = int(task.schedule_time)
                return (now - last_run_dt).total_seconds() >= (interval_minutes * 60)

            elif task.schedule_type == 'conditional_only':
                # Only runs if condition is met, checked every minute
                return True if task.condition else False

            return False
        except Exception as e:
            logger.error(f"Error checking schedule for task {task.name}: {e}")
            return False

    async def _evaluate_condition(self, condition: str) -> bool:
        """Evaluate a simple automation condition"""
        try:
            from modules.system import system_module
            status = await system_module.get_system_status()
            
            # Simple expression parser (battery < 20, cpu > 80)
            parts = condition.split()
            if len(parts) != 3:
                return False
                
            variable, operator, value = parts
            value = float(value)
            
            actual_value = 0.0
            if variable == 'battery':
                actual_value = float(status.battery.percent or 0)
            elif variable == 'cpu':
                actual_value = float(status.cpu.percent)
            elif variable == 'memory':
                actual_value = float(status.memory.percent)
            else:
                return False
                
            if operator == '<': return actual_value < value
            if operator == '>': return actual_value > value
            if operator == '<=': return actual_value <= value
            if operator == '>=': return actual_value >= value
            if operator == '==': return actual_value == value
            
            return False
        except Exception as e:
            logger.error(f"Error evaluating condition '{condition}': {e}")
            return False

    async def _execute_task(self, task_id: str):
        """Execute a scheduled task asynchronously"""
        task = self.tasks.get(task_id)
        if not task or not task.enabled:
            return

        logger.info(f"Executing scheduled task: {task.name}")

        # Update task stats
        task.last_run = datetime.now().isoformat()
        task.run_count += 1
        await self._save_data()

        # Call the callback if registered
        if task_id in self.task_callbacks:
            try:
                callback = self.task_callbacks[task_id]
                res = callback(task.command, task.parameters)
                if asyncio.iscoroutine(res):
                    await res
            except Exception as e:
                logger.error(f"Error executing task callback: {e}")

    def register_task_callback(self, task_id: str, callback: Callable):
        """Register a callback function for a task"""
        self.task_callbacks[task_id] = callback

    async def create_task(
            self,
            name: str,
            description: str,
            command: str,
            schedule_type: str,
            schedule_time: str,
            days: List[str] = None,
            parameters: Dict = None,
            enabled: bool = True) -> Optional[ScheduledTask]:
        """Create a new scheduled task asynchronously"""
        try:
            import uuid
            task_id = str(uuid.uuid4())[:8]

            task = ScheduledTask(
                id=task_id,
                name=name,
                description=description,
                command=command,
                schedule_type=schedule_type,
                schedule_time=schedule_time,
                days=days or [],
                enabled=enabled,
                created_at=datetime.now().isoformat(),
                parameters=parameters or {}
            )

            self.tasks[task_id] = task
            await self._save_data()

            logger.info(f"Created scheduled task: {name}")
            return task

        except Exception as e:
            logger.error(f"Error creating task: {e}")
            return None

    async def update_task(self, task_id: str, **kwargs) -> bool:
        """Update an existing task asynchronously"""
        if task_id not in self.tasks:
            return False

        try:
            task = self.tasks[task_id]

            for key, value in kwargs.items():
                if hasattr(task, key):
                    setattr(task, key, value)

            await self._save_data()
            logger.info(f"Updated task: {task.name}")
            return True

        except Exception as e:
            logger.error(f"Error updating task: {e}")
            return False

    async def delete_task(self, task_id: str) -> bool:
        """Delete a scheduled task asynchronously"""
        if task_id not in self.tasks:
            return False

        try:
            task = self.tasks.pop(task_id)
            await self._save_data()
            logger.info(f"Deleted task: {task.name}")
            return True

        except Exception as e:
            logger.error(f"Error deleting task: {e}")
            return False

    def get_all_tasks(self) -> List[ScheduledTask]:
        """Get all scheduled tasks"""
        return list(self.tasks.values())

    def get_task(self, task_id: str) -> Optional[ScheduledTask]:
        """Get a specific task"""
        return self.tasks.get(task_id)

    async def toggle_task(self, task_id: str) -> bool:
        """Toggle task enabled/disabled asynchronously"""
        if task_id not in self.tasks:
            return False

        task = self.tasks[task_id]
        task.enabled = not task.enabled

        await self._save_data()
        logger.info(
            f"{'Enabled' if task.enabled else 'Disabled'} task: {task.name}")
        return True

    # ==================== MACROS ====================

    async def create_macro(
            self,
            name: str,
            description: str,
            commands: List[Dict],
            trigger: str,
            trigger_phrase: str = "",
            hotkey: str = "",
            enabled: bool = True) -> Optional[Macro]:
        """Create a new macro asynchronously"""
        try:
            import uuid
            macro_id = str(uuid.uuid4())[:8]

            macro = Macro(
                id=macro_id,
                name=name,
                description=description,
                commands=commands,
                trigger=trigger,
                trigger_phrase=trigger_phrase,
                hotkey=hotkey,
                enabled=enabled,
                created_at=datetime.now().isoformat()
            )

            self.macros[macro_id] = macro
            await self._save_data()

            logger.info(f"Created macro: {name}")
            return macro

        except Exception as e:
            logger.error(f"Error creating macro: {e}")
            return None

    async def update_macro(self, macro_id: str, **kwargs) -> bool:
        """Update an existing macro asynchronously"""
        if macro_id not in self.macros:
            return False

        try:
            macro = self.macros[macro_id]

            for key, value in kwargs.items():
                if hasattr(macro, key):
                    setattr(macro, key, value)

            await self._save_data()
            logger.info(f"Updated macro: {macro.name}")
            return True

        except Exception as e:
            logger.error(f"Error updating macro: {e}")
            return False

    async def delete_macro(self, macro_id: str) -> bool:
        """Delete a macro asynchronously"""
        if macro_id not in self.macros:
            return False

        try:
            macro = self.macros.pop(macro_id)
            await self._save_data()
            logger.info(f"Deleted macro: {macro.name}")
            return True

        except Exception as e:
            logger.error(f"Error deleting macro: {e}")
            return False

    def get_all_macros(self) -> List[Macro]:
        """Get all macros"""
        return list(self.macros.values())

    def get_macro(self, macro_id: str) -> Optional[Macro]:
        """Get a specific macro"""
        return self.macros.get(macro_id)

    async def run_macro(
            self,
            macro_id: str,
            callback: Callable = None) -> bool:
        """Execute a macro asynchronously"""
        if macro_id not in self.macros:
            return False

        macro = self.macros[macro_id]
        if not macro.enabled:
            return False

        logger.info(f"Running macro: {macro.name}")

        # Execute each command in sequence
        for cmd_data in macro.commands:
            try:
                command = cmd_data.get('command', '')
                delay = cmd_data.get('delay', 1)
                parameters = cmd_data.get('parameters', {})

                if callback:
                    res = callback(command, parameters)
                    if asyncio.iscoroutine(res):
                        await res

                # Wait for specified delay
                if delay > 0:
                    await asyncio.sleep(delay)

            except Exception as e:
                logger.error(f"Error executing macro command: {e}")
                return False

        # Update stats
        macro.run_count += 1
        await self._save_data()

        return True

    def find_macro_by_trigger(self, trigger_phrase: str) -> Optional[Macro]:
        """Find a macro by its voice trigger phrase"""
        trigger_lower = trigger_phrase.lower()

        for macro in self.macros.values():
            if macro.enabled and macro.trigger == 'voice':
                if macro.trigger_phrase.lower() in trigger_lower:
                    return macro

        return None

    async def toggle_macro(self, macro_id: str) -> bool:
        """Toggle macro enabled/disabled asynchronously"""
        if macro_id not in self.macros:
            return False

        macro = self.macros[macro_id]
        macro.enabled = not macro.enabled

        await self._save_data()
        logger.info(
            f"{'Enabled' if macro.enabled else 'Disabled'} macro: {macro.name}")
        return True

    # ==================== PRESETS ====================

    def create_preset_tasks(self):
        """Create useful preset tasks (Synchronous as called during init)"""
        presets = [
            {
                'name': 'Good Morning',
                'description': 'Daily morning routine',
                'command': 'show_desktop',
                'schedule_type': 'daily',
                'schedule_time': '08:00',
                'enabled': False  # Disabled by default
            },
            {
                'name': 'System Check',
                'description': 'Check system status',
                'command': 'system_status',
                'schedule_type': 'interval',
                'schedule_time': '60',  # Every hour
                'enabled': False
            },
            {
                'name': 'Weekly Cleanup',
                'description': 'Clean up old files',
                'command': 'cleanup_temp',
                'schedule_type': 'weekly',
                'schedule_time': '10:00',
                'days': ['sunday'],
                'enabled': False
            }
        ]

        # Use synchronous file check here for simplicity since it's startup
        # and we wrap the whole thing in initialize()
        for preset in presets:
            if not any(t.name == preset['name'] for t in self.tasks.values()):
                # Create basic task object without saving yet
                import uuid
                task_id = str(uuid.uuid4())[:8]
                task = ScheduledTask(
                    id=task_id,
                    name=preset['name'],
                    description=preset['description'],
                    command=preset['command'],
                    schedule_type=preset['schedule_type'],
                    schedule_time=preset['schedule_time'],
                    days=preset.get('days', []),
                    enabled=preset['enabled'],
                    created_at=datetime.now().isoformat()
                )
                self.tasks[task_id] = task

        logger.info("Created preset tasks")

    def create_preset_macros(self):
        """Create useful preset macros (Synchronous as called during init)"""
        presets = [{'name': 'Work Mode',
                    'description': 'Open work applications',
                    'commands': [{'command': 'open_app',
                                   'delay': 2,
                                   'parameters': {'app': 'chrome'}},
                                 {'command': 'open_app',
                                   'delay': 2,
                                   'parameters': {'app': 'vscode'}},
                                 {'command': 'open_app',
                                   'delay': 2,
                                   'parameters': {'app': 'spotify'}}],
                    'trigger': 'voice',
                    'trigger_phrase': 'work mode',
                    'enabled': True},
                   {'name': 'End Work Day',
                    'description': 'Close work applications and show desktop',
                    'commands': [{'command': 'close_app',
                                   'delay': 1,
                                   'parameters': {'app': 'vscode'}},
                                 {'command': 'show_desktop',
                                   'delay': 0,
                                   'parameters': {}}],
                    'trigger': 'voice',
                    'trigger_phrase': 'end work',
                    'enabled': True}]

        for preset in presets:
            if not any(m.name == preset['name'] for m in self.macros.values()):
                import uuid
                macro_id = str(uuid.uuid4())[:8]
                macro = Macro(
                    id=macro_id,
                    name=preset['name'],
                    description=preset['description'],
                    commands=preset['commands'],
                    trigger=preset['trigger'],
                    trigger_phrase=preset['trigger_phrase'],
                    enabled=preset['enabled'],
                    created_at=datetime.now().isoformat()
                )
                self.macros[macro_id] = macro

        logger.info("Created preset macros")

    def get_scheduler_status(self) -> Dict:
        """Get scheduler status"""
        return {
            'running': self.running,
            'total_tasks': len(self.tasks),
            'enabled_tasks': sum(1 for t in self.tasks.values() if t.enabled),
            'total_macros': len(self.macros),
            'enabled_macros': sum(1 for m in self.macros.values() if m.enabled)
        }


# Singleton instance
automation_manager = AutomationManager()
