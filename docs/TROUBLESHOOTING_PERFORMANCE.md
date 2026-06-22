# Troubleshooting Performance Issues

Diagnose and resolve performance problems in JARVIS v4.0.

---

## 1. Common performance issues and solutions

### High event loop lag (>100ms)

**Symptom**: System status shows `event_loop_lag` above 100ms. UI feels sluggish, WebSocket messages delayed.

**Root causes and fixes:**

| Cause | How to identify | Fix |
|-------|----------------|-----|
| Synchronous file I/O in async context | Search for `open(`, `path.read_text(`, `.readlines(` inside `async def` | Replace with `aiofiles` or `asyncio.to_thread(path.read_text)` |
| Synchronous HTTP calls | Look for `requests.get/post` or `httpx` (sync) in async code | Use `httpx.AsyncClient` or `aiohttp` |
| Blocking `subprocess.run` | Search for `subprocess.run` in async functions | Use `asyncio.create_subprocess_exec` |
| CPU-heavy computation | Profile with `cProfile` | Offload to `asyncio.to_thread` or a `ProcessPoolExecutor` |
| `time.sleep()` in async code | Search for `time.sleep` | Replace with `await asyncio.sleep()` |

**Quick diagnostic:**

```python
# Add to any suspect function to measure execution time
import time

async def suspect_function():
    start = time.perf_counter()
    # ... your code ...
    elapsed = (time.perf_counter() - start) * 1000
    if elapsed > 50:  # Log anything over 50ms
        logger.warning(f"Slow function: suspect_function took {elapsed:.1f}ms")
```

### Slow LLM responses (>5s)

**Symptom**: User waits several seconds for a response. Proactive suggestions delayed.

**Diagnostic steps:**

1. Check which provider is active in logs: `LLM Gateway → nvidia`
2. Review cost tracker stats for latency per provider
3. Check if circuit breaker has tripped: `circuit.state == "open"`

**Fixes:**

```python
# 1. Switch to a faster model in .env
OPENROUTER_MODEL=google/gemini-2.0-flash-001  # ~1-2s response time

# 2. Reduce max_tokens for quick queries
await llm_gateway.generate(text, max_tokens=256)  # Default is 4096

# 3. Add temperature reduction for deterministic, faster responses
await llm_gateway.generate(text, temperature=0.3)
```

### Database connection pool exhaustion

**Symptom**: Logs show `asyncpg.exceptions._base.InterfaceError: cannot acquire connection` or `TimeoutError`.

**Diagnostic:**

```python
# Check pool status
pool = db_async._pool
if pool:
    print(f"Pool size: {pool.get_size()}")
    print(f"Free connections: {pool.get_idle_size()}")
    print(f"Min size: {pool.get_min_size()}")
    print(f"Max size: {pool.get_max_size()}")
```

**Fixes:**

1. Ensure all database access uses context managers (`async with db_async.connection()`)
2. Do NOT hold connections across LLM calls or other slow operations
3. Increase `max_size` in `database_async.py` if genuinely needed (max 20)
4. Add connection timeout monitoring

### WebSocket disconnections

**Symptom**: Frontend loses connection. Status broadcasts stop.

**Causes:**

- Event loop lag causing heartbeat timeout
- Too many concurrent WebSocket connections exhausting resources
- Network interruption

**Fixes:**

```python
# In websocket manager, ensure ping/pong is active
# The status broadcast runs every 5 seconds and acts as implicit heartbeat

# Check active connections
from utils.websocket_manager import manager
print(f"Active WebSocket connections: {len(manager.active_connections)}")
```

---

## 2. How to identify event loop blocking

### Method 1: Built-in lag monitor

JARVIS already monitors event loop lag every 1 second in `main.py:monitor_event_loop_lag()`. Watch the logs:

```
INFO  Event loop monitor started (threshold=100.0ms)
WARNING CRITICAL: Event loop lag detected! 156.32ms. Some code is blocking the loop.
```

The lag value is also exposed in the system status API response as `event_loop_lag`.

### Method 2: py-spy (production profiling)

```bash
# Install
pip install py-spy

# Attach to running JARVIS process
py-spy top --pid $(pgrep -f "uvicorn backend.main")

# Record a flame graph
py-spy record -o profile.svg --duration 10 --pid $(pgrep -f "uvicorn backend.main")
```

### Method 3: Manual instrumentation

