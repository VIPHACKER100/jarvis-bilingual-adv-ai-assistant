-- JARVIS v4.0 — PostgreSQL Initial Schema Migration
-- PostgreSQL-compatible version of the original SQLite schema.

CREATE TABLE IF NOT EXISTS conversations (
    id              SERIAL PRIMARY KEY,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_input      TEXT NOT NULL,
    jarvis_response TEXT NOT NULL,
    command_type    TEXT,
    success         BOOLEAN DEFAULT TRUE,
    context         TEXT,
    language        TEXT DEFAULT 'en',
    session_id      TEXT
);

CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversations_session ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_command_type ON conversations(command_type);

CREATE TABLE IF NOT EXISTS memory (
    id          SERIAL PRIMARY KEY,
    key         TEXT UNIQUE NOT NULL,
    value       TEXT NOT NULL,
    category    TEXT DEFAULT 'general',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confidence  REAL DEFAULT 1.0,
    source      TEXT
);

CREATE INDEX IF NOT EXISTS idx_memory_category ON memory(category);
CREATE INDEX IF NOT EXISTS idx_memory_key ON memory(key);

CREATE TABLE IF NOT EXISTS sessions (
    id            SERIAL PRIMARY KEY,
    session_id    TEXT UNIQUE NOT NULL,
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at      TIMESTAMPTZ,
    command_count INTEGER DEFAULT 0,
    metadata      JSONB
);

CREATE TABLE IF NOT EXISTS performance_metrics (
    id             SERIAL PRIMARY KEY,
    timestamp      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_loop_lag REAL NOT NULL,
    cpu_percent    REAL,
    memory_percent REAL
);

CREATE INDEX IF NOT EXISTS idx_performance_timestamp ON performance_metrics(timestamp);

-- Neural vectors for semantic memory (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS neural_vectors (
    id           SERIAL PRIMARY KEY,
    filename     TEXT NOT NULL UNIQUE,
    content_hash TEXT NOT NULL,
    embedding    vector(1024) NOT NULL,
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_neural_vectors_filename ON neural_vectors(filename);
CREATE INDEX IF NOT EXISTS idx_neural_vectors_embedding
    ON neural_vectors USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Paired devices for mobile sync
CREATE TABLE IF NOT EXISTS paired_devices (
    id           SERIAL PRIMARY KEY,
    device_id    TEXT UNIQUE NOT NULL,
    device_name  TEXT NOT NULL,
    device_type  TEXT DEFAULT 'mobile',
    access_token TEXT NOT NULL,
    paired_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Quick actions (user-configured shortcuts)
CREATE TABLE IF NOT EXISTS quick_actions (
    id       SERIAL PRIMARY KEY,
    label    TEXT NOT NULL,
    command  TEXT NOT NULL,
    icon     TEXT,
    "order"  INTEGER DEFAULT 0
);
