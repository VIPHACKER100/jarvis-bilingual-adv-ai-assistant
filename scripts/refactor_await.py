"""
DEPRECATED — DO NOT RUN on current codebase.

This script was a one-time migration tool for adding `await` to
`memory_manager.method()` calls during the v3.4.1 async migration.

The project is now fully async-first (since v3.4.1). All targeted files
already use await correctly. Running this script would introduce
double-await syntax errors wherever the negative lookbehind fails
(e.g., with multi-space whitespace or newlines between await and the call).

Kept for historical reference only.
"""

import sys

sys.exit(0)

# === Everything below is legacy and should NOT be run ===

import re
from pathlib import Path

files_to_update = [
    "backend/routers/sync.py",
    "backend/routers/memory.py",
    "backend/modules/system.py",
    "backend/modules/llm.py",
    "backend/modules/context.py",
    "backend/handlers/command_handler.py"
]

methods_to_await = [
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
    "get_node",
    "update_node",
    "list_nodes",
    "get_neural_context",
    "extract_and_save_facts",
]

for file_path in files_to_update:
    path = Path(file_path)
    if not path.exists():
        continue
    content = path.read_text(encoding="utf-8")
    
    # Simple regex to replace memory_manager.method( with await memory_manager.method(
    for method in methods_to_await:
        # Avoid double-await if we run it multiple times
        # Look for memory_manager.method( optionally with whitespace around dot
        pattern = rf"(?<!await\s)memory_manager\.{method}\("
        replacement = f"await memory_manager.{method}("
        content = re.sub(pattern, replacement, content)

    path.write_text(content, encoding="utf-8")
    print(f"Updated {file_path}")

print("All files updated with await for memory_manager.")
