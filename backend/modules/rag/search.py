"""
Hybrid Search — combines keyword (fuzzy) + semantic (pgvector) retrieval.
Uses rapidfuzz for keyword scores and pgvector cosine distance for semantic scores.
"""

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass
class SearchResult:
    node_name: str
    content: str
    score: float
    match_type: str = "hybrid"  # "keyword", "semantic", "hybrid"


class HybridSearch:
    def __init__(self, keyword_weight: float = 0.3, semantic_weight: float = 0.7):
        self.keyword_weight = keyword_weight
        self.semantic_weight = semantic_weight

    async def search(self, query: str, nodes: List[Dict[str, Any]], use_semantic: bool = True) -> List[SearchResult]:
        from modules.rag.embeddings import embedding_service
        from rapidfuzz import fuzz
        from utils.database import db_manager

        query_lower = query.lower()
        results: List[SearchResult] = []
        semantic_scores: Dict[str, float] = {}

        if use_semantic:
            query_embedding = await embedding_service.embed(query)
            if query_embedding:
                rows = await db_manager.fetchall(
                    "SELECT filename, 1 - (embedding <=> ?::vector) AS similarity FROM neural_vectors WHERE embedding IS NOT NULL ORDER BY embedding <=> ?::vector LIMIT 20",
                    (query_embedding, query_embedding),
                )
                for row in rows:
                    semantic_scores[row["filename"]] = row["similarity"]

        async def _score_node(node: Dict[str, Any]) -> Optional[SearchResult]:
            name = node["name"].replace(".md", "").lower()
            content = await self._read_node_content(node["name"])

            keyword_score = fuzz.partial_ratio(query_lower, name) / 100.0
            for word in query_lower.split():
                if word in name:
                    keyword_score += 0.2

            semantic_score = semantic_scores.get(node["name"], 0.0)

            hybrid_score = (keyword_score * self.keyword_weight) + (semantic_score * self.semantic_weight)

            if hybrid_score >= 0.3:
                match_type = "semantic" if semantic_score > keyword_score else "keyword"
                if keyword_score > 0.3 and semantic_score > 0.3:
                    match_type = "hybrid"
                return SearchResult(
                    node_name=node["name"],
                    content=content or "",
                    score=round(hybrid_score, 4),
                    match_type=match_type,
                )
            return None

        scored_results = await asyncio.gather(*[_score_node(n) for n in nodes], return_exceptions=True)
        results = [r for r in scored_results if r is not None and not isinstance(r, BaseException)]

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:10]

    async def _read_node_content(self, name: str) -> Optional[str]:
        try:
            from modules.memory import memory_manager

            return await memory_manager.neural.get_node(name)
        except Exception:
            return None


hybrid_search = HybridSearch()
