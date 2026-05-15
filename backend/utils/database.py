"""
JARVIS v3.8.0 — Centralized Database Manager

Provides connection pooling, WAL mode, migration support, and
health-check probes for the aiosqlite-backed memory system.
"""

import asyncio
import aiosqlite
from pathlib import Path
from typing import Optional, AsyncGenerator
from contextlib import asynccontextmanager

from utils.logger import logger
from config import DATA_DIR, BASE_DIR


class DatabaseManager:
    """
    Centralized database connection manager with:
    - Persistent connection reuse (no per-query connect/close)
    - WAL journal mode for concurrent reads
    - Schema migration runner
    - Health check probe
    """

    def __init__(self, db_path: Optional[Path] = None):
        self.db_path = db_path or (DATA_DIR / "memory.db")
        self._connection: Optional[aiosqlite.Connection] = None
        self._lock = asyncio.Lock()
        self._initialized = False
        self._migrations_dir = BASE_DIR / "migrations"

    async def initialize(self) -> None:
        """Open the persistent connection and apply pending migrations."""
        if self._initialized:
            return

        async with self._lock:
            if self._initialized:
                return

            self.db_path.parent.mkdir(parents=True, exist_ok=True)
            self._connection = await aiosqlite.connect(str(self.db_path))

            # Enable WAL mode for concurrent reads during writes
            await self._connection.execute("PRAGMA journal_mode=WAL")
            # Enforce foreign keys
            await self._connection.execute("PRAGMA foreign_keys=ON")
            # Reasonable busy timeout (5 seconds)
            await self._connection.execute("PRAGMA busy_timeout=5000")

            await self._run_migrations()
            self._initialized = True
            logger.info(f"Database initialized: {self.db_path} (WAL mode)")

    @asynccontextmanager
    async def connection(self) -> AsyncGenerator[aiosqlite.Connection, None]:
        """
        Yield the shared connection within a safe context.
        All callers share the same underlying connection; the lock
        serializes write operations to prevent corruption.
        """
        if not self._initialized:
            await self.initialize()

        if self._connection is None:
            raise RuntimeError("Database connection is closed")

        yield self._connection

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[aiosqlite.Connection, None]:
        """
        Yield the connection inside an explicit transaction.
        Automatically commits on success, rolls back on exception.
        """
        async with self._lock:
            if not self._initialized:
                await self.initialize()

            if self._connection is None:
                raise RuntimeError("Database connection is closed")

            try:
                await self._connection.execute("BEGIN")
                yield self._connection
                await self._connection.execute("COMMIT")
            except Exception:
                await self._connection.execute("ROLLBACK")
                raise

    async def execute(self, sql: str, params: tuple = ()) -> aiosqlite.Cursor:
        """Execute a single SQL statement on the shared connection."""
        async with self.connection() as db:
            cursor = await db.execute(sql, params)
            await db.commit()
            return cursor

    async def fetchone(self, sql: str, params: tuple = ()) -> Optional[tuple]:
        """Execute and fetch a single row."""
        async with self.connection() as db:
            cursor = await db.execute(sql, params)
            return await cursor.fetchone()

    async def fetchall(self, sql: str, params: tuple = ()) -> list:
        """Execute and fetch all rows."""
        async with self.connection() as db:
            cursor = await db.execute(sql, params)
            return await cursor.fetchall()

    async def close(self) -> None:
        """Close the persistent connection cleanly."""
        if self._connection:
            try:
                await self._connection.close()
            except Exception as e:
                logger.warning(f"Error closing database: {e}")
            finally:
                self._connection = None
                self._initialized = False
                logger.info("Database connection closed")

    async def health_check(self) -> dict:
        """Probe database connectivity and return status."""
        try:
            async with self.connection() as db:
                cursor = await db.execute("SELECT COUNT(*) FROM conversations")
                row = await cursor.fetchone()
                conv_count = row[0] if row else 0

                cursor = await db.execute("SELECT COUNT(*) FROM memory")
                row = await cursor.fetchone()
                fact_count = row[0] if row else 0

                cursor = await db.execute("PRAGMA page_count")
                page_count = (await cursor.fetchone())[0]
                cursor = await db.execute("PRAGMA page_size")
                page_size = (await cursor.fetchone())[0]
                db_size = page_count * page_size

            return {
                "status": "healthy",
                "path": str(self.db_path),
                "conversations": conv_count,
                "facts": fact_count,
                "size_bytes": db_size,
                "wal_mode": True,
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "path": str(self.db_path),
            }

    # ─── Migration Runner ─────────────────────────────────────────────────

    async def _run_migrations(self) -> None:
        """
        Apply SQL migration files in order.
        Tracks applied migrations in a `_schema_version` table.
        """
        if self._connection is None:
            return

        # Ensure version tracking table exists
        await self._connection.execute("""
            CREATE TABLE IF NOT EXISTS _schema_version (
                version INTEGER PRIMARY KEY,
                filename TEXT NOT NULL,
                applied_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
        """)
        
        # PROACTIVE CHECK: Ensure core tables exist.
        logger.debug(f"Checking for core tables in {self.db_path}...")
        
        # If performance_metrics is missing but _schema_version exists, we might have a corrupted state.
        cursor = await self._connection.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='performance_metrics'")
        table_exists = await cursor.fetchone()
        
        if not table_exists:
            logger.warning(f"Core tables missing in {self.db_path}. Forcing migration v1 from {self._migrations_dir}...")
            initial_migration = self._migrations_dir / "001_initial.sql"
            if initial_migration.exists():
                try:
                    sql = initial_migration.read_text(encoding="utf-8")
                    await self._connection.executescript(sql)
                    # Check if already in _schema_version
                    cursor = await self._connection.execute("SELECT version FROM _schema_version WHERE version = 1")
                    if not await cursor.fetchone():
                        await self._connection.execute(
                            "INSERT INTO _schema_version (version, filename) VALUES (1, '001_initial.sql')"
                        )
                    await self._connection.commit()
                    logger.info("Core tables created successfully via forced migration.")
                except Exception as mig_err:
                    logger.error(f"Failed to execute initial migration: {mig_err}")
            else:
                logger.error(f"CRITICAL: Initial migration file not found at {initial_migration}")

        # Get current version
        cursor = await self._connection.execute(
            "SELECT COALESCE(MAX(version), 0) FROM _schema_version"
        )
        row = await cursor.fetchone()
        current_version = row[0] if row else 0

        # Find and apply pending migrations
        if not self._migrations_dir.exists():
            logger.debug(f"No migrations directory found at {self._migrations_dir}")
            return

        migration_files = sorted(self._migrations_dir.glob("*.sql"))
        applied = 0

        for migration_file in migration_files:
            # Extract version number from filename: 001_initial.sql → 1
            try:
                version = int(migration_file.stem.split("_")[0])
            except (ValueError, IndexError):
                logger.warning(f"Skipping malformed migration: {migration_file.name}")
                continue

            if version <= current_version:
                continue

            logger.info(f"Applying migration {migration_file.name} (v{version})...")
            try:
                sql = migration_file.read_text(encoding="utf-8")
                await self._connection.executescript(sql)
                await self._connection.execute(
                    "INSERT INTO _schema_version (version, filename) VALUES (?, ?)",
                    (version, migration_file.name),
                )
                await self._connection.commit()
                applied += 1
                logger.info(f"Migration {migration_file.name} applied successfully")
            except Exception as e:
                logger.error(f"Migration {migration_file.name} failed: {e}")
                raise

        if applied:
            logger.info(f"Applied {applied} migration(s). Current schema version: {current_version + applied}")
        else:
            logger.debug(f"Database schema is up to date (v{current_version})")


# ─── Singleton Instance ───────────────────────────────────────────────────────

db_manager = DatabaseManager()
