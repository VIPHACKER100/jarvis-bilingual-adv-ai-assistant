"""
JARVIS v4.0 — SQLite Database Manager (stdlib sqlite3 + asyncio.to_thread)

Replaces the former asyncpg/PostgreSQL manager with a zero-dependency SQLite
backend.  Single-user desktop assistant doesn't need connection pools.
"""

import os
import sqlite3
import asyncio
from pathlib import Path
from typing import Any, Optional

from utils.logger_structured import logger

# Database lives next to data/ (PROJECT_ROOT / data / jarvis.db)
from config import DATA_DIR

DB_PATH = os.getenv("DB_PATH", str(DATA_DIR / "jarvis.db"))


# ── Schema (all tables at once, no migrations needed) ──────────────────────

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
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_session   ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_command_type ON conversations(command_type);

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
CREATE INDEX IF NOT EXISTS idx_memory_category ON memory(category);
CREATE INDEX IF NOT EXISTS idx_memory_key      ON memory(key);

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
CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);

CREATE TABLE IF NOT EXISTS paired_devices (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id    TEXT    UNIQUE NOT NULL,
    device_name  TEXT    NOT NULL,
    device_type  TEXT    DEFAULT 'mobile',
    access_token TEXT    NOT NULL,
    paired_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    last_seen    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS quick_actions (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    label   TEXT    NOT NULL,
    command TEXT    NOT NULL,
    icon    TEXT,
    "order" INTEGER DEFAULT 0
);
"""


# ── Helpers ────────────────────────────────────────────────────────────────


def _init_db(db_path: str) -> None:
    """Create tables on a fresh database."""
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.executescript(_SCHEMA_SQL)
        conn.commit()


class CursorResult:
    """Mimics sqlite3.Cursor metadata so callers can read .lastrowid / .rowcount."""
    __slots__ = ("lastrowid", "rowcount")

    def __init__(self, lastrowid: Optional[int] = None, rowcount: int = 0):
        self.lastrowid = lastrowid
        self.rowcount = rowcount


# ── Public Manager ─────────────────────────────────────────────────────────


class DatabaseManager:
    """SQLite database manager — every public method is async via asyncio.to_thread."""

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or DB_PATH
        self._initialized = False
        self._degraded = False
        self.row_factory = None  # absorb stray assignments from old code

    async def initialize(self) -> None:
        if self._initialized:
            return
        try:
            await asyncio.to_thread(_init_db, self.db_path)
            self._initialized = True
            self._degraded = False
            logger.info("SQLite database ready at %s", self.db_path)
        except Exception as exc:
            logger.warning("Database init failed — degraded mode: %s", exc)
            self._degraded = True

    # ── Internal helpers ───────────────────────────────────────────────

    def _conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        return conn

    # ── Public query API ───────────────────────────────────────────────

    async def execute(self, sql: str, params: tuple = ()) -> CursorResult:
        if self._degraded:
            return CursorResult()

        def _run() -> CursorResult:
            with self._conn() as conn:
                cur = conn.execute(sql, params)
                conn.commit()
                return CursorResult(lastrowid=cur.lastrowid, rowcount=cur.rowcount)

        return await asyncio.to_thread(_run)

    async def fetchone(self, sql: str, params: tuple = ()) -> Optional[sqlite3.Row]:
        if self._degraded:
            return None

        def _run():
            with self._conn() as conn:
                return conn.execute(sql, params).fetchone()

        return await asyncio.to_thread(_run)

    async def fetchall(self, sql: str, params: tuple = ()) -> list[sqlite3.Row]:
        if self._degraded:
            return []

        def _run():
            with self._conn() as conn:
                return conn.execute(sql, params).fetchall()

        return await asyncio.to_thread(_run)

    async def fetchrow(self, sql: str, params: tuple = ()) -> Optional[sqlite3.Row]:
        """Alias for fetchone (used by old code)."""
        return await self.fetchone(sql, params)

    async def fetchval(self, sql: str, params: tuple = ()) -> Any:
        if self._degraded:
            return None

        def _run():
            row = self._conn().execute(sql, params).fetchone()
            return row[0] if row else None

        return await asyncio.to_thread(_run)

    # ── Health ─────────────────────────────────────────────────────────

    async def health_check(self) -> dict:
        try:
            row = await self.fetchone("SELECT COUNT(*) AS cnt FROM conversations")
            conv_count = row["cnt"] if row else 0

            row = await self.fetchone("SELECT COUNT(*) AS cnt FROM memory")
            fact_count = row["cnt"] if row else 0

            size = os.path.getsize(self.db_path) if os.path.exists(self.db_path) else 0

            return {
                "status": "healthy",
                "type": "sqlite",
                "conversations": conv_count,
                "facts": fact_count,
                "size_bytes": size,
            }
        except Exception as exc:
            return {"status": "unhealthy", "error": str(exc), "type": "sqlite"}

    async def close(self) -> None:
        self._initialized = False
        logger.info("SQLite database closed")


# Singleton
db_manager = DatabaseManager()
