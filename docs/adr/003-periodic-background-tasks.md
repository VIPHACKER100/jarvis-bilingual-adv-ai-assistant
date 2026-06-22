# ADR-003: Structured periodic background tasks

**Status:** Accepted
**Date:** 2026-06-23
**Deciders:** JARVIS Development Team

---

## Context

JARVIS v4.0 runs several periodic background tasks during its lifespan:

1. **System status broadcast** — every 5 seconds, collects CPU/memory/network metrics and broadcasts to WebSocket clients
2. **Event loop lag monitor** — every 1 second, measures event loop latency
3. **Proactive analysis loop** — every 15 seconds, analyzes the active window for proactive suggestions
4. **Vector sync** — on startup and after decision log updates, regenerates embeddings for changed memory nodes

These tasks are currently created as fire-and-forget `asyncio.create_task()` calls in the `lifespan` handler:

```python
# In main.py lifespan
status_broadcast_task = asyncio.create_task(broadcast_system_status())
lag_monitor_task = asyncio.create_task(monitor_event_loop_lag())
```

Performance profiling identified several issues with this approach:

- **No lifecycle management**: Tasks are cancelled on shutdown but not tracked for graceful completion
- **No error isolation**: A crash in one task does not propagate, but the task silently stops
- **No configuration**: Intervals are hardcoded, making tuning impossible without code changes
- **No observability**: No metrics on task execution frequency, error rates, or resource consumption

## Decision

Implement a structured `BackgroundTaskManager` that provides lifecycle management, error handling, and observability for all periodic tasks.

### Implementation

```python
import asyncio
import time
from typing import Dict, Callable, Awaitable, Optional
from dataclasses import dataclass, field
from utils.logger_structured import logger


@dataclass
class PeriodicTask:
    """Configuration for a periodic background task."""
    name: str
    coro_factory: Callable[[], Awaitable[None]]
    interval_sec: float
    enabled: bool = True
    _task: Optional[asyncio.Task] = field(default=None, repr=False)
    _error_count: int = field(default=0, repr=False)
    _last_run: float = field(default=0.0, repr=False)


class BackgroundTaskManager:
    """Manages lifecycle of periodic background tasks with error isolation."""

    def __init__(self):
        self._tasks: Dict[str, PeriodicTask] = {}
        self._running = False

    def register(self, name: str, coro_factory: Callable[[], Awaitable[None]],
                 interval_sec: float, enabled: bool = True) -> None:
        """Register a periodic task. Does not start it."""
        self._tasks[name] = PeriodicTask(
            name=name,
            coro_factory=coro_factory,
            interval_sec=interval_sec,
            enabled=enabled,
        )
        logger.debug(f"Registered background task: {name} (interval={interval_sec}s)")

    async def start_all(self) -> None:
        """Start all registered and enabled tasks."""
        self._running = True
        for name, task in self._tasks.items():
            if task.enabled:
                task._task = asyncio.create_task(
                    self._run_loop(task),
                    name=f"bg-{name}",
                )
                logger.info(f"Started background task: {name}")

    async def stop_all(self) -> None:
        """Gracefully stop all tasks."""
        self._running = False
        for name, task in self._tasks.items():
            if task._task and not task._task.done():
                task._task.cancel()
                try:
                    await task._task
                except asyncio.CancelledError:
                    pass
                logger.info(f"Stopped background task: {name}")

    async def _run_loop(self, task: PeriodicTask) -> None:
        """Execute a periodic task with error isolation."""
        while self._running:
            try:
                start = time.perf_counter()
                await task.coro_factory()
                elapsed_ms = (time.perf_counter() - start) * 1000
                task._last_run = time.time()

                if elapsed_ms > 1000:
                    logger.warning(
                        f"Background task '{task.name}' took {elapsed_ms:.0f}ms "
                        f"(interval: {task.interval_sec}s)"
                    )
            except asyncio.CancelledError:
                break
            except Exception as e:
                task._error_count += 1
                logger.error(
                    f"Background task '{task.name}' error #{task._error_count}: {e}"
                )

            try:
                await asyncio.sleep(task.interval_sec)
            except asyncio.CancelledError:
                break

    def get_status(self) -> Dict[str, dict]:
        """Return status of all registered tasks."""
        return {
            name: {
                "enabled": task.enabled,
                "running": task._task is not None and not task._task.done(),
                "error_count": task._error_count,
                "last_run": task._last_run,
                "interval_sec": task.interval_sec,
            }
            for name, task in self._tasks.items()
        }


# Global instance
background_manager = BackgroundTaskManager()
```

### Integration in main.py

```python
from utils.background_tasks import background_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Register tasks
    background_manager.register(
        "status_broadcast",
        coro_factory=broadcast_system_status,
        interval_sec=5.0,
    )
    background_manager.register(
        "lag_monitor",
        coro_factory=monitor_event_loop_lag,
        interval_sec=1.0,
    )

    # Start all
    await background_manager.start_all()

    yield

    # Graceful shutdown
    await background_manager.stop_all()
```

### Integration with proactive engine

```python
# In proactive.py — register as a background task
background_manager.register(
    "proactive_analysis",
    coro_factory=proactive_manager._analysis_loop_body,
    interval_sec=15.0,
)
```

## Alternatives considered

### 1. Keep current fire-and-forget approach

**Rejected because**: No error isolation, no observability, tasks silently die on unhandled exceptions, and shutdown is not graceful.

### 2. Use APScheduler or similar library

**Rejected because**: Adds an external dependency for functionality that can be implemented in ~80 lines of Python. JARVIS's task requirements are simple (fixed-interval loops) and don't need cron expressions, job stores, or distributed scheduling.

### 3. Use `asyncio.TaskGroup` (Python 3.11+)

**Rejected because**: `TaskGroup` cancels all tasks if one fails, which is too aggressive for independent background tasks. JARVIS needs error isolation — a crash in the proactive engine should not stop status broadcasts.

## Consequences

### Positive

- **Error isolation**: One task crashing does not affect others
- **Graceful shutdown**: All tasks are properly cancelled and awaited on shutdown
- **Observability**: `get_status()` exposes error counts, last run times, and running state
- **Configurability**: Intervals and enabled state are set at registration time
- **Testability**: Tasks can be tested individually by calling `coro_factory()` directly

### Negative

- **Added complexity**: ~80 lines of new code for the manager class
- **One more global**: `background_manager` singleton (acceptable — follows existing pattern)

### Neutral

- All existing background tasks continue to work without behavioral changes
- Task intervals remain the same by default (5s status, 1s lag, 15s proactive)
- The proactive engine's `_analysis_loop` is refactored to expose a single-iteration method

## References

- Source files: `backend/main.py` (lifespan handler), `backend/modules/proactive.py`
- Related ADR: N/A (this is a standalone infrastructure decision)
- Performance guide: `docs/PERFORMANCE_GUIDE.md` (monitoring section)
