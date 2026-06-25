import asyncio
import hashlib
import json
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from rapidfuzz import fuzz

import aiofiles
from config import PROJECT_ROOT
from utils.database import db_manager
from utils.logger_structured import logger


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

    async def get_node(self, name: str) -> Optional[str]:
        """Read content of a specific memory node"""
        if not name.endswith(".md"):
            name += ".md"

        file_path = self.memory_dir / name
        if not file_path.exists():
            return None

        try:
            async with aiofiles.open(file_path, mode="r", encoding="utf-8") as f:
                return await f.read()
        except Exception as e:
            logger.error(f"Error reading memory node {name}: {e}")
            return None

    async def update_node(self, name: str, content: str) -> bool:
        """Update content of a specific memory node"""
        if not name.endswith(".md"):
            name += ".md"

        file_path = self.memory_dir / name
        try:
            async with aiofiles.open(file_path, mode="w", encoding="utf-8") as f:
                await f.write(content)
            logger.info(f"Updated memory node: {name}")
            return True
        except Exception as e:
            logger.error(f"Error updating memory node {name}: {e}")
            return False

    async def list_nodes(self) -> List[Dict[str, Any]]:
        """List all available memory nodes with metadata"""

        def _list_task():
            nodes = []
            for file_path in self.memory_dir.glob("*.md"):
                try:
                    stats = file_path.stat()
                    nodes.append(
                        {
                            "name": file_path.name,
                            "path": str(file_path),
                            "size": stats.st_size,
                            "updated_at": datetime.fromtimestamp(stats.st_mtime).isoformat(),
                            "is_core": file_path.name in self.core_nodes,
                        }
                    )
                except Exception as e:
                    logger.error(f"Error listing node {file_path.name}: {e}")
            return nodes

        return await asyncio.to_thread(_list_task)

    async def log_decision(self, command: str, action: str, result: str, reason: str = ""):
        """Log a user decision (Approval/Rejection) to decisions.md"""
        node_name = "decisions.md"
        content = (
            await self.get_node(node_name)
            or "# Decision Log\n\nTracked approvals and rejections of dangerous commands.\n\n"
        )

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        entry = f"### [{timestamp}] {command}\n"
        entry += f"- **Action**: {action}\n"
        entry += f"- **Result**: {result}\n"
        if reason:
            entry += f"- **Reason**: {reason}\n"
        entry += "\n"

        # Append to the end
        new_content = content + entry
        await self.update_node(node_name, new_content)

        # Also sync vectors so the agent 'learns' immediately
        asyncio.create_task(self.sync_vectors())

    async def get_node_with_metadata(self, name: str) -> Dict[str, Any]:
        """Read content and parse metadata of a memory node"""
        content = await self.get_node(name)
        if not content:
            return {"content": "", "metadata": {}}

        metadata = {}
        if content.startswith("---"):
            try:
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    import yaml

                    metadata = yaml.safe_load(parts[1]) or {}
                    content = parts[2].strip()
            except Exception as e:
                logger.error(f"Error parsing metadata for {name}: {e}")

        return {"content": content, "metadata": metadata}

    async def get_neural_context(self, query: Optional[str] = None) -> str:
        """
        Dynamically collect relevant memory nodes for LLM context.
        Uses hybrid search (fuzzy + semantic) if a query is provided.
        """
        nodes = await self.list_nodes()
        if not nodes:
            return ""

        # Always include core nodes
        core_node_names = ["personality.md", "user.md", "preferences.md"]
        selected_nodes_with_scores = []
        for n in nodes:
            if n["name"] in core_node_names:
                selected_nodes_with_scores.append((n, 200))  # Core nodes get max priority

        # If we have a query, find additional relevant nodes
        if query:
            query_lower = query.lower()

            # 1. Semantic Search (Vector)
            semantic_scores = await self._get_semantic_scores(query)

            # 2. Fuzzy/Keyword Search
            other_nodes = [n for n in nodes if n["name"] not in core_node_names]

            for node in other_nodes:
                name_clean = node["name"].replace(".md", "").lower()
                fuzzy_score = fuzz.partial_ratio(query_lower, name_clean)

                # Bonus for exact keyword matches
                if any(word in query_lower for word in name_clean.split("_")):
                    fuzzy_score += 20

                # Combine with semantic score (if available)
                semantic_score = semantic_scores.get(node["name"], 0) * 100

                # Hybrid score: 40% Fuzzy, 60% Semantic
                total_score = (fuzzy_score * 0.4) + (semantic_score * 0.6)

                if total_score >= 50:
                    selected_nodes_with_scores.append((node, total_score))

            # Sort by score and take top 5
            selected_nodes_with_scores.sort(key=lambda x: x[1], reverse=True)
            top_nodes = []
            seen = set()
            for node, score in selected_nodes_with_scores:
                if node["name"] not in seen:
                    top_nodes.append(node)
                    seen.add(node["name"])
                if len(top_nodes) >= 6:  # Total limit
                    break
            selected_nodes = top_nodes
        else:
            selected_nodes = [n for n, s in selected_nodes_with_scores]

        context_parts = []
        seen_names = set()
        for node in selected_nodes:
            if node["name"] in seen_names:
                continue
            seen_names.add(node["name"])

            content = await self.get_node(node["name"])
            if content:
                if content.startswith("---"):
                    parts = content.split("---", 2)
                    if len(parts) >= 3:
                        content = parts[2].strip()

                context_parts.append(f"### {node['name'].replace('.md', '').upper()} ###\n{content}")

        return "\n\n".join(context_parts)

    async def _get_semantic_scores(self, query: str) -> Dict[str, float]:
        """Calculate semantic similarity scores via pgvector cosine distance"""
        from modules.llm_wrapper import llm_client

        query_vector = await llm_client.get_embedding(query)
        if not query_vector:
            return {}

        rows = await db_manager.fetchall(
            "SELECT filename, 1 - (embedding <=> ?::vector) AS similarity FROM neural_vectors WHERE embedding IS NOT NULL ORDER BY embedding <=> ?::vector LIMIT 20",
            (query_vector, query_vector),
        )
        return {row["filename"]: row["similarity"] for row in rows}

    async def sync_vectors(self):
        """Synchronize Markdown nodes with vector embeddings in the database"""
        from utils.database import db_manager
        if db_manager._degraded:
            logger.info("Semantic memory sync skipped (Database unavailable).")
            return

        logger.info("Synchronizing semantic memory vectors...")
        from modules.llm_wrapper import llm_client

        nodes = await self.list_nodes()
        synced_count = 0

        for node in nodes:
            try:
                content = await self.get_node(node["name"])
                if not content:
                    continue

                # Calculate hash to see if it changed
                content_hash = hashlib.md5(content.encode("utf-8")).hexdigest()

                # Check DB for existing hash
                row = await db_manager.fetchone(
                    "SELECT content_hash FROM neural_vectors WHERE filename = ?", (node["name"],)
                )

                if row and row[0] == content_hash:
                    continue  # Already up to date

                # Generate new embedding
                embedding = await llm_client.get_embedding(content)
                if not embedding:
                    logger.warning(f"Could not generate embedding for {node['name']}")
                    continue

                if row:
                    await db_manager.execute(
                        "UPDATE neural_vectors SET content_hash = ?, embedding = ?::vector, updated_at = ? WHERE filename = ?",
                        (content_hash, embedding, datetime.now().isoformat(), node["name"]),
                    )
                else:
                    await db_manager.execute(
                        "INSERT INTO neural_vectors (filename, content_hash, embedding) VALUES (?, ?, ?::vector)",
                        (node["name"], content_hash, embedding),
                    )

                synced_count += 1

            except Exception as e:
                logger.error(f"Error syncing vector for {node['name']}: {e}")

        if synced_count > 0:
            logger.info(f"Semantic memory sync complete. Updated {synced_count} vectors.")
        else:
            logger.info("Semantic memory already synchronized.")


