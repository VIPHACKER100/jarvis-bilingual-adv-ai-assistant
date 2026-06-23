"""
DEPRECATED — DO NOT RUN on current codebase.

This script was a one-time migration tool for converting MemoryManager from
synchronous sqlite3 to async aiosqlite during the v3.4.1 async migration.

The project has since migrated to PostgreSQL via asyncpg (Phase 1, 2026-06-22):
- aiosqlite was removed from requirements
- SQLite migration files were deleted
- All database access now uses db_manager from utils.database
- backend/modules/memory.py is fully async with no sqlite3 or aiosqlite imports

Running this script on the current codebase will corrupt memory.py by:
- Double-prefixing already-async methods with "async async" (syntax error)
- Reintroducing SQLite patterns into a PostgreSQL codebase
- Mangling source code via naive string replacements inside comments/strings

Kept for historical reference only.
"""

import sys

sys.exit(0)

# === Everything below is legacy and should NOT be run ===

import re
from pathlib import Path

memory_path = Path("backend/modules/memory.py")
content = memory_path.read_text(encoding="utf-8")

if "import aiosqlite" not in content:
    content = content.replace("import sqlite3", "import sqlite3\nimport aiosqlite")

methods_to_async = [
    "save_conversation",
    "get_recent_conversations",
    "search_conversations",
    "get_conversation_stats",
    "save_memory",
    "get_memory",
    "get_memories_by_category",
    "search_memory",
    "delete_memory",
    "start_session",
    "end_session",
    "cleanup_old_data",
    "delete_all_conversations",
    "prune_conversations",
    "delete_memory_by_id",
    "save_setting",
    "get_setting",
    "update_memory_by_id",
]

for method in methods_to_async:
    content = re.sub(rf"def {method}\(", f"async def {method}(", content)

content = content.replace("conn = sqlite3.connect(str(self.db_path))", "db = await aiosqlite.connect(str(self.db_path))")
content = content.replace("cursor = conn.cursor()", "cursor = await db.cursor()")
content = content.replace("cursor.execute(", "await cursor.execute(")
content = content.replace("conn.commit()", "await db.commit()")
content = content.replace("conn.close()", "await db.close()")
content = content.replace("cursor.fetchone()", "await cursor.fetchone()")
content = content.replace("cursor.fetchall()", "await cursor.fetchall()")

init_db_start = content.find("def _init_database(self):")
init_db_end = content.find("def save_conversation(self, entry:", init_db_start)
if init_db_start != -1 and init_db_end != -1:
    init_db_block = content[init_db_start:init_db_end]
    init_db_block = init_db_block.replace("db = await aiosqlite.connect(str(self.db_path))", "conn = sqlite3.connect(str(self.db_path))")
    init_db_block = init_db_block.replace("cursor = await db.cursor()", "cursor = conn.cursor()")
    init_db_block = init_db_block.replace("await cursor.execute(", "cursor.execute(")
    init_db_block = init_db_block.replace("await db.commit()", "conn.commit()")
    init_db_block = init_db_block.replace("await db.close()", "conn.close()")
    content = content[:init_db_start] + init_db_block + content[init_db_end:]

memory_path.write_text(content, encoding="utf-8")
print("Refactored memory.py to async")
