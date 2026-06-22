"""
Embedding Service — generates vector embeddings via available LLM providers.
"""

from typing import List, Optional
from utils.logger_structured import logger


class EmbeddingService:
    def __init__(self):
        self._dimension = 1024

    async def embed(self, text: str) -> Optional[List[float]]:
        from modules.llm_gateway import llm_gateway
        return await llm_gateway.get_embedding(text)

    async def embed_batch(self, texts: List[str]) -> List[Optional[List[float]]]:
        results = []
        for t in texts:
            emb = await self.embed(t)
            results.append(emb)
        return results

    @property
    def dimension(self) -> int:
        return self._dimension


embedding_service = EmbeddingService()
