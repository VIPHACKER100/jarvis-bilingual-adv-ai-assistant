from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.memory import memory_manager, ConversationEntry, MemoryEntry
from models import (
    BaseResponse, ConversationEntryRequest, ConversationListResponse,
    FactRequest, FactListResponse, StatsResponse
)

router = APIRouter(prefix="/api/memory", tags=["Memory & Analytics"])

@router.post("/conversation", response_model=BaseResponse)
async def save_conversation(entry: ConversationEntryRequest):
    """Save conversation entry"""
    conv = ConversationEntry(
        user_input=entry.user_input,
        jarvis_response=entry.jarvis_response,
        command_type=entry.command_type,
        success=entry.success,
        language=entry.language,
        session_id=entry.session_id
    )
    return memory_manager.save_conversation(conv)

@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(limit: int = 20):
    """Get recent history"""
    return memory_manager.get_recent_conversations(limit)

@router.get("/stats", response_model=StatsResponse)
async def get_stats(days: int = 7):
    """Get system analytics"""
    return memory_manager.get_conversation_stats(days)

@router.delete("/conversations", response_model=BaseResponse)
async def delete_conversations():
    """Clear history"""
    return memory_manager.delete_all_conversations()

@router.post("/fact", response_model=BaseResponse)
async def save_fact(fact: FactRequest):
    """Inject new memory fact"""
    mem = MemoryEntry(
        key=fact.key,
        value=fact.value,
        category=fact.category
    )
    return memory_manager.save_memory(mem)

@router.get("/facts", response_model=FactListResponse)
async def get_facts(category: Optional[str] = None):
    """Retrieve learned facts"""
    if category:
        return memory_manager.get_memories_by_category(category)
    return memory_manager.search_memory("")

@router.put("/fact/{fact_id}", response_model=BaseResponse)
async def update_fact(fact_id: int, value: str = Body(..., embed=True)):
    """Update existing manual memory"""
    return memory_manager.update_memory_by_id(fact_id, value)

@router.delete("/fact/{fact_id}", response_model=BaseResponse)
async def delete_fact(fact_id: int):
    """Forget specific fact"""
    return memory_manager.delete_memory_by_id(fact_id)
