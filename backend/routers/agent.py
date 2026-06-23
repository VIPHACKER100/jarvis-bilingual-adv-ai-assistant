"""
JARVIS v4.0 — Agent Streaming Router
Exposes Server-Sent Events (SSE) endpoint for streaming agent responses.
"""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from modules.llm_gateway import cost_tracker, llm_gateway
from modules.rag import rag_pipeline
from pydantic import BaseModel, Field
from utils.logger_structured import logger
from utils.middleware_security import per_route_limiter, verify_api_key

router = APIRouter(prefix="/agent", tags=["agent"], dependencies=[Depends(verify_api_key)])


class AgentQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    language: str = Field(default="en", pattern="^(en|hi|hinglish)$")
    stream: bool = Field(default=True)
    use_rag: bool = Field(default=True)
    session_id: Optional[str] = None


@router.post("/chat")
async def agent_chat(body: AgentQuery, request: Request):
    """Non-streaming agent response with optional RAG context."""
    client_key = f"agent_chat:{request.client.host}"
    if not per_route_limiter.check(client_key, max_calls=30, window_sec=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded (30 req/min)")
    context = ""
    if body.use_rag:
        ctx = await rag_pipeline.retrieve(body.query)
        context = ctx.assembled_prompt

    result = await llm_gateway.generate(
        body.query, language=body.language, context=context
    )
    return {
        "success": True,
        "response": result or "No response generated.",
        "provider": llm_gateway.active_provider,
        "language": body.language,
        "cost_stats": cost_tracker.stats(),
    }


@router.post("/stream")
async def agent_stream(body: AgentQuery, request: Request):
    """Streaming agent response via SSE."""
    client_key = f"agent_stream:{request.client.host}"
    if not per_route_limiter.check(client_key, max_calls=15, window_sec=60):
        raise HTTPException(status_code=429, detail="Rate limit exceeded (15 req/min)")
    context = ""
    if body.use_rag:
        ctx = await rag_pipeline.retrieve(body.query)
        context = ctx.assembled_prompt

    async def event_stream():
        full_response = []
        try:
            yield f"data: {json.dumps({'type': 'meta', 'provider': llm_gateway.active_provider, 'language': body.language})}\n\n"
            async for chunk in llm_gateway.generate_stream(
                body.query, language=body.language, context=context
            ):
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
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/health", dependencies=[])
async def agent_health():
    """Health check for agent subsystem."""
    providers = llm_gateway.available_providers
    return {
        "success": True,
        "online": len(providers) > 0,
        "active_provider": llm_gateway.active_provider,
        "available_providers": providers,
        "cost_stats": cost_tracker.stats(),
    }


@router.post("/rag")
async def agent_rag_search(body: AgentQuery):
    """Retrieve RAG context without LLM generation."""
    ctx = await rag_pipeline.retrieve(body.query, force_refresh=True)
    results = []
    for r in ctx.results[:5]:
        results.append({
            "node": r.node_name,
            "score": r.score,
            "match_type": r.match_type,
            "excerpt": r.content[:300],
        })
    return {"success": True, "query": body.query, "results": results, "total_scanned": ctx.total_nodes_scanned}
