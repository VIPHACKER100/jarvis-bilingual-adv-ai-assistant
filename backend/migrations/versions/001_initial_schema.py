"""Initial PostgreSQL schema

Revision ID: 001
Revises:
Create Date: 2026-06-22
"""

import sqlalchemy as sa
from alembic import op

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    op.create_table(
        "conversations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("user_input", sa.Text(), nullable=False),
        sa.Column("jarvis_response", sa.Text(), nullable=False),
        sa.Column("command_type", sa.Text(), nullable=True),
        sa.Column("success", sa.Boolean(), server_default=sa.text("TRUE"), nullable=True),
        sa.Column("context", sa.Text(), nullable=True),
        sa.Column("language", sa.Text(), server_default=sa.text("'en'"), nullable=True),
        sa.Column("session_id", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_conversations_timestamp", "conversations", ["timestamp"])
    op.create_index("idx_conversations_session", "conversations", ["session_id"])
    op.create_index("idx_conversations_command_type", "conversations", ["command_type"])

    op.create_table(
        "memory",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("key", sa.Text(), nullable=False),
        sa.Column("value", sa.Text(), nullable=False),
        sa.Column("category", sa.Text(), server_default=sa.text("'general'"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("confidence", sa.Float(), server_default=sa.text("1.0"), nullable=True),
        sa.Column("source", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("key"),
    )
    op.create_index("idx_memory_category", "memory", ["category"])
    op.create_index("idx_memory_key", "memory", ["key"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.Text(), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("command_count", sa.Integer(), server_default=sa.text("0"), nullable=True),
        sa.Column("metadata", sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )

    op.create_table(
        "performance_metrics",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("event_loop_lag", sa.Float(), nullable=False),
        sa.Column("cpu_percent", sa.Float(), nullable=True),
        sa.Column("memory_percent", sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_performance_timestamp", "performance_metrics", ["timestamp"])

    op.execute(
        "CREATE TABLE IF NOT EXISTS neural_vectors ("
        "id SERIAL PRIMARY KEY, "
        "filename TEXT NOT NULL UNIQUE, "
        "content_hash TEXT NOT NULL, "
        "embedding vector(1024) NOT NULL, "
        "updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()"
        ")"
    )
    op.create_index("idx_neural_vectors_filename", "neural_vectors", ["filename"])

    op.create_table(
        "paired_devices",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("device_id", sa.Text(), nullable=False),
        sa.Column("device_name", sa.Text(), nullable=False),
        sa.Column("device_type", sa.Text(), server_default=sa.text("'mobile'"), nullable=True),
        sa.Column("access_token", sa.Text(), nullable=False),
        sa.Column("paired_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("device_id"),
    )

    op.create_table(
        "quick_actions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("label", sa.Text(), nullable=False),
        sa.Column("command", sa.Text(), nullable=False),
        sa.Column("icon", sa.Text(), nullable=True),
        sa.Column("order", sa.Integer(), server_default=sa.text("0"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    # pgvector ivfflat index
    op.execute(
        "CREATE INDEX IF NOT EXISTS idx_neural_vectors_embedding "
        "ON neural_vectors USING ivfflat (embedding vector_cosine_ops) "
        "WITH (lists = 100)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_neural_vectors_embedding")
    op.drop_table("quick_actions")
    op.drop_table("paired_devices")
    op.drop_table("neural_vectors")
    op.drop_table("performance_metrics")
    op.drop_table("sessions")
    op.drop_table("memory")
    op.drop_table("conversations")
