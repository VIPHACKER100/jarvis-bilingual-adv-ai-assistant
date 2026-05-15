"""
JARVIS v3.8.0 — Memory Module Tests
"""
import sys
from pathlib import Path
from datetime import datetime
import pytest
import aiosqlite

sys.path.insert(0, str(Path(__file__).parent.parent))


class TestConversationCRUD:
    @pytest.mark.asyncio
    async def test_insert_conversation(self, test_db):
        await test_db.execute(
            "INSERT INTO conversations (timestamp, user_input, jarvis_response, command_type, success, language, session_id) VALUES (?,?,?,?,?,?,?)",
            (datetime.now().isoformat(), "What time?", "10 AM", "get_time", True, "en", "s1"))
        await test_db.commit()
        cursor = await test_db.execute("SELECT COUNT(*) FROM conversations")
        assert (await cursor.fetchone())[0] == 1

    @pytest.mark.asyncio
    async def test_unicode_content(self, test_db):
        hindi = "समय क्या है?"
        await test_db.execute(
            "INSERT INTO conversations (timestamp, user_input, jarvis_response, command_type, success, language, session_id) VALUES (?,?,?,?,?,?,?)",
            (datetime.now().isoformat(), hindi, "10 बजे", "get_time", True, "hi", "s1"))
        await test_db.commit()
        cursor = await test_db.execute("SELECT user_input FROM conversations WHERE language='hi'")
        assert (await cursor.fetchone())[0] == hindi

    @pytest.mark.asyncio
    async def test_search_conversations(self, test_db):
        await test_db.execute(
            "INSERT INTO conversations (timestamp, user_input, jarvis_response, command_type, success, language, session_id) VALUES (?,?,?,?,?,?,?)",
            (datetime.now().isoformat(), "Open WhatsApp", "Done", "open_whatsapp", True, "en", "s1"))
        await test_db.commit()
        cursor = await test_db.execute("SELECT * FROM conversations WHERE user_input LIKE '%WhatsApp%'")
        assert len(await cursor.fetchall()) >= 1


class TestMemoryFacts:
    @pytest.mark.asyncio
    async def test_insert_fact(self, test_db):
        now = datetime.now().isoformat()
        await test_db.execute(
            "INSERT INTO memory (key, value, category, created_at, updated_at) VALUES (?,?,?,?,?)",
            ("fav_color", "indigo", "preferences", now, now))
        await test_db.commit()
        cursor = await test_db.execute("SELECT value FROM memory WHERE key='fav_color'")
        assert (await cursor.fetchone())[0] == "indigo"

    @pytest.mark.asyncio
    async def test_unique_key_constraint(self, test_db):
        now = datetime.now().isoformat()
        await test_db.execute(
            "INSERT INTO memory (key, value, category, created_at, updated_at) VALUES (?,?,?,?,?)",
            ("uniq", "v1", "test", now, now))
        await test_db.commit()
        with pytest.raises(aiosqlite.IntegrityError):
            await test_db.execute(
                "INSERT INTO memory (key, value, category, created_at, updated_at) VALUES (?,?,?,?,?)",
                ("uniq", "v2", "test", now, now))


class TestPerformanceMetrics:
    @pytest.mark.asyncio
    async def test_insert_metric(self, test_db):
        await test_db.execute(
            "INSERT INTO performance_metrics (timestamp, event_loop_lag, cpu_percent, memory_percent) VALUES (?,?,?,?)",
            (datetime.now().isoformat(), 0.5, 25.0, 50.0))
        await test_db.commit()
        cursor = await test_db.execute("SELECT COUNT(*) FROM performance_metrics")
        assert (await cursor.fetchone())[0] == 1
