-- JARVIS v4.0 — Migration 002: pgvector extension + vector index
-- Upgrades neural_vectors from REAL[] to vector(1024) for efficient SQL-level similarity search.

CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column, migrate existing data if any, then drop old column
ALTER TABLE neural_vectors ADD COLUMN IF NOT EXISTS embedding_vec vector(1024);
UPDATE neural_vectors SET embedding_vec = embedding::text::vector WHERE embedding_vec IS NULL AND embedding IS NOT NULL;
ALTER TABLE neural_vectors DROP COLUMN IF EXISTS embedding;
ALTER TABLE neural_vectors RENAME COLUMN embedding_vec TO embedding;

-- ivfflat index for approximate nearest-neighbor search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_neural_vectors_embedding
    ON neural_vectors USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
