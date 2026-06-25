# ADR-002: Implement bounded CostTracker history

**Status:** Accepted
**Date:** 2026-06-23
**Deciders:** JARVIS Development Team

---

## Context

The `CostTracker` class in `backend/modules/llm_gateway/cost.py` tracks every LLM API call with provider, model, token counts, latency, and estimated cost. It stores records in an in-memory list (`_history`).

Memory leak detection revealed that across long-running sessions (hours to days), the `_history` list grows unboundedly:

```python
class CostTracker:
    def __init__(self):
        self._history: list[UsageRecord] = []  # Grows forever
```

For a typical session processing ~100 LLM calls per hour, after 24 hours this accumulates ~2,400 `UsageRecord` objects. While each record is small (~200 bytes), this represents ~480KB of heap growth per day — and the linear scan in `total_cost()`, `total_tokens()`, and `stats()` degrades proportionally.

Additionally, the `stats()` method creates filtered sublists (`[r for r in self._history if r.timestamp >= since]`) on every call, which allocates temporary lists without releasing the underlying references.

## Decision

Implement a bounded history with a configurable maximum size. When the limit is exceeded, the oldest records are evicted (FIFO). Add a time-based window option for stats queries.

### Implementation

```python
import time
from typing import Optional
from collections import deque

MAX_HISTORY_SIZE = 1000  # Default, configurable
STATS_WINDOW_HOURS = 24  # Default stats window

class CostTracker:
    def __init__(self, max_size: int = MAX_HISTORY_SIZE):
        self._max_size = max_size
        self._history: deque[UsageRecord] = deque(maxlen=max_size)
        self._session_start = time.time()

    def record(self, provider: str, model: str, prompt_tokens: int = 0,
               completion_tokens: int = 0, latency_ms: float = 0.0,
               success: bool = True) -> UsageRecord:
        record = UsageRecord(
            provider=provider, model=model,
            prompt_tokens=prompt_tokens, completion_tokens=completion_tokens,
            latency_ms=latency_ms, success=success,
        )
        self._history.append(record)  # Auto-evicts oldest when full
        return record

    def _recent(self, since: Optional[float] = None) -> list[UsageRecord]:
        """Return records within the time window, avoiding full scan."""
        if since is None:
            return list(self._history)
        return [r for r in self._history if r.timestamp >= since]

    def total_cost(self, since: Optional[float] = None) -> float:
        return sum(r.estimated_cost for r in self._recent(since))

    def total_tokens(self, since: Optional[float] = None) -> int:
        return sum(r.total_tokens for r in self._recent(since))

    def stats(self, since: Optional[float] = None) -> dict:
        recents = self._recent(since)
        provider_stats = {}
        for r in recents:
            ps = provider_stats.setdefault(
                r.provider, {"calls": 0, "tokens": 0, "cost": 0.0, "failures": 0}
            )
            ps["calls"] += 1
            ps["tokens"] += r.total_tokens
            ps["cost"] += r.estimated_cost
            if not r.success:
                ps["failures"] += 1

        return {
            "total_calls": len(recents),
            "total_tokens": self.total_tokens(since),
            "total_cost": round(self.total_cost(since), 6),
            "session_duration_sec": round(time.time() - self._session_start, 1),
            "providers": provider_stats,
        }
```

### Key design choices

1. **`deque(maxlen=N)`** instead of `list` — O(1) append with automatic eviction, no manual cleanup needed
2. **`max_size = 1000`** — sufficient for 24+ hours of typical usage (100 calls/hour)
3. **`_recent()` helper** — centralizes time-window filtering to avoid duplicate list comprehensions
4. **Backward compatible** — `record()`, `total_cost()`, `total_tokens()`, and `stats()` signatures unchanged

## Alternatives considered

### 1. Keep unbounded list with periodic cleanup

```python
async def cleanup_old_records(self, max_age_hours: int = 24):
    cutoff = time.time() - (max_age_hours * 3600)
    self._history = [r for r in self._history if r.timestamp >= cutoff]
```

**Rejected because**: Requires a periodic background task; adds operational complexity; the deque approach is simpler and zero-maintenance

### 2. Persist to database

Store cost records in a `cost_history` PostgreSQL table.

**Rejected because**: Adds write overhead to every LLM call; the in-memory tracker is for session-level monitoring, not historical analytics. Historical data can be added later as a separate feature if needed.

### 3. Use a circular buffer with fixed-size array

**Rejected because**: `deque(maxlen=N)` is the standard Python circular buffer with optimal C implementation; no custom implementation needed.

## Consequences

### Positive

- **Memory bounded**: Maximum 1,000 records (~200KB) regardless of session length
- **O(1) append**: No list resizing or garbage collection pauses
- **Performance stable**: `stats()` latency remains constant over time
- **Zero-config**: Works out of the box with sensible defaults

### Negative

- **Data loss**: Oldest records are evicted when the buffer is full (acceptable for session monitoring)
- **No historical persistence**: Cost data is lost on restart (acceptable for current use case)

### Neutral

- API surface unchanged — existing consumers (`gateway.py:get_cost_stats()`, system status) work without modification
- Test fixtures for `CostTracker` remain valid

## References

- Source file: `backend/modules/llm_gateway/cost.py`
- Consumer: `backend/modules/llm_gateway/gateway.py:251` (`get_cost_stats`)
- Performance profiling: `docs/PERFORMANCE_GUIDE.md`
