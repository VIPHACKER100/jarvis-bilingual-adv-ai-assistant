from fastapi import APIRouter, HTTPException, Query, Body
from typing import Dict, Any, Optional, List
from modules.memory import memory_manager, ConversationEntry, MemoryEntry
from models import (
    BaseResponse,
    ConversationEntryRequest,
    ConversationListResponse,
    FactRequest,
    FactListResponse,
    StatsResponse,
    MemoryNodeListResponse,
    MemoryNodeResponse,
    MemoryNodeUpdateRequest
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
        session_id=entry.session_id,
    )
    return await memory_manager.save_conversation(conv)


@router.get("/conversations", response_model=ConversationListResponse)
async def get_conversations(limit: int = 20):
    """Get recent history"""
    return await memory_manager.get_recent_conversations(limit)


@router.get("/stats", response_model=StatsResponse)
async def get_stats(days: int = 7):
    """Get system analytics"""
    return {"stats": await memory_manager.get_conversation_stats(days)}


@router.delete("/conversations", response_model=BaseResponse)
async def delete_conversations():
    """Clear history"""
    return await memory_manager.delete_all_conversations()


@router.post("/fact", response_model=BaseResponse)
async def save_fact(fact: FactRequest):
    """Inject new memory fact"""
    mem = MemoryEntry(key=fact.key, value=fact.value, category=fact.category)
    return await memory_manager.save_memory(mem)


@router.get("/facts", response_model=FactListResponse)
async def get_facts(category: Optional[str] = None):
    """Retrieve learned facts"""
    if category:
        return await memory_manager.get_memories_by_category(category)
    return await memory_manager.search_memory("")


@router.put("/fact/{fact_id}", response_model=BaseResponse)
async def update_fact(fact_id: int, value: str = Body(..., embed=True)):
    """Update existing manual memory"""
    return await memory_manager.update_memory_by_id(fact_id, value)


@router.delete("/fact/{fact_id}", response_model=BaseResponse)
async def delete_fact(fact_id: int):
    """Forget specific fact"""
    return await memory_manager.delete_memory_by_id(fact_id)


# --- Neural Memory (Markdown Nodes) ---

@router.get("/nodes", response_model=MemoryNodeListResponse)
async def list_memory_nodes():
    """List all Markdown memory nodes"""
    nodes = await memory_manager.neural.list_nodes()
    return {
        "success": True,
        "nodes": nodes,
        "count": len(nodes)
    }


@router.get("/nodes/{name}", response_model=MemoryNodeResponse)
async def get_memory_node(name: str):
    """Get content of a Markdown memory node"""
    content = await memory_manager.neural.get_node(name)
    if content is None:
        raise HTTPException(status_code=404, detail=f"Memory node {name} not found")
    
    return {
        "success": True,
        "name": name,
        "content": content
    }


@router.put("/nodes/{name}", response_model=BaseResponse)
async def update_memory_node(name: str, update: MemoryNodeUpdateRequest):
    """Update a Markdown memory node"""
    success = await memory_manager.neural.update_node(name, update.content)
    if not success:
        raise HTTPException(status_code=500, detail=f"Failed to update memory node {name}")
    
    return {
        "success": True,
        "response": f"Memory node {name} updated successfully"
    }
