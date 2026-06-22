"""
Hybrid Search — combines keyword (fuzzy) + semantic (vector) retrieval.
Uses rapidfuzz for keyword scores and pgvector for semantic scores.
"""

import os
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field

from utils.logger import logger


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

    async def search(self, query: str, nodes: List[Dict[str, Any]],
                     use_semantic: bool = True) -> List[SearchResult]:
        from rapidfuzz import fuzz
        from modules.rag.embeddings import embedding_service

        query_lower = query.lower()
        results: List[SearchResult] = []

        semantic_scores: Dict[str, float] = {}
        if use_semantic:
            query_embedding = await embedding_service.embed(query)
            if query_embedding:
                for node in nodes:
                    emb = await self._get_cached_embedding(node)
                    if emb is not None:
                        semantic_scores[node["name"]] = self._cosine_similarity(query_embedding, emb)

        for node in nodes:
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
                results.append(SearchResult(
                    node_name=node["name"],
                    content=content or "",
                    score=round(hybrid_score, 4),
                    match_type=match_type,
                ))

        results.sort(key=lambda r: r.score, reverse=True)
        return results[:10]

    async def _get_cached_embedding(self, node: Dict[str, Any]) -> Optional[List[float]]:
        try:
            from modules.memory import memory_manager
            cache = memory_manager.neural._vectors_cache
            return cache.get(node["name"])
        except Exception:
            return None

    async def _read_node_content(self, name: str) -> Optional[str]:
        try:
            from modules.memory import memory_manager
            return await memory_manager.neural.get_node(name)
        except Exception:
            return None

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        na = sum(x * x for x in a) ** 0.5
        nb = sum(x * x for x in b) ** 0.5
        if na == 0 or nb == 0:
            return 0.0
        return dot / (na * nb)


hybrid_search = HybridSearch()
