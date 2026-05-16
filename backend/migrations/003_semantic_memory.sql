-- Migration 003: Semantic Memory (Vector Search)
-- Stores vector embeddings for neural memory nodes

CREATE TABLE IF NOT EXISTS neural_vectors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL UNIQUE,
    content_hash TEXT NOT NULL,
    embedding BLOB NOT NULL, -- Stored as a serialized numpy array
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_neural_vectors_filename ON neural_vectors(filename);
