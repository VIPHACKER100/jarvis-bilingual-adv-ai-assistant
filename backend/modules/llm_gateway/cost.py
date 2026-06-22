"""
Cost Tracker — per-provider token usage and cost estimation.
Bounded to 1000 most recent records via collections.deque.
"""

import time
from collections import deque
from typing import Dict, Optional, List
from dataclasses import dataclass, field


# Approximate cost per 1K tokens (USD) — update as prices change
PROVIDER_COST_MAP: Dict[str, float] = {
    "nvidia": 0.00035,
    "openrouter": 0.00015,
    "openai": 0.0025,
    "ollama": 0.0,
}

MAX_HISTORY: int = 1000


@dataclass
class UsageRecord:
    provider: str
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    latency_ms: float = 0.0
    success: bool = True
    timestamp: float = field(default_factory=time.time)

    @property
    def total_tokens(self) -> int:
        return self.prompt_tokens + self.completion_tokens

    @property
    def estimated_cost(self) -> float:
        rate = PROVIDER_COST_MAP.get(self.provider, 0.0)
        return (self.total_tokens / 1000) * rate

    def to_dict(self) -> dict:
        """Serialize for JSON export."""
        return {
            "provider": self.provider,
            "model": self.model,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "latency_ms": self.latency_ms,
            "success": self.success,
            "estimated_cost": round(self.estimated_cost, 8),
            "timestamp": self.timestamp,
        }


class CostTracker:
    """Bounded cost tracker — retains only the most recent MAX_HISTORY records."""

    def __init__(self, max_history: int = MAX_HISTORY) -> None:
        self._history: deque[UsageRecord] = deque(maxlen=max_history)
        self._session_start: float = time.time()

    def record(
        self,
        provider: str,
        model: str,
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        latency_ms: float = 0.0,
        success: bool = True,
    ) -> UsageRecord:
        """Record a usage event. Oldest record is auto-evicted when full."""
        rec = UsageRecord(
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            latency_ms=latency_ms,
            success=success,
        )
        self._history.append(rec)
        return rec

    def total_cost(self, since: Optional[float] = None) -> float:
        recents = (
            self._history
            if since is None
            else [r for r in self._history if r.timestamp >= since]
        )
        return sum(r.estimated_cost for r in recents)

    def total_tokens(self, since: Optional[float] = None) -> int:
        recents = (
            self._history
            if since is None
            else [r for r in self._history if r.timestamp >= since]
        )
        return sum(r.total_tokens for r in recents)

    def stats(self, since: Optional[float] = None) -> dict:
        recents = (
            self._history
            if since is None
            else [r for r in self._history if r.timestamp >= since]
        )
        provider_stats: Dict[str, dict] = {}
        for r in recents:
            ps = provider_stats.setdefault(
                r.provider,
                {"calls": 0, "tokens": 0, "cost": 0.0, "failures": 0},
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

    def export_history(self, since: Optional[float] = None) -> List[dict]:
        """Export records as JSON-serializable list of dicts."""
        recents = (
            self._history
            if since is None
            else [r for r in self._history if r.timestamp >= since]
        )
        return [r.to_dict() for r in recents]

    def clear(self) -> int:
        """Clear all history. Returns the number of records evicted."""
        count = len(self._history)
        self._history.clear()
        return count

    @property
    def size(self) -> int:
        """Current number of tracked records."""
        return len(self._history)

    @property
    def capacity(self) -> int:
        """Maximum records retained."""
        return self._history.maxlen or MAX_HISTORY


cost_tracker = CostTracker()
