from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.memory import memory_manager, ConversationEntry, MemoryFact

router = APIRouter(prefix="/api/memory", tags=["Memory & Analytics"])

@router.post("/conversation")
async def save_conversation(entry: Dict[str, Any]):
    """Save conversation entry"""
    # Assuming memory_manager has this method
    return await memory_manager.save_conversation(entry)

@router.get("/conversations")
async def get_conversations(limit: int = 20):
    """Get recent history"""
    return await memory_manager.get_recent_conversations(limit)

@router.get("/stats")
async def get_stats(days: int = 7):
    """Get system analytics"""
    return await memory_manager.get_stats(days)

@router.delete("/conversations")
async def delete_conversations():
    """Clear history"""
    return await memory_manager.delete_all_conversations()

@router.post("/fact")
async def save_fact(fact: Dict[str, Any]):
    """Inject new memory fact"""
    return await memory_manager.save_memory(fact)

@router.get("/facts")
async def get_facts(category: Optional[str] = None):
    """Retrieve learned facts"""
    return await memory_manager.get_memories(category)

@router.put("/fact/{fact_id}")
async def update_fact(fact_id: int, value: str):
    """Update existing manual memory"""
    return await memory_manager.update_memory_by_id(fact_id, value)

@router.delete("/fact/{fact_id}")
async def delete_fact(fact_id: int):
    """Forget specific fact"""
    return await memory_manager.delete_memory_by_id(fact_id)