```python
import asyncio
import time
from contextlib import asynccontextmanager

@asynccontextmanager
async def measure_block(name: str, threshold_ms: float = 50.0):
    """Context manager that warns if a block takes too long."""
    start = time.perf_counter()
    yield
    elapsed_ms = (time.perf_counter() - start) * 1000
    if elapsed_ms > threshold_ms:
        logger.warning(f"Blocking detected in '{name}': {elapsed_ms:.1f}ms")

# Usage
async def my_handler():
    async with measure_block("database_query"):
        result = await db_manager.fetchall("SELECT ...")
```

### Method 4: asyncio debug mode

```bash
# Run with Python's built-in async debug mode
PYTHONASYNCIODEBUG=1 python -m uvicorn backend.main:app
```

This logs warnings for coroutines that take longer than `slow_callback_duration` (default 100ms) to complete.

---

## 3. Database connection debugging

### Check PostgreSQL is running

```bash
# Windows
pg_isready -h localhost -p 5432

# Check connection
psql -h localhost -U jarvis -d jarvis -c "SELECT 1;"
```

### Verify pool initialization

```python
# In a Python shell or debug endpoint
from utils.database_async import db_async
await db_async.initialize()
health = await db_async.health_check()
print(health)
# {"status": "healthy", "type": "postgresql", "conversations": 150, ...}
```

### Check active queries

```sql
-- In PostgreSQL console
SELECT pid, state, query, query_start, now() - query_start AS duration
FROM pg_stat_activity
WHERE datname = 'jarvis'
ORDER BY duration DESC;
```

### Kill long-running queries

```sql
-- Cancel a query (safe)
SELECT pg_cancel_backend(<pid>);

-- Terminate a connection (forceful)
SELECT pg_terminate_backend(<pid>);
```

### Connection pool sizing

```sql
-- Check max connections configured
SHOW max_connections;

-- Check current connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'jarvis';
```

### Verify pgvector extension

```sql
-- Check if pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'neural_vectors';
```

---

## 4. Memory leak detection

### Symptom: Growing memory usage

Monitor JARVIS process memory over time:

```bash
# Quick check
tasklist /FI "IMAGENAME eq python.exe"  # Windows
ps aux | grep uvicorn  # Linux/macOS

# Continuous monitoring (every 30 seconds)
while true; do
    echo "$(date): $(ps -o rss= -p $(pgrep -f uvicorn) | awk '{print $1/1024 " MB"}')"
    sleep 30
done
```

### Common leak sources

#### 1. Unbounded CostTracker history

The `CostTracker._history` list grows indefinitely across a long-running session.

```python
# Check current size
from modules.llm_gateway import cost_tracker
print(f"CostTracker records: {len(cost_tracker._history)}")
```

**Fix**: Implement a bounded history (see ADR-002).

#### 2. Uncached async generators

```python
# ❌ Creates a new generator each time, may hold references
async for chunk in some_stream():
    pass
# If the generator is not fully consumed, resources may leak
```

#### 3. Circular references in WebSocket manager

```python
# Check active connections
from utils.websocket_manager import manager
print(f"WebSocket connections: {len(manager.active_connections)}")

# If count grows unbounded, connections are not being cleaned up on disconnect
```

#### 4. Task leak from `create_task` without tracking

```python
# ❌ Fire-and-forget without tracking — may accumulate
asyncio.create_task(background_work())

# ✅ Track tasks for cleanup
_background_tasks = set()

def spawn_background(coro):
    task = asyncio.create_task(coro)
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)
    return task
```

### Memory profiling tools

```bash
# tracemalloc — built-in Python memory profiler
python -c "
import tracemalloc
tracemalloc.start()
# ... run your workload ...
snapshot = tracemalloc.take_snapshot()
for stat in snapshot.statistics('lineno')[:10]:
    print(stat)
"

# objgraph — find reference cycles
pip install objgraph
python -c "
import objgraph
objgraph.show_most_common_types(limit=10)
objgraph.show_growth(limit=10)
"
```

---

## Quick reference: performance checklist

Before deploying or reviewing code, verify:

- [ ] No `time.sleep()`, `requests.*`, `subprocess.run`, or synchronous file I/O in async functions
- [ ] All `asyncio.gather` calls use `return_exceptions=True` for independent tasks
- [ ] Database connections use context managers (`async with`)
- [ ] No database connections held across LLM calls
- [ ] `asyncio.create_task` results are tracked (or fire-and-forget is intentional)
- [ ] Embedding sync uses hash-based diff (only re-embed changed nodes)
- [ ] Conversation pruning runs before LLM calls (limit=25)
- [ ] RAG context stays within `MAX_CONTEXT_TOKENS = 3000`
- [ ] Event loop lag stays below 100ms under normal load

---

## Related documents

- [Performance Optimization Guide](PERFORMANCE_GUIDE.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Troubleshooting Guide (General)](TROUBLESHOOTING.md)
