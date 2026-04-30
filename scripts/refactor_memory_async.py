import re
from pathlib import Path

memory_path = Path("backend/modules/memory.py")
content = memory_path.read_text(encoding="utf-8")

# Replace sqlite3 import with aiosqlite (or just add it)
if "import aiosqlite" not in content:
    content = content.replace("import sqlite3", "import sqlite3\nimport aiosqlite")

# We want to change the methods inside MemoryManager to be async
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
    # Change def to async def
    content = re.sub(rf"def {method}\(", f"async def {method}(", content)

# Replace sqlite3.connect with aiosqlite.connect
# Old: conn = sqlite3.connect(str(self.db_path))
#      cursor = conn.cursor()
# New: async with aiosqlite.connect(str(self.db_path)) as db:
#          cursor = await db.cursor()

# Pattern for sqlite3 connection block
# Replace simple cursor.execute
content = content.replace("conn = sqlite3.connect(str(self.db_path))", "db = await aiosqlite.connect(str(self.db_path))")
content = content.replace("cursor = conn.cursor()", "cursor = await db.cursor()")
content = content.replace("cursor.execute(", "await cursor.execute(")
content = content.replace("conn.commit()", "await db.commit()")
content = content.replace("conn.close()", "await db.close()")
content = content.replace("cursor.fetchone()", "await cursor.fetchone()")
content = content.replace("cursor.fetchall()", "await cursor.fetchall()")

# Note: _init_database should remain synchronous or be initialized elsewhere
# Wait, if we use await aiosqlite, _init_database has to be async or kept as sqlite3
# Let's revert _init_database back to standard sqlite3 since it's just setup
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

# Now save
memory_path.write_text(content, encoding="utf-8")
print("Refactored memory.py to async")
