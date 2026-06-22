"""
Embedding Service — generates vector embeddings via available LLM providers.
"""

import asyncio
from typing import List, Optional
from utils.logger_structured import logger

# Maximum concurrent embedding API calls to avoid rate-limit / 429 errors
_MAX_CONCURRENT_EMBEDS = 5


class EmbeddingService:
    def __init__(self):
        self._dimension = 1024
        self._semaphore: asyncio.Semaphore = asyncio.Semaphore(_MAX_CONCURRENT_EMBEDS)

    async def embed(self, text: str) -> Optional[List[float]]:
        from modules.llm_gateway import llm_gateway
        return await llm_gateway.get_embedding(text)

    async def _embed_with_semaphore(self, text: str) -> Optional[List[float]]:
        """Embed a single text, gated by the concurrency semaphore."""
        async with self._semaphore:
            try:
                return await self.embed(text)
            except Exception as e:
                logger.error(f"Embedding failed for text (len={len(text)}): {e}")
                return None

    async def embed_batch(self, texts: List[str]) -> List[Optional[List[float]]]:
        """
        Embed multiple texts concurrently with bounded concurrency.
        Returns a list parallel to the input `texts`, where each element
        is either the embedding vector or None on failure.
        """
        if not texts:
            return []

        tasks = [self._embed_with_semaphore(t) for t in texts]
        results = await asyncio.gather(*tasks, return_exceptions=False)
        return list(results)

    @property
    def dimension(self) -> int:
        return self._dimension


embedding_service = EmbeddingService()