class MemoryManager:
    """Manage conversation history and user memory"""

    def __init__(self):
        self.neural = NeuralMemoryManager()

    async def initialize(self):
        """Initialize memory system asynchronously"""
        await db_manager.initialize()
        logger.info("Memory system initialized via DatabaseManager")

    async def save_conversation(self, entry: ConversationEntry) -> bool:
        """Save a conversation entry"""
        try:
            if not entry.timestamp:
                entry.timestamp = datetime.now().isoformat()

            cursor = await db_manager.execute(
                """
                INSERT INTO conversations
                (timestamp, user_input, jarvis_response, command_type, success, context, language, session_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
                (
                    entry.timestamp,
                    entry.user_input,
                    entry.jarvis_response,
                    entry.command_type,
                    entry.success,
                    entry.context,
                    entry.language,
                    entry.session_id,
                ),
            )

            entry.id = cursor.lastrowid
            logger.info(f"Saved conversation entry: {entry.id}")
            return True

        except Exception as e:
            logger.error(f"Error saving conversation: {e}")
            return False

    async def get_recent_conversations(
        self, limit: int = 10, session_id: Optional[str] = None
    ) -> List[ConversationEntry]:
        """Get recent conversation history"""
        try:
            if session_id:
                rows = await db_manager.fetchall(
                    """
                    SELECT * FROM conversations
                    WHERE session_id = ?
                    ORDER BY timestamp DESC
                    LIMIT ?
                """,
                    (session_id, limit),
                )
            else:
                rows = await db_manager.fetchall(
                    """
                    SELECT * FROM conversations
                    ORDER BY timestamp DESC
                    LIMIT ?
                """,
                    (limit,),
                )

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
                    session_id=row[8],
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error getting conversations: {e}")
            return []

    async def search_conversations(self, query: str, limit: int = 10) -> List[ConversationEntry]:
        """Search conversation history"""
        try:
            search_term = f"%{query}%"
            rows = await db_manager.fetchall(
                """
                SELECT * FROM conversations
                WHERE user_input LIKE ? OR jarvis_response LIKE ?
                ORDER BY timestamp DESC
                LIMIT ?
            """,
                (search_term, search_term, limit),
            )

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
                    session_id=row[8],
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error searching conversations: {e}")
            return []

    async def get_conversation_stats(self, days: int = 7) -> Dict:
        """Get conversation statistics"""
        try:
            since = (datetime.now() - timedelta(days=days)).isoformat()

            # Total conversations
            row = await db_manager.fetchone(
                """
                SELECT COUNT(*) FROM conversations
                WHERE timestamp > ?
            """,
                (since,),
            )
            total = row[0] if row else 0

            # Successful commands
            row = await db_manager.fetchone(
                """
                SELECT COUNT(*) FROM conversations
                WHERE timestamp > ? AND success = 1
            """,
                (since,),
            )
            successful = row[0] if row else 0

            # Command types breakdown
            rows = await db_manager.fetchall(
                """
                SELECT command_type, COUNT(*) as count
                FROM conversations
                WHERE timestamp > ?
                GROUP BY command_type
                ORDER BY count DESC
            """,
                (since,),
            )
            command_types = {row[0]: row[1] for row in rows}

            # Language distribution
            rows = await db_manager.fetchall(
                """
                SELECT language, COUNT(*) as count
                FROM conversations
                WHERE timestamp > ?
                GROUP BY language
            """,
                (since,),
            )
            languages = {row[0]: row[1] for row in rows}

            return {
                "total_conversations": total,
                "successful_commands": successful,
                "success_rate": (successful / total * 100) if total > 0 else 0,
                "command_types": command_types,
                "languages": languages,
                "period_days": days,
            }

        except Exception as e:
            logger.error(f"Error getting conversation stats: {e}")
            return {}

    async def get_command_insights(self, days: int = 30) -> Dict:
        """Mines command history to produce behavioral usage insights.

        Uses PostgreSQL-native date functions:
          - DATE(timestamp)     → (timestamp AT TIME ZONE 'UTC')::date
          - STRFTIME('%H', ts)  → EXTRACT(HOUR FROM timestamp AT TIME ZONE 'UTC')::int
        """
        try:
            since = (datetime.now() - timedelta(days=days)).isoformat()

            # Top 5 most used command types
            top_commands_rows = await db_manager.fetchall(
                """
                SELECT command_type, COUNT(*) AS count
                FROM conversations
                WHERE timestamp > $1
                GROUP BY command_type
                ORDER BY count DESC
                LIMIT 5
                """,
                (since,),
            )
            top_commands = [dict(r) for r in top_commands_rows]

            # Commands per day (last 7 days)
            daily_rows = await db_manager.fetchall(
                """
                SELECT (timestamp AT TIME ZONE 'UTC')::date AS day,
                       COUNT(*) AS count
                FROM conversations
                WHERE timestamp > (NOW() AT TIME ZONE 'UTC' - INTERVAL '7 days')
                GROUP BY day
                ORDER BY day ASC
                """,
            )
            daily_activity = [{"day": str(r["day"]), "count": r["count"]} for r in daily_rows]

            # Peak usage hour (0-23)
            peak_row = await db_manager.fetchone(
                """
                SELECT EXTRACT(HOUR FROM timestamp AT TIME ZONE 'UTC')::int AS hour,
                       COUNT(*) AS count
                FROM conversations
                WHERE timestamp > $1
                GROUP BY hour
                ORDER BY count DESC
                LIMIT 1
                """,
                (since,),
            )
            peak_hour = dict(peak_row) if peak_row else {"hour": None, "count": 0}

            # Failure rate by command type
            failure_rows = await db_manager.fetchall(
                """
                SELECT command_type,
                       SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) AS failures,
                       COUNT(*) AS total
                FROM conversations
                WHERE timestamp > $1
                GROUP BY command_type
                HAVING SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) > 0
                ORDER BY failures DESC
                LIMIT 5
                """,
                (since,),
            )
            failure_patterns = [dict(r) for r in failure_rows]

            return {
                "top_commands": top_commands,
                "daily_activity": daily_activity,
                "peak_hour": peak_hour,
                "failure_patterns": failure_patterns,
                "period_days": days,
            }

        except Exception as e:
            logger.error(f"Error getting command insights: {e}")
            return {}

    async def save_performance_metric(self, lag: float, cpu: float, memory: float) -> bool:
        """Save system performance metrics to database"""
        try:
            await db_manager.execute(
                """
                INSERT INTO performance_metrics
                (timestamp, event_loop_lag, cpu_percent, memory_percent)
                VALUES (?, ?, ?, ?)
            """,
                (datetime.now().isoformat(), lag, cpu, memory),
            )
            return True
        except Exception as e:
            logger.error(f"Error saving performance metric: {e}")
            return False

    async def get_performance_history(self, limit: int = 60) -> List[Dict[str, Any]]:
        """Retrieve recent performance history"""
        try:
            rows = await db_manager.fetchall(
                """
                SELECT timestamp, event_loop_lag, cpu_percent, memory_percent
                FROM performance_metrics
                ORDER BY timestamp DESC
                LIMIT ?
            """,
                (limit,),
            )

            return [
                {"timestamp": row[0], "event_loop_lag": row[1], "cpu_percent": row[2], "memory_percent": row[3]}
                for row in rows
            ]
        except Exception as e:
            logger.error(f"Error getting performance history: {e}")
            return []

    async def save_memory(self, entry: MemoryEntry) -> bool:
        """Save a memory/fact about the user"""
        try:
            now = datetime.now().isoformat()

            # Check if key already exists
            row = await db_manager.fetchone("SELECT id FROM memory WHERE key = ?", (entry.key,))

            if row:
                # Update existing
                await db_manager.execute(
                    """
                    UPDATE memory
                    SET value = ?, updated_at = ?, confidence = ?, source = ?
                    WHERE key = ?
                """,
                    (entry.value, now, entry.confidence, entry.source, entry.key),
                )
            else:
                # Insert new
                if not entry.created_at:
                    entry.created_at = now
                if not entry.updated_at:
                    entry.updated_at = now

                await db_manager.execute(
                    """
                    INSERT INTO memory
                    (key, value, category, created_at, updated_at, confidence, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                    (
                        entry.key,
                        entry.value,
                        entry.category,
                        entry.created_at,
                        entry.updated_at,
                        entry.confidence,
                        entry.source,
                    ),
                )

            logger.info(f"Saved memory: {entry.key} = {entry.value}")
            return True

        except Exception as e:
            logger.error(f"Error saving memory: {e}")
            return False

    async def get_memory(self, key: str) -> Optional[MemoryEntry]:
        """Get a specific memory entry"""
        try:
            row = await db_manager.fetchone("SELECT * FROM memory WHERE key = ?", (key,))

            if row:
                return MemoryEntry(
                    id=row[0],
                    key=row[1],
                    value=row[2],
                    category=row[3],
                    created_at=row[4],
                    updated_at=row[5],
                    confidence=row[6],
                    source=row[7],
                )
            return None

        except Exception as e:
            logger.error(f"Error getting memory: {e}")
            return None

    async def get_memories_by_category(self, category: str) -> List[MemoryEntry]:
        """Get all memories in a category"""
        try:
            rows = await db_manager.fetchall(
                """
                SELECT * FROM memory
                WHERE category = ?
                ORDER BY updated_at DESC
            """,
                (category,),
            )

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
                    source=row[7],
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error getting memories by category: {e}")
            return []

    async def search_memory(self, query: str) -> List[MemoryEntry]:
        """Search memory entries"""
        try:
            search_term = f"%{query}%"
            rows = await db_manager.fetchall(
                """
                SELECT * FROM memory
                WHERE key LIKE ? OR value LIKE ?
                ORDER BY confidence DESC, updated_at DESC
            """,
                (search_term, search_term),
            )

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
                    source=row[7],
                )
                entries.append(entry)

            return entries

        except Exception as e:
            logger.error(f"Error searching memory: {e}")
            return []

    async def delete_memory(self, key: str) -> bool:
        """Delete a memory entry"""
        try:
            await db_manager.execute("DELETE FROM memory WHERE key = ?", (key,))
            logger.info(f"Deleted memory: {key}")
            return True

        except Exception as e:
            logger.error(f"Error deleting memory: {e}")
            return False

    async def start_session(self, session_id: str) -> bool:
        """Start a new conversation session"""
        try:
            await db_manager.execute(
                """
                INSERT INTO sessions (session_id, started_at, command_count)
                VALUES (?, ?, 0)
            """,
                (session_id, datetime.now().isoformat()),
            )

            logger.info(f"Started session: {session_id}")
            return True

        except Exception as e:
            logger.error(f"Error starting session: {e}")
            return False

    async def end_session(self, session_id: str) -> bool:
        """End a conversation session"""
        try:
            # Count commands in session
            row = await db_manager.fetchone(
                """
                SELECT COUNT(*) FROM conversations WHERE session_id = ?
            """,
                (session_id,),
            )
            count = row[0] if row else 0

            await db_manager.execute(
                """
                UPDATE sessions
                SET ended_at = ?, command_count = ?
                WHERE session_id = ?
            """,
                (datetime.now().isoformat(), count, session_id),
            )

            logger.info(f"Ended session: {session_id} with {count} commands")
            return True

        except Exception as e:
            logger.error(f"Error ending session: {e}")
            return False

    async def cleanup_old_data(self, days: int = 30) -> int:
        """Remove old conversation data"""
        try:
            cutoff = (datetime.now() - timedelta(days=days)).isoformat()

            cursor = await db_manager.execute(
                """
                DELETE FROM conversations WHERE timestamp < ?
            """,
                (cutoff,),
            )

            deleted = cursor.rowcount
            logger.info(f"Cleaned up {deleted} old conversation entries")
            return deleted

        except Exception as e:
            logger.error(f"Error cleaning up old data: {e}")
            return 0

    async def delete_all_conversations(self) -> bool:
        """Wipe all conversion history"""
        try:
            await db_manager.execute("DELETE FROM conversations")
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
            # Identify entries to keep
            if session_id:
                rows = await db_manager.fetchall(
                    """
                    SELECT id FROM conversations 
                    WHERE session_id = ? 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """,
                    (session_id, limit),
                )
            else:
                rows = await db_manager.fetchall(
                    """
                    SELECT id FROM conversations 
                    ORDER BY timestamp DESC 
                    LIMIT ?
                """,
                    (limit,),
                )

            keep_ids = [row[0] for row in rows]

            if not keep_ids:
                return 0

            # Delete everything else
            placeholders = ",".join(["?"] * len(keep_ids))
            if session_id:
                cursor = await db_manager.execute(
                    f"""
                    DELETE FROM conversations 
                    WHERE session_id = ? AND id NOT IN ({placeholders})
                """,
                    (session_id,) + tuple(keep_ids),
                )
            else:
                cursor = await db_manager.execute(
                    f"""
                    DELETE FROM conversations 
                    WHERE id NOT IN ({placeholders})
                """,
                    tuple(keep_ids),
                )

            deleted = cursor.rowcount

            if deleted > 0:
                logger.info(f"Pruned {deleted} conversation entries to maintain performance.")
            return deleted

        except Exception as e:
            logger.error(f"Error pruning conversations: {e}")
            return 0

    async def delete_memory_by_id(self, memory_id: int) -> bool:
        """Delete specific memory fact by ID"""
        try:
            await db_manager.execute("DELETE FROM memory WHERE id = ?", (memory_id,))
            logger.info(f"Deleted memory fact ID: {memory_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting memory fact {memory_id}: {e}")
            return False

    async def save_setting(self, key: str, value: Any) -> bool:
        """Save a system setting to memory"""
        return await self.save_memory(
            MemoryEntry(
                key=f"setting_{key}",
                value=json.dumps(value) if not isinstance(value, str) else value,
                category="settings",
                source="system",
            )
        )

    async def get_setting(self, key: str, default: Any = None) -> Any:
        """Get a system setting from memory"""
        entry = await self.get_memory(f"setting_{key}")
        if not entry:
            return default

        try:
            return json.loads(entry.value)
        except (json.JSONDecodeError, ValueError, TypeError):
            return entry.value


# Singleton instance
memory_manager = MemoryManager()
