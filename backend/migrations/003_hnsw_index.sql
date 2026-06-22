-- JARVIS v4.0 — Migration 003: Replace IVFFlat with HNSW for pgvector
-- HNSW has no minimum row requirement and provides better recall/latency
-- for the small-to-medium tables typical of JARVIS's memory corpus.
--
-- IVFFlat limitation: requires ≥ lists × 10 rows for optimal performance.
-- With lists=100, that means ≥1000 rows — often not met in practice.
-- HNSW works efficiently from row 1.

-- Drop the old IVFFlat index (safe — HNSW index replaces it)
DROP INDEX IF EXISTS idx_neural_vectors_embedding;

-- Create HNSW index with cosine distance
-- m=16: connections per layer (default 16, good balance of speed/memory)
-- ef_construction=64: build-time search width (higher = better quality, slower build)
CREATE INDEX idx_neural_vectors_embedding
    ON neural_vectors USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
