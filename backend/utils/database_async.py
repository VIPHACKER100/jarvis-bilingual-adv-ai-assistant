"""
JARVIS v4.0 — Async PostgreSQL Database Manager
Drop-in replacement for the SQLite DatabaseManager using asyncpg.
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any, AsyncGenerator, Optional

import asyncpg
from utils.logger_structured import logger

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://jarvis:jarvis_dev_password@localhost:5432/jarvis"
)


def _parse_url(url: str) -> dict:
    """Parse a postgresql+asyncpg:// URL into connection kwargs."""
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


class AsyncDatabaseManager:
    """
    PostgreSQL connection pool manager with:
    - Async connection pooling (asyncpg)
    - Schema migration runner
    - Health check probe
    """

    def __init__(self, dsn: Optional[str] = None):
        self.dsn = dsn or DATABASE_URL
        self._pool: Optional[asyncpg.Pool] = None
        self._initialized = False

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
    async def connection(self) -> AsyncGenerator[asyncpg.Connection, None]:
        if not self._initialized or self._pool is None:
            await self.initialize()

        async with self._pool.acquire() as conn:
            yield conn

    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[asyncpg.Connection, None]:
        if not self._initialized or self._pool is None:
            await self.initialize()

        async with self._pool.acquire() as conn:
            async with conn.transaction():
                yield conn

    async def execute(self, sql: str, *args: Any) -> str:
        async with self.connection() as conn:
            return await conn.execute(sql, *args)

    async def fetchrow(self, sql: str, *args: Any) -> Optional[asyncpg.Record]:
        async with self.connection() as conn:
            return await conn.fetchrow(sql, *args)

    async def fetch(self, sql: str, *args: Any) -> list[asyncpg.Record]:
        async with self.connection() as conn:
            return await conn.fetch(sql, *args)

    async def fetchval(self, sql: str, *args: Any) -> Any:
        async with self.connection() as conn:
            return await conn.fetchval(sql, *args)

    async def health_check(self) -> dict:
        try:
            row = await self.fetchrow("SELECT COUNT(*) AS cnt FROM conversations")
            conv_count = row["cnt"] if row else 0

            row = await self.fetchrow("SELECT COUNT(*) AS cnt FROM memory")
            fact_count = row["cnt"] if row else 0

            size = await self.fetchrow("""
                SELECT pg_database_size(current_database()) AS size
            """)
            db_size = size["size"] if size else 0

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

        # Check if conversations table exists
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
        async with self.transaction() as conn:
            await conn.execute(sql)
        logger.info("PostgreSQL initial schema applied successfully")


db_async = AsyncDatabaseManager()
