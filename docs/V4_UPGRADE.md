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
| **Security Middleware** | API key auth with `hmac.compare_digest`, CSP headers, SQLi protection, body size limits, per-route rate limiting, WebSocket auth gate |

## Breaking Changes

- `modules/llm_legacy.py` has been archived and the `modules/llm/` backward-compat shim removed. All consumers now import directly from `modules.llm_wrapper`.
- `command_handler.py` now dispatches to 9 domain handlers in `handlers/` — custom commands may need re-registration.
- Docker deployment requires PostgreSQL — set `DATABASE_URL` in `.env`.

## Database Migration Notes

### Schema Change: neural_vectors.embedding

In v4.0.0-alpha.2, `neural_vectors.embedding` was changed from `sa.Text()` to raw SQL `vector(1024)` to fix pgvector index creation on existing databases.

**If you already ran `alembic upgrade head` with the old schema**, run the following to fix the column type:

```sql
ALTER TABLE neural_vectors ALTER COLUMN embedding TYPE vector(1024) USING embedding::vector(1024);
CREATE INDEX IF NOT EXISTS idx_neural_vectors_embedding ON neural_vectors USING hnsw (embedding vector_cosine_ops);
```

Then verify the index:

```sql
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE tablename = 'neural_vectors';
```

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

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/agent/chat` | Non-streaming agent response with RAG | X-API-Key header |
| POST | `/api/v1/agent/stream` | SSE streaming agent response | X-API-Key header |
| POST | `/api/v1/agent/rag` | Retrieve RAG context only | X-API-Key header |
| GET | `/api/v1/agent/health` | Agent subsystem health | Exempt (probe compat) |
| WS | `/ws/audio?api_key=&language=en` | Bidirectional TTS/STT streaming | api_key query param |
| WS | `/ws?api_key=` | Command dispatch + system broadcasts | api_key query param |

## Environment Variables (new in v4.0)

```
# API Key Authentication
BACKEND_API_KEY=your-secure-api-key    # Validates all REST API requests
VITE_JARVIS_API_KEY=your-secure-api-key  # Passed as WS query param; must match BACKEND_API_KEY

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

# Frontend WebSocket Config (computed in src/config.ts; override for remote deploy)
# See src/config.ts for WS_API_BASE_URL and AUDIO_WS_URL

# Observability
OTEL_ENABLED=false
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

## Architecture

```
Frontend (React+TS+Vite)
  │
  ├── X-API-Key header ───────────────┐
  │                                    │
  ├── /api/v1/agent/stream (SSE)  ────┤── Auth Middleware (hmac.compare_digest)
  ├── /api/v1/agent/chat (REST)   ────┤     │
  ├── /api/v1/agent/rag (REST)    ────┤     │  ← Dual auth: middleware + Depends()
  ├── /api/v1/agent/health (REST) ────┤  (exempt for K8s probes)
  ├── /ws/audio?api_key= (WS)     ────┤── WebSocket Auth Gate (api_key query param)
  ├── /ws?api_key= (WS)           ────┤── WebSocket Auth Gate (before device-pairing)
  └── /api/v1/* (REST)           ─────┤── Auth Middleware
                                       │
                                  ┌────┘
                                  ▼
                          ┌────────────────┐
                          │  LLM Gateway    │
                          │  + RAG Pipeline │
                          └────────────────┘
                          ┌────────────────┐
                          │  Audio TTS/STT  │
                          └────────────────┘
                          ┌────────────────┐
                          │ Domain Handlers │
                          │  (9 extracted)  │
                          └────────────────┘
```

## Testing

```bash
cd backend
pytest tests/test_v4.py -v
```
