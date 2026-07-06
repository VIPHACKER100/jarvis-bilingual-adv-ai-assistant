"""
JARVIS v4.0 — Agent Router
Exposes chat and streaming endpoints via the simplified LLM client.
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from modules.llm_client import llm_client
from pydantic import BaseModel, Field
from utils.logger_structured import logger
from utils.middleware_security import per_route_limiter, verify_api_key

router = APIRouter(prefix="/agent", tags=["agent"], dependencies=[Depends(verify_api_key)])


class AgentQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="en", pattern="^(en|hi|hinglish)$")
    stream: bool = Field(default=True)
    use_rag: bool = Field(default=False)
    session_id: Optional[str] = None


@router.post("/chat")
async def agent_chat(body: AgentQuery, request: Request):
    """Non-streaming agent response."""
    client_key = f"agent_chat:{request.client.host}"
    if not per_route_limiter.check(client_key, max_calls=30, window_sec=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded (30 req/min)")

    result = await llm_client.chat(body.query, language=body.language)
    return {
        "success": True,
        "response": result or "No response generated.",
        "provider": llm_client.active_provider,
        "language": body.language,
    }


@router.post("/stream")
async def agent_stream(body: AgentQuery, request: Request):
    """Streaming agent response via SSE."""
    client_key = f"agent_stream:{request.client.host}"
    if not per_route_limiter.check(client_key, max_calls=15, window_sec=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded (15 req/min)")

    async def event_stream():
        full_response = []
        try:
            yield f"data: {json.dumps({'type': 'meta', 'provider': llm_client.active_provider, 'language': body.language})}\n\n"
            async for chunk in llm_client.chat_stream(body.query, language=body.language):
                full_response.append(chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'text': chunk})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'full_text': ''.join(full_response)})}\n\n"
        except Exception:
            logger.exception("Agent stream failed")
            if full_response:
                yield f"data: {json.dumps({'type': 'partial_done', 'full_text': ''.join(full_response), 'truncated': True})}\n\n"
            yield f"data: {json.dumps({'type': 'error', 'error': 'Stream generation failed'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )


@router.get("/health", dependencies=[])
async def agent_health():
    """Health check for agent subsystem."""
    return {
        "success": True,
        "online": llm_client.available,
        "active_provider": llm_client.active_provider,
    }


@router.post("/rag")
async def agent_rag_search(body: AgentQuery):
    """RAG search endpoint — returns empty results (RAG removed)."""
    return {"success": True, "query": body.query, "results": [], "total_scanned": 0}
