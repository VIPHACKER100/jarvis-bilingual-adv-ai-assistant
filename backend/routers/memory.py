from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.memory import memory_manager, ConversationEntry, MemoryEntry

router = APIRouter(prefix="/api/memory", tags=["Memory & Analytics"])

@router.post("/conversation")
async def save_conversation(entry: Dict[str, Any]):
    """Save conversation entry"""
    conv = ConversationEntry(
        user_input=entry.get('user_input', ''),
        jarvis_response=entry.get('jarvis_response', ''),
        command_type=entry.get('command_type', ''),
        success=entry.get('success', True),
        language=entry.get('language', 'en'),
        session_id=entry.get('session_id', 'default')
    )
    return memory_manager.save_conversation(conv)

@router.get("/conversations")
async def get_conversations(limit: int = 20):
    """Get recent history"""
    return memory_manager.get_recent_conversations(limit)

@router.get("/stats")
async def get_stats(days: int = 7):
    """Get system analytics"""
    return memory_manager.get_conversation_stats(days)

@router.delete("/conversations")
async def delete_conversations():
    """Clear history"""
    return memory_manager.delete_all_conversations()

@router.post("/fact")
async def save_fact(fact: Dict[str, Any]):
    """Inject new memory fact"""
    mem = MemoryEntry(
        key=fact.get('key', ''),
        value=fact.get('value', ''),
        category=fact.get('category', 'general')
    )
    return memory_manager.save_memory(mem)

@router.get("/facts")
async def get_facts(category: Optional[str] = None):
    """Retrieve learned facts"""
    if category:
        return memory_manager.get_memories_by_category(category)
    return memory_manager.search_memory("")

@router.put("/fact/{fact_id}")
async def update_fact(fact_id: int, value: str):
    """Update existing manual memory"""
    return memory_manager.update_memory_by_id(fact_id, value)

@router.delete("/fact/{fact_id}")
async def delete_fact(fact_id: int):
    """Forget specific fact"""
    return memory_manager.delete_memory_by_id(fact_id)
