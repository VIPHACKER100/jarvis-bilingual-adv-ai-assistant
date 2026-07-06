"""
JARVIS v4.0 — Test Configuration & Shared Fixtures

Provides isolated test database (in-memory SQLite), mock LLM client,
and mock system modules for reliable, repeatable backend testing.
"""

import asyncio
import os
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import pytest_asyncio

# Ensure backend is importable
sys.path.insert(0, str(Path(__file__).parent.parent))

# ── In-memory SQLite schema ───────────────────────────────────────────

_SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS conversations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp       TEXT    NOT NULL DEFAULT (datetime('now')),
    user_input      TEXT    NOT NULL,
    jarvis_response TEXT    NOT NULL,
    command_type    TEXT,
    success         INTEGER DEFAULT 1,
    context         TEXT,
    language        TEXT    DEFAULT 'en',
    session_id      TEXT
);
CREATE TABLE IF NOT EXISTS memory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    key         TEXT    UNIQUE NOT NULL,
    value       TEXT    NOT NULL,
    category    TEXT    DEFAULT 'general',
    created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
    confidence  REAL    DEFAULT 1.0,
    source      TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id    TEXT    UNIQUE NOT NULL,
    started_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    ended_at      TEXT,
    command_count INTEGER DEFAULT 0,
    metadata      TEXT
);
CREATE TABLE IF NOT EXISTS performance_metrics (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp       TEXT    NOT NULL DEFAULT (datetime('now')),
    event_loop_lag  REAL    NOT NULL,
    cpu_percent     REAL,
    memory_percent  REAL
);
"""


# ─── Event Loop ──────────────────────────────────────────────────────────────


@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ─── Test Database (in-memory SQLite) ────────────────────────────────────────


@pytest_asyncio.fixture
async def test_db():
    """
    Patch db_manager with a temporary file-based SQLite database.
    Uses a temp file so each test gets an isolated, persistent database.
    """
    import tempfile
    from utils.database import db_manager

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    tmp_path = tmp.name

    # Create tables
    c = sqlite3.connect(tmp_path)
    c.row_factory = sqlite3.Row
    c.executescript(_SCHEMA_SQL)
    c.commit()
    c.close()

    # Monkey-patch singleton
    orig_initialized = db_manager._initialized
    orig_degraded = db_manager._degraded
    orig_db_path = db_manager.db_path

    db_manager.db_path = tmp_path
    db_manager._initialized = True
    db_manager._degraded = False

    yield db_manager

    db_manager._initialized = orig_initialized
    db_manager._degraded = orig_degraded
    db_manager.db_path = orig_db_path
    try:
        os.unlink(tmp_path)
    except OSError:
        pass


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
    llm.extract_command = AsyncMock(return_value={"command_key": "unknown", "params": None})
    llm.ping_llm = AsyncMock(return_value=True)
    llm.summarize_context = AsyncMock(return_value="Mock context summary.")
    return llm


# ─── Mock System Module ──────────────────────────────────────────────────────


@pytest.fixture
def mock_system():
    """Mock system module to avoid real OS interactions in tests."""
    system = MagicMock()
    system.get_battery_status = AsyncMock(
        return_value={
            "success": True,
            "percent": 85,
            "is_charging": True,
            "secs_left": -1,
            "response": "Battery is at 85%",
        }
    )
    system.get_time = AsyncMock(
        return_value={
            "success": True,
            "time": "2026-05-15T10:00:00",
            "formatted": "10:00 AM",
            "response": "It is 10:00 AM",
        }
    )
    system.get_date = AsyncMock(
        return_value={
            "success": True,
            "date": "2026-05-15T10:00:00",
            "formatted": "Friday, May 15, 2026",
            "response": "Today is Friday, May 15, 2026",
        }
    )
    system.get_volume = AsyncMock(return_value=50)
    system.set_volume = AsyncMock(return_value=True)
    system.get_system_status = AsyncMock(
        return_value={
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
            "response": "System is stable, sir.",
        }
    )
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
    memory.get_command_insights = AsyncMock(
        return_value={
            "top_commands": [],
            "daily_activity": [],
            "peak_hour": {"hour": None, "count": 0},
            "failure_patterns": [],
            "period_days": 30,
        }
    )
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
