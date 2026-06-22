"""
RAG package — provides retrieval-augmented generation context for LLM calls.
"""

from modules.rag.pipeline import rag_pipeline, RAGContext
from modules.rag.embeddings import embedding_service
from modules.rag.search import hybrid_search

__all__ = ["rag_pipeline", "RAGContext", "embedding_service", "hybrid_search"]
