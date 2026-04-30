import sqlite3
import aiosqlite
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

from config import DATA_DIR, PROJECT_ROOT
from utils.logger import logger


@dataclass
class ConversationEntry:
    """Single conversation entry"""
    id: Optional[int] = None
    timestamp: str = ""
    user_input: str = ""
    jarvis_response: str = ""
    command_type: str = ""
    success: bool = True
    context: str = ""  # JSON string of context data
    language: str = "en"
    session_id: str = ""


@dataclass
class MemoryEntry:
    """User memory/fact storage"""
    id: Optional[int] = None
    key: str = ""  # e.g., "favorite_color", "boss_name"
    value: str = ""
    category: str = "general"  # e.g., "preferences", "contacts", "facts"
    created_at: str = ""
    updated_at: str = ""
    confidence: float = 1.0  # 0.0 to 1.0
    source: str = ""  # How this was learned


class NeuralMemoryManager:
    """Manage file-based Markdown memory nodes"""

    def __init__(self):
        self.memory_dir = PROJECT_ROOT / "memory"
        self.memory_dir.mkdir(exist_ok=True)
        self.core_nodes = ["user.md", "personality.md", "preferences.md", "decisions.md", "people.md"]

    def get_node(self, name: str) -> Optional[str]:
        """Read content of a specific memory node"""
        if not name.endswith(".md"):
            name += ".md"
        
        file_path = self.memory_dir / name
        if not file_path.exists():
            return None
        
        try:
            return file_path.read_text(encoding="utf-8")
        except Exception as e:
            logger.error(f"Error reading memory node {name}: {e}")
            return None

    def update_node(self, name: str, content: str) -> bool:
        """Update content of a specific memory node"""
        if not name.endswith(".md"):
            name += ".md"
        
        file_path = self.memory_dir / name
        try:
            file_path.write_text(content, encoding="utf-8")
            logger.info(f"Updated memory node: {name}")
            return True
        except Exception as e:
            logger.error(f"Error updating memory node {name}: {e}")
            return False

    def list_nodes(self) -> List[Dict[str, Any]]:
        """List all available memory nodes with metadata"""
        nodes = []
        for file_path in self.memory_dir.glob("*.md"):
            try:
                stats = file_path.stat()
                nodes.append({
                    "name": file_path.name,
                    "path": str(file_path),
                    "size": stats.st_size,
                    "updated_at": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                    "is_core": file_path.name in self.core_nodes
                })
            except Exception as e:
                logger.error(f"Error listing node {file_path.name}: {e}")
        return nodes

    def get_neural_context(self) -> str:
        """Collect core memory nodes for LLM context injection"""
        context_parts = []
        # Prioritize personality and user info
        for node_name in ["personality.md", "user.md", "preferences.md"]:
            content = self.get_node(node_name)
            if content:
                context_parts.append(f"### NODE: {node_name.upper()}\n{content}")
        
        return "\n\n".join(context_parts)


