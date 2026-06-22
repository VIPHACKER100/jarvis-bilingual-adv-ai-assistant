# JARVIS v4.0 — Upgrade Guide

## What's New

| Feature | Description |
|---------|-------------|
| **LLM Gateway** | Adapter pattern with 4 providers (Nvidia, OpenRouter, OpenAI, Ollama), auto-failover, circuit breaker, cost tracking |
| **RAG Pipeline** | Hybrid search (keyword + semantic), memory context assembly, embedding service |
| **Agent SSE Streaming** | `/api/v1/agent/stream` — real-time streaming LLM responses to frontend |
| **Audio WebSocket** | `/ws/audio` — bidirectional TTS/STT streaming via OpenAI APIs |
| **Docker Compose** | Production-grade deployment with PostgreSQL, Redis, Nginx reverse proxy |
| **CI/CD Pipeline** | GitHub Actions: lint → test matrix → security scan → deploy |
| **Domain Handlers** | 9 extracted command handlers replacing monolithic 474-line dispatch |
| **PostgreSQL Migration** | asyncpg connection pool with SQLite-to-PostgreSQL query translation at runtime |
| **Structured Logging** | structlog + OpenTelemetry, JSON logs in production |
| **Security Middleware** | CSP headers, SQLi protection, body size limits, per-route rate limiting |

## Breaking Changes

- `modules/llm_legacy.py` has been archived and the `modules/llm/` backward-compat shim removed. All consumers now import directly from `modules.llm_wrapper`.
- `command_handler.py` now dispatches to 9 domain handlers in `handlers/` — custom commands may need re-registration.
- Docker deployment requires PostgreSQL — set `DATABASE_URL` in `.env`.

## Quick Start (Docker)

```bash
# 1. Clone and configure
cp .env.example .env
# Edit .env with your API keys (NVIDIA, OpenRouter, etc.)

# 2. Production launch
docker compose up -d

# 3. Verify
curl http://localhost:8000/api/v1/agent/health
```

## Manual Upgrade (from v3.9.x)

```bash
# Backend
pip install -r backend/requirements.txt

# Database migration (PostgreSQL)
cd backend
alembic upgrade head

# Frontend
npm install
npm run build
```

## API Endpoints (v4.0)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/agent/chat` | Non-streaming agent response with RAG |
| POST | `/api/v1/agent/stream` | SSE streaming agent response |
| POST | `/api/v1/agent/rag` | Retrieve RAG context only |
| GET | `/api/v1/agent/health` | Agent subsystem health |
| WS | `/ws/audio?language=en` | Bidirectional TTS/STT streaming |

## Environment Variables (new in v4.0)

```
# LLM Gateway
LLM_PROVIDER=nvidia
NVIDIA_API_KEY=...
OPENROUTER_API_KEY=...
OPENAI_API_KEY=...
OLLAMA_URL=http://localhost:11434/api/chat

# Audio
TTS_VOICE=alloy
TTS_LANGUAGE=en
STT_LANGUAGE=en

# Observability
OTEL_ENABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

## Architecture

```
Frontend (React+TS+Vite)
  │
  ├── /api/v1/agent/stream (SSE) → LLM Gateway + RAG Pipeline
  ├── /ws/audio (WebSocket)      → Audio TTS/STT
  ├── /ws (WebSocket)             → Command dispatch → Domain Handlers
  └── /api/v1/* (REST)           → CRUD operations
```

## Testing

```bash
cd backend
pytest tests/test_v4.py -v
```
