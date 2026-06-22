"""
JARVIS v4.0 — Async PostgreSQL Database Manager
Drop-in replacement for the SQLite DatabaseManager using asyncpg.
"""

import os
import re
import asyncpg
from pathlib import Path
from typing import Optional, AsyncGenerator, Any, List, Dict
from contextlib import asynccontextmanager

from utils.logger_structured import logger

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://jarvis:jarvis_dev_password@localhost:5432/jarvis"
)


def _parse_url(url: str) -> dict:
    raw = url.replace("postgresql+asyncpg://", "postgresql://")
    from urllib.parse import urlparse
    parsed = urlparse(raw)
    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 5432,
        "user": parsed.username or "jarvis",
        "password": parsed.password or "jarvis_dev_password",
        "database": parsed.path.lstrip("/") or "jarvis",
    }


def _translate_sql(sql: str) -> str:
    count = 1
    def repl(m):
        nonlocal count
        res = f"${count}"
        count += 1
        return res
    return re.sub(r'\?', repl, sql)

class MockCursor:
    def __init__(self, lastrowid=None, rowcount=0, rows=None):
        self.lastrowid = lastrowid
        self.rowcount = rowcount
        self._rows = rows or []

    async def fetchall(self):
        return self._rows

    async def fetchone(self):
        return self._rows[0] if self._rows else None

    def __await__(self):
        async def _ret():
            return self
        return _ret().__await__()
        
    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

class MockCursorWrapper:
    def __init__(self, pool: asyncpg.Pool, sql: str, params: tuple):
        self.pool = pool
        self.sql = sql
        self.params = params
        self.lastrowid = None
        self.rowcount = 0
        self._rows = []

    def __await__(self):
        return self._execute().__await__()

    async def _execute(self):
        is_insert = self.sql.strip().upper().startswith("INSERT")
        pg_sql = _translate_sql(self.sql)
        
        if is_insert and "RETURNING" not in pg_sql.upper():
            pg_sql = f"{pg_sql.rstrip(';')} RETURNING id"
            
        async with self.pool.acquire() as conn:
            if is_insert:
                try:
                    self.lastrowid = await conn.fetchval(pg_sql, *self.params)
                    self.rowcount = 1
                except asyncpg.exceptions.UndefinedColumnError:
                    # In case the table doesn't have an ID column
                    pg_sql = _translate_sql(self.sql)
                    await conn.execute(pg_sql, *self.params)
                    self.rowcount = 1
            else:
                if self.sql.strip().upper().startswith("SELECT") or "RETURNING" in pg_sql.upper():
                    self._rows = await conn.fetch(pg_sql, *self.params)
                    self.rowcount = len(self._rows)
                else:
                    res = await conn.execute(pg_sql, *self.params)
                    if res:
                        parts = res.split()
                        if len(parts) > 1 and parts[-1].isdigit():
                            self.rowcount = int(parts[-1])
        return self

    async def __aenter__(self):
        return await self._execute()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass

    async def fetchall(self):
        return self._rows

    async def fetchone(self):
        return self._rows[0] if self._rows else None


class DatabaseManager:
    """
    PostgreSQL connection pool manager with:
    - Async connection pooling (asyncpg)
    - Schema migration runner
    - SQLite backward compatibility layer
    """

    def __init__(self, dsn: Optional[str] = None):
        self.dsn = dsn or DATABASE_URL
        self._pool: Optional[asyncpg.Pool] = None
        self._initialized = False
        self.row_factory = None # Absorb SQLite row factory assignments

    async def initialize(self) -> None:
        if self._initialized:
            return

        params = _parse_url(self.dsn)
        self._pool = await asyncpg.create_pool(
            host=params["host"],
            port=params["port"],
            user=params["user"],
            password=params["password"],
            database=params["database"],
            min_size=2,
            max_size=10,
            command_timeout=30,
        )
        self._initialized = True
        logger.info(f"PostgreSQL pool initialized: {params['host']}:{params['port']}/{params['database']}")

        await self._run_migrations()

    @asynccontextmanager
    async def connection(self) -> AsyncGenerator[Any, None]:
        if not self._initialized or self._pool is None:
            await self.initialize()

        # Yield self so memory.py can do async with db.execute(...) on it
        yield self

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[Any, None]:
        if not self._initialized or self._pool is None:
            await self.initialize()

        async with self._pool.acquire() as conn:
            async with conn.transaction():
                yield self

    def execute(self, sql: str, params: tuple = ()) -> MockCursorWrapper:
        # Compatibility wrapper for `await db.execute` and `async with db.execute`
        return MockCursorWrapper(self._pool, sql, params)

    async def fetchrow(self, sql: str, params: tuple = ()) -> Optional[asyncpg.Record]:
        return await self.fetchone(sql, params)

    async def fetchone(self, sql: str, params: tuple = ()) -> Optional[asyncpg.Record]:
        pg_sql = _translate_sql(sql)
        async with self._pool.acquire() as conn:
            return await conn.fetchrow(pg_sql, *params)

    async def fetchall(self, sql: str, params: tuple = ()) -> list[asyncpg.Record]:
        pg_sql = _translate_sql(sql)
        async with self._pool.acquire() as conn:
            return await conn.fetch(pg_sql, *params)

    async def fetchval(self, sql: str, params: tuple = ()) -> Any:
        pg_sql = _translate_sql(sql)
        async with self._pool.acquire() as conn:
            return await conn.fetchval(pg_sql, *params)

    async def health_check(self) -> dict:
        try:
            row = await self.fetchrow("SELECT COUNT(*) AS cnt FROM conversations")
            conv_count = row["cnt"] if row else 0

            row = await self.fetchrow("SELECT COUNT(*) AS cnt FROM memory")
            fact_count = row["cnt"] if row else 0

            size = await self.fetchval("SELECT pg_database_size(current_database()) AS size")
            db_size = size if size else 0

            return {
                "status": "healthy",
                "type": "postgresql",
                "conversations": conv_count,
                "facts": fact_count,
                "size_bytes": db_size,
            }
        except Exception as e:
            return {"status": "unhealthy", "error": str(e), "type": "postgresql"}

    async def close(self) -> None:
        if self._pool:
            await self._pool.close()
            self._pool = None
            self._initialized = False
            logger.info("PostgreSQL pool closed")

    async def _run_migrations(self) -> None:
        migrations_dir = Path(__file__).parent.parent / "migrations"
        migration_file = migrations_dir / "001_initial_pg.sql"
        if not migration_file.exists():
            logger.warning(f"Initial migration not found: {migration_file}")
            return

        row = await self.fetchrow("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_name = 'conversations'
            ) AS exists
        """)
        if row and row["exists"]:
            logger.debug("PostgreSQL schema is up to date")
            return

        sql = migration_file.read_text(encoding="utf-8")
        async with self._pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(sql)
        logger.info("PostgreSQL initial schema applied successfully")


db_manager = DatabaseManager()