class MemoryManager:
    """Manage conversation history and user memory"""

    def __init__(self):
        self.db_path = DATA_DIR / "memory.db"
        self._init_database()
        self.neural = NeuralMemoryManager()

    def _init_database(self):
        """Initialize SQLite database with tables"""
        try:
            conn = sqlite3.connect(str(self.db_path))
            cursor = conn.cursor()

            # Conversations table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS conversations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    user_input TEXT NOT NULL,
                    jarvis_response TEXT NOT NULL,
                    command_type TEXT,
                    success BOOLEAN DEFAULT 1,
                    context TEXT,
                    language TEXT DEFAULT 'en',
                    session_id TEXT
                )
            ''')

            # Memory/facts table
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS memory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    key TEXT UNIQUE NOT NULL,
                    value TEXT NOT NULL,
                    category TEXT DEFAULT 'general',
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    confidence REAL DEFAULT 1.0,
                    source TEXT
                )
            ''')

            # Sessions table for tracking conversation sessions
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT UNIQUE NOT NULL,
                    started_at TEXT NOT NULL,
                    ended_at TEXT,
                    command_count INTEGER DEFAULT 0,
                    metadata TEXT
                )
            ''')

            # Create indexes for faster queries
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_conversations_timestamp
                ON conversations(timestamp)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_conversations_session
                ON conversations(session_id)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_memory_category
                ON memory(category)
            ''')
            cursor.execute('''
                CREATE INDEX IF NOT EXISTS idx_memory_key
                ON memory(key)
            ''')

            conn.commit()
            conn.close()
            logger.info("Memory database initialized successfully")

        except Exception as e:
            logger.error(f"Error initializing memory database: {e}")

    async def save_conversation(self, entry: ConversationEntry) -> bool:
        """Save a conversation entry"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            if not entry.timestamp:
                entry.timestamp = datetime.now().isoformat()

            await cursor.execute('''
                INSERT INTO conversations
                (timestamp, user_input, jarvis_response, command_type, success, context, language, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                entry.timestamp,
                entry.user_input,
                entry.jarvis_response,
                entry.command_type,
                entry.success,
                entry.context,
                entry.language,
                entry.session_id
            ))

            await db.commit()
            entry.id = cursor.lastrowid
            await db.close()

            logger.info(f"Saved conversation entry: {entry.id}")
            return True

        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
            return False

    async def get_recent_conversations(
            self,
            limit: int = 10,
            session_id: Optional[str] = None) -> List[ConversationEntry]:
        """Get recent conversation history"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            if session_id:
                await cursor.execute('''
                    SELECT * FROM conversations
                    WHERE session_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (session_id, limit))
            else:
                await cursor.execute('''
                    SELECT * FROM conversations
                    ORDER BY timestamp DESC
                    LIMIT ?
                ''', (limit,))

            rows = await cursor.fetchall()
            await db.close()

            entries = []
            for row in rows:
                entry = ConversationEntry(
                    id=row[0],
                    timestamp=row[1],
                    user_input=row[2],
                    jarvis_response=row[3],
                    command_type=row[4],
                    success=bool(row[5]),
                    context=row[6],
                    language=row[7],
                    session_id=row[8]
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            return []

    async def search_conversations(
            self,
            query: str,
            limit: int = 10) -> List[ConversationEntry]:
        """Search conversation history"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            search_term = f"%{query}%"
            await cursor.execute('''
                SELECT * FROM conversations
                WHERE user_input LIKE ? OR jarvis_response LIKE ?
                ORDER BY timestamp DESC
                LIMIT ?
            ''', (search_term, search_term, limit))

            rows = await cursor.fetchall()
            await db.close()

            entries = []
            for row in rows:
                entry = ConversationEntry(
                    id=row[0],
                    timestamp=row[1],
                    user_input=row[2],
                    jarvis_response=row[3],
                    command_type=row[4],
                    success=bool(row[5]),
                    context=row[6],
                    language=row[7],
                    session_id=row[8]
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error searching conversations: {e}")
            return []

    async def get_conversation_stats(self, days: int = 7) -> Dict:
        """Get conversation statistics"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            since = (datetime.now() - timedelta(days=days)).isoformat()

            # Total conversations
            await cursor.execute('''
                SELECT COUNT(*) FROM conversations
                WHERE timestamp > ?
            ''', (since,))
            total = await cursor.fetchone()[0]

            # Successful commands
            await cursor.execute('''
                SELECT COUNT(*) FROM conversations
                WHERE timestamp > ? AND success = 1
            ''', (since,))
            successful = await cursor.fetchone()[0]

            # Command types breakdown
            await cursor.execute('''
                SELECT command_type, COUNT(*) as count
                FROM conversations
                WHERE timestamp > ?
                GROUP BY command_type
                ORDER BY count DESC
            ''', (since,))
            command_types = {row[0]: row[1] for row in await cursor.fetchall()}

            # Language distribution
            await cursor.execute('''
                SELECT language, COUNT(*) as count
                FROM conversations
                WHERE timestamp > ?
                GROUP BY language
            ''', (since,))
            languages = {row[0]: row[1] for row in await cursor.fetchall()}
            
            # Map 'hi-EN' or 'hinglish' to a consistent key if needed
            # In our case, the frontend uses 'hi-EN' and backend might see 'hinglish'
            
            await db.close()

            return {
                "total_conversations": total,
                "successful_commands": successful,
                "success_rate": (successful / total * 100) if total > 0 else 0,
                "command_types": command_types,
                "languages": languages,
                "period_days": days
            }

        except Exception as e:
            logger.error(f"Error getting conversation stats: {e}")
            return {}

    async def save_memory(self, entry: MemoryEntry) -> bool:
        """Save a memory/fact about the user"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            now = datetime.now().isoformat()

            # Check if key already exists
            await cursor.execute('SELECT id FROM memory WHERE key = ?', (entry.key,))
            existing = await cursor.fetchone()

            if existing:
                # Update existing
                await cursor.execute('''
                    UPDATE memory
                    SET value = ?, updated_at = ?, confidence = ?, source = ?
                    WHERE key = ?
                ''', (entry.value, now, entry.confidence, entry.source, entry.key))
            else:
                # Insert new
                if not entry.created_at:
                    entry.created_at = now
                if not entry.updated_at:
                    entry.updated_at = now

                await cursor.execute('''
                    INSERT INTO memory
                    (key, value, category, created_at, updated_at, confidence, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    entry.key,
                    entry.value,
                    entry.category,
                    entry.created_at,
                    entry.updated_at,
                    entry.confidence,
                    entry.source
                ))

            await db.commit()
            await db.close()

            logger.info(f"Saved memory: {entry.key} = {entry.value}")
            return True

        except Exception as e:
            logger.error(f"Error saving memory: {e}")
            return False

    async def get_memory(self, key: str) -> Optional[MemoryEntry]:
        """Get a specific memory entry"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            await cursor.execute('SELECT * FROM memory WHERE key = ?', (key,))
            row = await cursor.fetchone()
            await db.close()

            if row:
                return MemoryEntry(
                    id=row[0],
                    key=row[1],
                    value=row[2],
                    category=row[3],
                    created_at=row[4],
                    updated_at=row[5],
                    confidence=row[6],
                    source=row[7]
                )
            return None

        except Exception as e:
            logger.error(f"Error getting memory: {e}")
            return None

    async def get_memories_by_category(self, category: str) -> List[MemoryEntry]:
        """Get all memories in a category"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            await cursor.execute('''
                SELECT * FROM memory
                WHERE category = ?
                ORDER BY updated_at DESC
            ''', (category,))

            rows = await cursor.fetchall()
            await db.close()

            entries = []
            for row in rows:
                entry = MemoryEntry(
                    id=row[0],
                    key=row[1],
                    value=row[2],
                    category=row[3],
                    created_at=row[4],
                    updated_at=row[5],
                    confidence=row[6],
                    source=row[7]
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error getting memories by category: {e}")
            return []

    async def search_memory(self, query: str) -> List[MemoryEntry]:
        """Search memory entries"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            search_term = f"%{query}%"
            await cursor.execute('''
                SELECT * FROM memory
                WHERE key LIKE ? OR value LIKE ?
                ORDER BY confidence DESC, updated_at DESC
            ''', (search_term, search_term))

            rows = await cursor.fetchall()
            await db.close()

            entries = []
            for row in rows:
                entry = MemoryEntry(
                    id=row[0],
                    key=row[1],
                    value=row[2],
                    category=row[3],
                    created_at=row[4],
                    updated_at=row[5],
                    confidence=row[6],
                    source=row[7]
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error searching memory: {e}")
            return []

    async def delete_memory(self, key: str) -> bool:
        """Delete a memory entry"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            await cursor.execute('DELETE FROM memory WHERE key = ?', (key,))
            await db.commit()
            await db.close()

            logger.info(f"Deleted memory: {key}")
            return True

        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False

    async def start_session(self, session_id: str) -> bool:
        """Start a new conversation session"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            await cursor.execute('''
                INSERT INTO sessions (session_id, started_at, command_count)
                VALUES (?, ?, 0)
            ''', (session_id, datetime.now().isoformat()))

            await db.commit()
            await db.close()

            logger.info(f"Started session: {session_id}")
            return True

        except Exception as e:
            logger.error(f"Error starting session: {e}")
            return False

    async def end_session(self, session_id: str) -> bool:
        """End a conversation session"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            # Count commands in session
            await cursor.execute('''
                SELECT COUNT(*) FROM conversations WHERE session_id = ?
            ''', (session_id,))
            count = await cursor.fetchone()[0]

            await cursor.execute('''
                UPDATE sessions
                SET ended_at = ?, command_count = ?
                WHERE session_id = ?
            ''', (datetime.now().isoformat(), count, session_id))

            await db.commit()
            await db.close()

            logger.info(f"Ended session: {session_id} with {count} commands")
            return True

        except Exception as e:
            logger.error(f"Error ending session: {e}")
            return False

    async def cleanup_old_data(self, days: int = 30) -> int:
        """Remove old conversation data"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()

            cutoff = (datetime.now() - timedelta(days=days)).isoformat()

            await cursor.execute('''
                DELETE FROM conversations WHERE timestamp < ?
            ''', (cutoff,))

            deleted = cursor.rowcount
            await db.commit()
            await db.close()

            logger.info(f"Cleaned up {deleted} old conversation entries")
            return deleted

        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            return 0

    async def delete_all_conversations(self) -> bool:
        """Wipe all conversion history"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()
            await cursor.execute('DELETE FROM conversations')
            await db.commit()
            await db.close()
            logger.info("All conversation history deleted")
            return True
        except Exception as e:
            logger.error(f"Error deleting all conversations: {e}")
            return False

    async def prune_conversations(self, limit: int = 20, session_id: Optional[str] = None) -> int:
        """
        Prune conversation history to a specific limit to optimize LLM context.
        Returns the number of entries deleted.
        """
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()
            
            # Identify entries to keep
            if session_id:
                await cursor.execute('''
                    SELECT id FROM conversations 
                    WHERE session_id = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                ''', (session_id, limit))
            else:
                await cursor.execute('''
                    SELECT id FROM conversations 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                ''', (limit,))
                
            keep_ids = [row[0] for row in await cursor.fetchall()]
            
            if not keep_ids:
                return 0
                
            # Delete everything else
            placeholders = ','.join(['?'] * len(keep_ids))
            if session_id:
                await cursor.execute(f'''
                    DELETE FROM conversations 
                    WHERE session_id = ? AND id NOT IN ({placeholders})
                ''', [session_id] + keep_ids)
            else:
                await cursor.execute(f'''
                    DELETE FROM conversations 
                    WHERE id NOT IN ({placeholders})
                ''', keep_ids)
                
            deleted = cursor.rowcount
            await db.commit()
            await db.close()
            
            if deleted > 0:
                logger.info(f"Pruned {deleted} conversation entries to maintain performance.")
            return deleted
            
        except Exception as e:
            logger.error(f"Error pruning conversations: {e}")
            return 0

    async def delete_memory_by_id(self, memory_id: int) -> bool:
        """Delete specific memory fact by ID"""
        try:
            db = await aiosqlite.connect(str(self.db_path))
            cursor = await db.cursor()
            await cursor.execute('DELETE FROM memory WHERE id = ?', (memory_id,))
            await db.commit()
            await db.close()
            logger.info(f"Deleted memory fact ID: {memory_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting memory fact {memory_id}: {e}")
            return False

    async def save_setting(self, key: str, value: Any) -> bool:
        """Save a system setting to memory"""
        return self.save_memory(MemoryEntry(
            key=f"setting_{key}",
            value=json.dumps(value) if not isinstance(value, str) else value,
            category="settings",
            source="system"
        ))

    async def get_setting(self, key: str, default: Any = None) -> Any:
        """Get a system setting from memory"""
        entry = self.get_memory(f"setting_{key}")
        if not entry:
            return default
        
        try:
            return json.loads(entry.value)
        except:
            return entry.value


# Singleton instance
memory_manager = MemoryManager()
