-- JARVIS v3.8.0 — Initial Schema Migration (001)
-- Formalizes the existing database schema as version 1.
-- This migration is idempotent (uses IF NOT EXISTS throughout).

-- ─── Conversations Table ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp       TEXT    NOT NULL,
    user_input      TEXT    NOT NULL,
    jarvis_response TEXT    NOT NULL,
    command_type    TEXT,
    success         BOOLEAN DEFAULT 1,
    context         TEXT,
    language        TEXT    DEFAULT 'en',
    session_id      TEXT
);

CREATE INDEX IF NOT EXISTS idx_conversations_timestamp
    ON conversations(timestamp);

CREATE INDEX IF NOT EXISTS idx_conversations_session
    ON conversations(session_id);

CREATE INDEX IF NOT EXISTS idx_conversations_command_type
    ON conversations(command_type);

-- ─── Memory / Facts Table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS memory (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    key         TEXT    UNIQUE NOT NULL,
    value       TEXT    NOT NULL,
    category    TEXT    DEFAULT 'general',
    created_at  TEXT    NOT NULL,
    updated_at  TEXT    NOT NULL,
    confidence  REAL    DEFAULT 1.0,
    source      TEXT
);

CREATE INDEX IF NOT EXISTS idx_memory_category
    ON memory(category);

CREATE INDEX IF NOT EXISTS idx_memory_key
    ON memory(key);

-- ─── Sessions Table ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id    TEXT    UNIQUE NOT NULL,
    started_at    TEXT    NOT NULL,
    ended_at      TEXT,
    command_count INTEGER DEFAULT 0,
    metadata      TEXT
);

-- ─── Performance Metrics Table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_metrics (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp      TEXT    NOT NULL,
    event_loop_lag REAL    NOT NULL,
    cpu_percent    REAL,
    memory_percent REAL
);

CREATE INDEX IF NOT EXISTS idx_performance_timestamp
    ON performance_metrics(timestamp);
