# ADR-001: Switch from IVFFlat to HNSW index for pgvector

**Status:** Accepted
**Date:** 2026-06-23
**Deciders:** JARVIS Development Team

---

## Context

JARVIS v4.0 introduced a pgvector-based semantic search pipeline for memory retrieval. The initial implementation used an IVFFlat index with `vector_cosine_ops` for the `neural_vectors` table (1024-dimensional embeddings from the LLM embedding service).

Performance profiling revealed that IVFFlat has suboptimal characteristics for JARVIS's workload:

- Memory nodes change frequently (decision logs, preference updates, fact extractions trigger `sync_vectors`)
- IVFFlat requires periodic `REINDEX` after significant data changes
- Query latency with IVFFlat increases noticeably as the vector count grows beyond a few hundred rows
- The proactive engine and RAG pipeline both issue frequent similarity searches

The `neural_vectors` table currently holds a small number of rows (~10-50 memory nodes), but the architecture must scale as memory grows.

## Decision

Replace the IVFFlat index with an HNSW (Hierarchical Navigable Small World) index on the `neural_vectors.embedding` column.

### SQL implementation

```sql
-- Drop the old IVFFlat index if it exists
DROP INDEX IF EXISTS idx_neural_vectors_embedding;

-- Create HNSW index for cosine distance
CREATE INDEX idx_neural_vectors_embedding
    ON neural_vectors
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
```

### Migration approach

```python
# In Alembic migration or direct SQL execution
def upgrade():
    op.execute("DROP INDEX IF EXISTS idx_neural_vectors_embedding")
    op.execute("""
        CREATE INDEX idx_neural_vectors_embedding
        ON neural_vectors
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64)
    """)
```

## Alternatives considered

### 1. Keep IVFFlat with periodic reindexing

- **Pros**: Lower memory usage, faster initial build
- **Cons**: Requires `REINDEX` after bulk inserts; query quality degrades between reindexes; adds operational complexity
- **Rejected because**: JARVIS updates vectors incrementally (not in bulk), making periodic reindexing an unnecessary maintenance burden

### 2. Brute-force (no index)

- **Pros**: Simplest implementation; 100% recall
- **Cons**: Full table scan on every query; unscalable beyond ~1000 rows
- **Rejected because**: Even at 50 rows, the overhead of generating embeddings + full scan is unnecessary when an index provides sub-millisecond queries

### 3. HNSW with different parameters

Considered `m = 32, ef_construction = 128` for higher recall at the cost of more memory and slower indexing.

**Rejected because**: For the current data scale (<100 rows), `m = 16` is sufficient. Parameters can be tuned later if needed.

## Consequences

### Positive

- **Query latency improvement**: HNSW provides O(log n) search complexity vs O(n) for IVFFlat on small datasets
- **No reindexing needed**: HNSW handles incremental inserts gracefully
- **Better recall**: HNSW consistently achieves higher recall than IVFFlat for the same `ef_search` parameter
- **Future-proof**: HNSW scales well to millions of vectors without configuration changes

### Negative

- **Higher memory usage**: HNSW stores a graph structure in addition to vectors (~1.5x memory of IVFFlat)
- **Slightly slower index build**: Initial index creation takes longer than IVFFlat
- **PostgreSQL extension required**: The `vector` extension must be installed (`CREATE EXTENSION IF NOT EXISTS vector`)

### Neutral

- Query syntax remains identical (`<=>` operator for cosine distance)
- No changes needed to application code (`search.py`, `memory.py`)
- Index creation is a one-time migration

## References

- [pgvector HNSW documentation](https://github.com/pgvector/pgvector#hnsw-indexes)
- JARVIS decision log: `memory/decisions.md` (2026-06-23 — Phase 2: LLM Gateway Unification)
- Source files: `backend/modules/rag/search.py`, `backend/modules/memory.py`
