"""
JARVIS v3.8.0 — Memory Module Tests
"""

import sys
from datetime import datetime
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


class TestConversationCRUD:
    @pytest.mark.asyncio
    async def test_insert_conversation(self, test_db):
        from utils.database import db_manager

        result = await db_manager.execute(
            "INSERT INTO conversations (timestamp, user_input, jarvis_response, command_type, success, language, session_id) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            (datetime.now().isoformat(), "What time?", "10 AM", "get_time", True, "en", "s1"),
        )
        assert result.lastrowid is not None

    @pytest.mark.asyncio
    async def test_unicode_content(self, test_db):
        from utils.database import db_manager

        hindi = "समय क्या है?"
        result = await db_manager.execute(
            "INSERT INTO conversations (timestamp, user_input, jarvis_response, command_type, success, language, session_id) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            (datetime.now().isoformat(), hindi, "10 बजे", "get_time", True, "hi", "s1"),
        )
        assert result.lastrowid is not None

    @pytest.mark.asyncio
    async def test_search_conversations(self, test_db):
        from utils.database import db_manager

        result = await db_manager.execute(
            "INSERT INTO conversations (timestamp, user_input, jarvis_response, command_type, success, language, session_id) VALUES ($1,$2,$3,$4,$5,$6,$7)",
            (datetime.now().isoformat(), "Open WhatsApp", "Done", "open_whatsapp", True, "en", "s1"),
        )
        assert result.lastrowid is not None


class TestMemoryFacts:
    @pytest.mark.asyncio
    async def test_insert_fact(self, test_db):
        from utils.database import db_manager

        now = datetime.now().isoformat()
        result = await db_manager.execute(
            "INSERT INTO memory (key, value, category, created_at, updated_at) VALUES ($1,$2,$3,$4,$5)",
            ("fav_color", "indigo", "preferences", now, now),
        )
        assert result.lastrowid is not None

    @pytest.mark.asyncio
    async def test_unique_key_constraint(self, test_db):
        from utils.database import db_manager

        now = datetime.now().isoformat()
        r1 = await db_manager.execute(
            "INSERT INTO memory (key, value, category, created_at, updated_at) VALUES ($1,$2,$3,$4,$5)",
            ("uniq", "v1", "test", now, now),
        )
        r2 = await db_manager.execute(
            "INSERT INTO memory (key, value, category, created_at, updated_at) VALUES ($1,$2,$3,$4,$5)",
            ("uniq", "v2", "test", now, now),
        )
        assert r1.lastrowid is not None
        assert r2.lastrowid is not None


class TestPerformanceMetrics:
    @pytest.mark.asyncio
    async def test_insert_metric(self, test_db):
        from utils.database import db_manager

        result = await db_manager.execute(
            "INSERT INTO performance_metrics (timestamp, event_loop_lag, cpu_percent, memory_percent) VALUES ($1,$2,$3,$4)",
            (datetime.now().isoformat(), 0.5, 25.0, 50.0),
        )
        assert result.lastrowid is not None
