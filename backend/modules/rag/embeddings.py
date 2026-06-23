"""
Embedding Service — generates vector embeddings via available LLM providers.
"""

import asyncio
from typing import List, Optional

from utils.database import db_manager
from utils.logger_structured import logger

# Maximum concurrent embedding API calls to avoid rate-limit / 429 errors
_MAX_CONCURRENT_EMBEDS = 5


class EmbeddingService:
    def __init__(self):
        self._dimension: Optional[int] = None
        self._semaphore: asyncio.Semaphore = asyncio.Semaphore(_MAX_CONCURRENT_EMBEDS)

    async def _get_dimension(self) -> int:
        """Get embedding dimension from database schema, caching it."""
        if self._dimension is None:
            try:
                row = await db_manager.fetchone(
                    "SELECT typmod FROM pg_attribute WHERE attrelid = 'neural_vectors'::regclass AND attname = 'embedding'"
                )
                if row and row[0]:
                    # Extract dimension from vector type: vector(1024) -> 1024
                    dim_str = str(row[0]).strip("()")
                    self._dimension = int(dim_str)
                else:
                    # Fallback to default
                    self._dimension = 1024
            except Exception as e:
                logger.error(f"Could not read embedding dimension from schema: {e}")
                self._dimension = 1024
        return self._dimension

    async def embed(self, text: str) -> Optional[List[float]]:
        from modules.llm_gateway import llm_gateway

        embedding = await llm_gateway.get_embedding(text)
        if embedding:
            # Validate dimension matches schema
            expected_dim = await self._get_dimension()
            if len(embedding) != expected_dim:
                logger.warning(f"Embedding dimension mismatch: got {len(embedding)}, expected {expected_dim}")
        return embedding

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
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [r if not isinstance(r, BaseException) else None for r in results]

    @property
    def dimension(self) -> int:
        """Get embedding dimension (will fetch from schema on first access)."""
        import warnings

        warnings.warn(
            "EmbeddingService.dimension is deprecated. Use async _get_dimension() instead.", DeprecationWarning
        )
        return self._dimension or 1024


embedding_service = EmbeddingService()
