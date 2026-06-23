"""
RAG Pipeline — retrieves relevant context from memory and formats it for LLM consumption.
Orchestrates: embedding → hybrid search → re-ranking → context assembly.
"""

from dataclasses import dataclass, field
from typing import List

from modules.rag.embeddings import embedding_service
from modules.rag.search import SearchResult, hybrid_search


@dataclass
class RAGContext:
    query: str
    results: List[SearchResult] = field(default_factory=list)
    assembled_prompt: str = ""
    total_nodes_scanned: int = 0


class RAGPipeline:
    MAX_CONTEXT_TOKENS = 3000

    def __init__(self):
        self.embedding_service = embedding_service
        self.search = hybrid_search

    async def retrieve(self, query: str, force_refresh: bool = False) -> RAGContext:
        from modules.memory import memory_manager

        nodes = await memory_manager.neural.list_nodes()
        context = RAGContext(query=query, total_nodes_scanned=len(nodes))

        if not nodes:
            return context

        core_nodes = ["personality.md", "user.md", "preferences.md"]
        core_content_parts = []
        for core_name in core_nodes:
            for n in nodes:
                if n["name"] == core_name:
                    content = await memory_manager.neural.get_node(core_name)
                    if content:
                        core_content_parts.append(f"=== {core_name.replace('.md', '').upper()} ===\n{content.strip()}")
                    break

        if force_refresh:
            await memory_manager.neural.sync_vectors()

        search_results = await self.search.search(query, nodes, use_semantic=True)

        seen_names = set()
        all_results = []

        for r in search_results:
            if r.node_name not in seen_names:
                all_results.append(r)
                seen_names.add(r.node_name)

        context.results = all_results[:8]

        context.assembled_prompt = self._assemble(core_content_parts, context.results, query)
        return context

    def _assemble(self, core_parts: List[str], results: List[SearchResult], query: str) -> str:
        parts = []
        if core_parts:
            parts.extend(core_parts)

        relevant = [r for r in results if r.score >= 0.3][:5]
        for r in relevant:
            excerpt = r.content[:500].strip()
            parts.append(f"[{r.node_name.replace('.md', '')} (relevance: {r.score:.2f})]\n{excerpt}")

        return "\n\n".join(parts) if parts else ""

    async def format_context_for_llm(self, query: str, max_tokens: int = 2000) -> str:
        context = await self.retrieve(query)
        return context.assembled_prompt[: max_tokens * 4]


rag_pipeline = RAGPipeline()
