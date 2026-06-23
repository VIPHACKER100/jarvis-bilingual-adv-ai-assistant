"""
JARVIS v3.8.0 — Test Configuration & Shared Fixtures

Provides isolated test database, mock LLM client, and mock system modules
for reliable, repeatable backend testing.
"""

import asyncio
import sys
from dataclasses import dataclass
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

# Ensure backend is importable
sys.path.insert(0, str(Path(__file__).parent.parent))


# ─── Event Loop ──────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ─── Mock Database ───────────────────────────────────────────────────────────

class MockConnection:
    """Mock asyncpg-compatible connection backed by in-memory dicts."""
    def __init__(self):
        self._tables = {
            "conversations": [],
            "memory": [],
            "sessions": [],
            "performance_metrics": [],
        }
        self._sequences = {"id": 0}

    async def execute(self, sql: str, *args) -> str:
        return "INSERT 0 1"

    async def fetchrow(self, sql: str, *args):
        return None

    async def fetch(self, sql: str, *args):
        return []

    async def fetchval(self, sql: str, *args):
        return self._sequences["id"]

    def cursor(self, *args, **kwargs):
        return self

    async def __aenter__(self): return self
    async def __aexit__(self, *args): pass

    async def close(self):
        pass


class MockPool:
    """Mock asyncpg.Pool."""
    def __init__(self):
        self._conn = MockConnection()

    def acquire(self):
        return self._conn

    async def release(self, conn):
        pass

    async def close(self):
        pass


@pytest_asyncio.fixture
async def test_db():
    pool = MockPool()
    with patch("utils.database.db_manager._pool", pool), \
         patch("utils.database.db_manager._initialized", True):
        yield pool._conn


# ─── Mock LLM Client ─────────────────────────────────────────────────────────

@pytest.fixture
def mock_llm():
    """
    Mock LLM module that returns predictable responses.
    Avoids any real API calls during testing.
    """
    llm = MagicMock()
    llm.get_response = AsyncMock(return_value="Mock JARVIS response.")
    llm.get_visual_response = AsyncMock(return_value="Mock visual analysis.")
    llm.extract_command = AsyncMock(return_value={
        "command_key": "unknown",
        "params": None
    })
    llm.ping_llm = AsyncMock(return_value=True)
    llm.summarize_context = AsyncMock(return_value="Mock context summary.")
    return llm


# ─── Mock System Module ──────────────────────────────────────────────────────

@pytest.fixture
def mock_system():
    """Mock system module to avoid real OS interactions in tests."""
    system = MagicMock()
    system.get_battery_status = AsyncMock(return_value={
        "success": True,
        "percent": 85,
        "is_charging": True,
        "secs_left": -1,
        "response": "Battery is at 85%"
    })
    system.get_time = AsyncMock(return_value={
        "success": True,
        "time": "2026-05-15T10:00:00",
        "formatted": "10:00 AM",
        "response": "It is 10:00 AM"
    })
    system.get_date = AsyncMock(return_value={
        "success": True,
        "date": "2026-05-15T10:00:00",
        "formatted": "Friday, May 15, 2026",
        "response": "Today is Friday, May 15, 2026"
    })
    system.get_volume = AsyncMock(return_value=50)
    system.set_volume = AsyncMock(return_value=True)
    system.get_system_status = AsyncMock(return_value={
        "success": True,
        "battery": {"percent": 85, "is_charging": True, "secs_left": -1},
        "cpu": {"percent": 25.0, "count": 8},
        "memory": {"total": 16000000000, "used": 8000000000, "percent": 50.0, "available": 8000000000},
        "disk": {"total": 500000000000, "used": 250000000000, "free": 250000000000, "percent": 50.0},
        "network": {"bytes_sent": 1000, "bytes_recv": 2000, "packets_sent": 10, "packets_recv": 20},
        "uptime": 3600.0,
        "volume": 50,
        "platform": "Windows",
        "timestamp": "2026-05-15T10:00:00",
        "response": "System is stable, sir."
    })
    return system


# ─── Mock Desktop Module ─────────────────────────────────────────────────────

@pytest.fixture
def mock_desktop():
    """Mock desktop module for screenshot/clipboard operations."""
    desktop = MagicMock()
    desktop.take_screenshot = AsyncMock(return_value="/tmp/test_screenshot.png")
    desktop.get_clipboard = AsyncMock(return_value="test clipboard content")
    desktop.set_clipboard = AsyncMock(return_value=True)
    return desktop


# ─── Mock Memory Manager ─────────────────────────────────────────────────────

@pytest.fixture
def mock_memory():
    """Mock memory manager for conversation/fact operations."""
    memory = MagicMock()
    memory.initialize = AsyncMock()
    memory.save_conversation = AsyncMock(return_value=True)
    memory.get_recent_conversations = AsyncMock(return_value=[])
    memory.save_memory = AsyncMock(return_value=True)
    memory.get_memory = AsyncMock(return_value=None)
    memory.search_memory = AsyncMock(return_value=[])
    memory.get_command_insights = AsyncMock(return_value={
        "top_commands": [],
        "daily_activity": [],
        "peak_hour": {"hour": None, "count": 0},
        "failure_patterns": [],
        "period_days": 30
    })
    memory.get_neural_context = AsyncMock(return_value="")
    memory.list_nodes = AsyncMock(return_value=[])
    memory.save_performance_metric = AsyncMock(return_value=True)
    memory.neural = MagicMock()
    memory.neural.get_neural_context = AsyncMock(return_value="")
    memory.neural.list_nodes = AsyncMock(return_value=[])
    return memory


# ─── Sample Data Factories ───────────────────────────────────────────────────

@dataclass
class SampleConversation:
    """Factory for creating test conversation entries."""
    user_input: str = "What time is it?"
    jarvis_response: str = "It is 10:00 AM."
    command_type: str = "get_time"
    success: bool = True
    language: str = "en"
    session_id: str = "test-session-001"
    timestamp: str = "2026-05-15T10:00:00"


@pytest.fixture
def sample_conversation():
    """Provide a sample conversation entry for testing."""
    return SampleConversation()


@dataclass
class SampleFact:
    """Factory for creating test memory facts."""
    key: str = "favorite_color"
    value: str = "indigo"
    category: str = "preferences"
    source: str = "test"


@pytest.fixture
def sample_fact():
    """Provide a sample memory fact for testing."""
    return SampleFact()
