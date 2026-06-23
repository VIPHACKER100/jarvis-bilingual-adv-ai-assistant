# JARVIS — Technical Design Specification (TDS)

| Field | Value |
|-------|-------|
| **Product** | JARVIS — Bilingual Advanced AI Assistant |
| **Version** | 4.0.0-alpha.1 |
| **Author** | Aryan Ahirwar (VIPHACKER100) |
| **Last Updated** | 2026-06-23 |
| **Status** | Active Development |
| **Companion** | [PRD.md](PRD.md) |

---

## 1. Document Purpose

This Technical Design Specification describes **how** JARVIS is built: architecture, components, data flows, APIs, security, deployment, and testing. It complements the [PRD.md](PRD.md), which defines product requirements.

---

## 2. System Overview

JARVIS is a **local-first client–server application**:

- **Frontend (React 19 + Vite + TypeScript):** Glassmorphic HUD, voice capture, WebSocket client, REST consumer.
- **Backend (FastAPI + Python 3.11+):** Command dispatch, OS automation, LLM orchestration, persistence, real-time broadcasts.
- **Data Layer (PostgreSQL + pgvector):** Conversations, memory facts, performance metrics, sessions, vector embeddings.

```mermaid
flowchart TB
    subgraph Client["Browser (React HUD)"]
        Voice[Web Speech API]
        UI[MainHUD + Dashboards]
        WS_C[WebSocket Client]
        API_C[apiClient.ts]
    end

    subgraph Server["FastAPI Backend :8000"]
        WS_S[websocket router]
        CMD[command_handler]
        ROUTERS[19 API Routers]
        MOD[17 Domain Modules]
        LLM[llm.py]
        PRO[proactive.py]
        AGN[agent.py]
    end

    subgraph Data["Persistence"]
        SQL[(PostgreSQL + pgvector)]
        REDIS[(Redis optional)]
        JSON[contacts.json / macros.json]
    end

    subgraph External["External Services"]
        OR[OpenRouter]
        NV[NVIDIA API]
        OL[Ollama]
    end

    Voice --> UI
    UI --> API_C
    UI --> WS_C
    API_C --> ROUTERS
    WS_C --> WS_S
    WS_S --> CMD
    CMD --> MOD
    ROUTERS --> MOD
    MOD --> SQL
    MOD --> JSON
    LLM --> OR
    LLM --> NV
    LLM --> OL
    PRO --> LLM
    AGN --> LLM
    AGN --> CMD
    MOD --> REDIS
```

---

## 3. Technology Stack

### 3.1 Frontend

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | React | 19.x |
| Build | Vite | 6.x |
| Language | TypeScript | 5.8 |
| State | Zustand (+ persist, devtools) | 4.x |
| Data fetching | TanStack React Query | 5.x |
| Animation | Framer Motion | 12.x |
| Icons | Lucide React | 1.x |
| Validation | Zod | 4.x |
| Testing | Vitest + Testing Library | 4.x |

### 3.2 Backend

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | FastAPI | ≥ 0.110 |
| Server | Uvicorn | ≥ 0.29 |
| Async DB | asyncpg | ≥ 0.29 |
| Rate limit | SlowAPI | ≥ 0.1.9 |
| System | psutil, pyautogui, pywin32 (Win) | — |
| OCR | pytesseract, Pillow | — |
| Fuzzy match | rapidfuzz | — |
| HTTP client | httpx | ≥ 0.27 |

### 3.3 Infrastructure

| Concern | Tool |
|---------|------|
| CI/CD | GitHub Actions (`.github/workflows/ci.yml`) |
| Containers | Docker Compose |
| Env config | python-dotenv, `.env` |
| Version source | `backend/config/environment.py` → `VERSION = "3.9.1"` |

---

## 4. Repository Structure

```
jarvis-bilingual-adv-ai-assistant/
├── src/                          # React frontend
│   ├── components/               # HUD panels (27+ components)
│   ├── hooks/                    # useJarvisBridge, useVoiceController, useTheme
│   ├── services/                 # apiClient, websocketService, voiceService
│   ├── store/                    # jarvisStore (Zustand)
│   ├── types/                    # api.ts (350+ interfaces), bridge.ts
│   └── styles/                   # Design System V3 (index.css)
├── backend/
│   ├── main.py                   # FastAPI app, lifespan, middleware
│   ├── routers/                  # 19 modular APIRouter files
│   ├── handlers/
│   │   └── command_handler.py    # Central command dispatch (90+ routes)
│   ├── modules/                  # 16 domain logic modules
│   ├── config/
│   │   ├── environment.py        # VERSION, paths, ports
│   │   └── commands.py           # Bilingual mappings, dangerous cmds
│   ├── utils/
│   │   ├── database.py           # asyncpg pool, pgvector, migrations, SQLite-to-PostgreSQL query translation
│   ├── migrations/
│   │   └── 001_initial.sql       # Schema v1
│   └── tests/                    # pytest suite
├── memory/                       # Persistent AI session memory (Markdown)
├── docs/                         # SETUP, COMMANDS, API_DOCUMENTATION
├── data/                         # PostgreSQL data, macros, contacts
└── .github/workflows/            # CI pipeline
```

---

## 5. Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| **Async-first** | All I/O via `async`/`await`; blocking work in `asyncio.to_thread` |
| **Modular routers** | One `APIRouter` per domain; `main.py` mounts all |
| **Typed contract** | Pydantic models (backend) ↔ TypeScript interfaces (frontend) |
| **Defensive UI** | Optional chaining, default `[]` for list endpoints |
| **Security defaults** | API key middleware, rate limits, confirmation gates |
| **Single version** | `VERSION` constant in `environment.py` |

---

## 6. Backend Design

### 6.1 Application Entry (`main.py`)

**Responsibilities:**

- FastAPI app with `lifespan` context manager.
- Startup: initialize `memory_manager`, `whatsapp_manager`, `automation_manager`, `proactive_manager`.
- Background tasks: `broadcast_system_status()`, `monitor_event_loop_lag()`.
- CORS for `FRONTEND_URL` + localhost dev ports.
- Rate limiter: 200 requests/minute (SlowAPI).
- Response timing middleware (`X-Response-Time` header).
- Mount 19 routers under `/api/v1` (legacy root routes retained).

### 6.2 Router Modules

| Router | Domain |
|--------|--------|
| `system.py` | Health, status, security scans, process guardian |
| `windows.py` | Window list, app launch/close |
| `files.py` | File CRUD, search |
| `media.py` | Media playback control |
| `pdf_tools.py` | PDF merge/split/compress |
| `image_tools.py` | Image convert/resize/batch |
| `desktop.py` | Screenshots, clipboard |
| `input_control.py` | Mouse/keyboard automation |
| `memory.py` | Facts, conversations, stats |
| `automation.py` | Macros, scheduled tasks |
| `commands.py` | HTTP command endpoint |
| `websocket.py` | Real-time command + status |
| `whatsapp.py` | Messaging automation |
| `notifications.py` | System toasts |
| `sync.py` | Mobile device pairing |
| `settings.py` | Runtime configuration |
| `health.py` | Liveness/readiness |
| `context.py` | LLM context / proactive API |

### 6.3 Domain Modules

| Module | Responsibility |
|--------|----------------|
| `system.py` | psutil metrics, power, volume, brightness |
| `window_manager.py` | pygetwindow operations |
| `file_manager.py` | Filesystem CRUD |
| `input_control.py` | pyautogui mouse/keyboard |
| `media.py` | OS media keys |
| `desktop.py` | Screenshots, clipboard |
| `llm.py` | Multi-provider LLM with failover |
| `memory.py` | PostgreSQL persistence, pgvector semantic retrieval |
| `bilingual_parser.py` | Hindi→English command normalization |
| `whatsapp.py` | WhatsApp automation + smart reply |
| `proactive.py` | Background situational analysis & feedback loop |
| `automation.py` | Macros and schedulers |
| `security.py` | Process guardian, network scan, confirmation gating |
| `personalities.py` | Dynamic persona prompts |
| `context.py` | Window/context extraction & mobile telemetry |
| `health.py` | Backend health probes |
| `agent.py` | Autonomous ReAct Loop Controller |

### 6.4 Command Dispatch Flow

```mermaid
sequenceDiagram
    participant U as User (Voice/UI)
    participant FE as Frontend
    participant WS as WebSocket Router
    participant CH as command_handler
    participant BP as bilingual_parser
    participant MOD as Domain Module
    participant DB as PostgreSQL

    U->>FE: Speech / click
    FE->>WS: { type: "command", text, language }
    WS->>CH: handle_command(text, lang)
    CH->>BP: normalize(text)
    BP-->>CH: canonical_key
    alt Dangerous command
        CH-->>FE: requires_confirmation + confirmation_id
        FE->>U: Confirmation modal
        U->>FE: Confirm
        FE->>WS: confirm(confirmation_id)
    end
    CH->>MOD: execute(action)
    MOD->>DB: log conversation (async)
    MOD-->>CH: result
    CH-->>FE: CommandResponse (bilingual)
    FE->>U: TTS + HUD update
```

**Key file:** `backend/handlers/command_handler.py` — single dispatch table with 100% routing parity to `config/commands.py` definitions.

### 6.5 LLM Integration (`modules/llm.py`)

| Provider | Env Keys | Notes |
|----------|----------|-------|
| NVIDIA | `NVIDIA_API_KEY`, `NVIDIA_MODEL` | Default provider |
| OpenRouter | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` | Failover |
| Ollama | `OLLAMA_URL`, `OLLAMA_MODEL` | Local inference |

**Failover:** Primary failure (401/500) triggers secondary provider attempt.

**Context injection:** `NeuralMemoryManager` scores Markdown memory nodes via `rapidfuzz` + keyword intersection; top-N nodes inject into system prompt.

### 6.6 Proactive Engine (`modules/proactive.py`)

- Background asyncio loop started in `lifespan`.
- Reads active window title / context via `context.py`.
- **Neural Feedback**: Routinely scans `memory/decisions.md` to suppress suggesting previously rejected actions.
- Broadcasts via WebSocket to populate `QuickResponses` UI.

### 6.7 Autonomous Agent (`modules/agent.py`)

- Implements the ReAct (Reasoning and Acting) loop.
- Features exponential back-off for LLM rate-limit protection.
- Orchestrates multi-step queries by recursively invoking `command_handler`.
- **Trace Auditing**: Full Thought -> Action -> Observation flow is persisted to `memory/agent_traces.md`.

---

## 7. Frontend Design

### 7.1 Application Bootstrap (`src/App.tsx`)

**Hooks wired at root:**

| Hook | Role |
|------|------|
| `useTheme` | Dark/light + design tokens |
| `useJarvisSync` | Mobile pairing state |
| `useJarvisBridge` | WebSocket + REST command flow |
| `useVoiceController` | STT/TTS lifecycle |

### 7.2 State Management (`src/store/jarvisStore.ts`)

Zustand store with:

- Connection state (`isConnected`, `connectionStatus`)
- Language preference (`en` | `hi`)
- System status snapshot
- Pending confirmation payload
- Settings (persisted)
- Command history

### 7.3 Service Layer

| Service | File | Role |
|---------|------|------|
| `apiClient` | `services/apiClient.ts` | Typed REST (zero `any`) |
| `websocketService` | `services/websocketService.ts` | WS connect/reconnect |
| `voiceService` | `services/voiceService.ts` | Web Speech STT/TTS |

### 7.4 Type System (`src/types/api.ts`)

- 350+ interfaces mirroring backend Pydantic models.
- Enables compile-time validation of all API responses.
- Paired with Zod schemas where runtime validation needed.

### 7.5 Key Components

| Component | Technical Role |
|-----------|----------------|
| `MainHUD.tsx` | Layout orchestrator |
| `ArcReactor.tsx` | Voice activation visual |
| `useJarvisBridge.ts` | WS message routing |
| `SystemDiagnostics.tsx` | Live resource HUD |
| `VisionOverlay.tsx` | OCR result overlay |
| `PerformanceHistory.tsx` | Charts from `performance_metrics` |
| `SecurityDashboard.tsx` | Process guardian UI |
| `QuickResponses.tsx` | Proactive + quick commands |
| `MobileDashboard.tsx` | Cross-device telemetry |

### 7.6 Voice Pipeline

```
Microphone → Web Speech API (STT)
    → sendCommand(text, language)
    → Backend parse + execute
    → CommandResponse
    → voiceService.speak(response, language)
         └── Hinglish: lower pitch, slower rate
```

---

## 8. API Design

### 8.1 Base URLs

| Type | URL |
|------|-----|
| REST (v1) | `http://localhost:8000/api/v1` |
| REST (legacy) | `http://localhost:8000/api/...` |
| WebSocket | `ws://localhost:8000/ws` |

### 8.2 Standard Response Envelope

```json
{
  "success": true,
  "action_type": "COMMAND_NAME",
  "response": "Human-readable message",
  "data": {},
  "error": null
}
```

**Pydantic strict mode** on `BaseResponse` and `CommandRequest`:

```python
ConfigDict(strict=True, extra='forbid')
```

### 8.3 Authentication

- Header: `X-API-Key: <BACKEND_API_KEY>` (matches `VITE_JARVIS_API_KEY` in frontend `.env`).
- Missing/invalid key → HTTP 401 on protected routes.

### 8.4 WebSocket Message Types

| Type | Direction | Payload |
|------|-----------|---------|
| `command` | Client → Server | `{ text, language }` |
| `command_response` | Server → Client | `CommandResponse` |
| `system_status` | Server → Client | CPU/memory/battery snapshot |
| `proactive_suggestion` | Server → Client | Suggestion object |
| `confirm` | Client → Server | `{ confirmation_id }` |

**Serialization:** All broadcasts pass through `jsonable_encoder` to prevent datetime/UUID crashes.

### 8.5 Rate Limiting

- Default: **200 requests/minute** per IP (SlowAPI).
- Configurable via limiter instance in `main.py`.

---

## 9. Data Design

### 9.1 Database (`data/memory.db`)

**Engine:** PostgreSQL with asyncpg connection pool and pgvector extension (`backend/utils/database.py`).

### 9.2 Schema (Migration 001)

| Table | Purpose |
|-------|---------|
| `conversations` | User input + JARVIS response log |
| `memory` | Key-value facts with category/confidence |
| `sessions` | Session metadata and command counts |
| `performance_metrics` | Event-loop lag, CPU, memory snapshots |

**Indexes:** `timestamp`, `session_id`, `command_type`, `category`, `key`.

### 9.3 JSON Data Files

| File | Purpose |
|------|---------|
| `backend/data/contacts.json` | WhatsApp contact aliases |
| `backend/data/macros.json` | User automation macros |
| `backend/data/scheduled_tasks.json` | Cron-like tasks |
| `memory/*.md` | Persistent personality/user/decisions context |

### 9.4 Semantic Memory Retrieval

```
User query
  → Tokenize + fuzzy score (rapidfuzz)
  → Keyword intersection with memory node headers
  → Rank nodes by composite score
  → Inject top-N into LLM system prompt
```

---

## 10. Security Design

| Control | Implementation |
|---------|----------------|
| API key auth | `BACKEND_API_KEY` env; middleware check |
| Dangerous commands | `DANGEROUS_COMMANDS` set in `config/commands.py` |
| Confirmation flow | `confirmation_id` + 30s timeout |
| Rate limiting | SlowAPI 200/min |
| Input validation | Pydantic strict models |
| Secret management | `.env` only; `.env.example` template |
| Process monitoring | `security.py` Process Guardian |
| CORS | Whitelist `FRONTEND_URL` + dev localhost |
| SSL | Verified on external HTTP (httpx) |

**Threat model notes:**

- Backend runs locally with OS-level privileges—user must trust the installation.
- WhatsApp automation is brittle to UI changes; no credential storage in repo.

---

## 11. Performance Design

### 11.1 Async Migration (v3.4.1+)

All blocking operations wrapped:

```python
result = await asyncio.to_thread(blocking_function, *args)
```

**Applies to:** OCR, filesystem scans, pyautogui, window enumeration.

### 11.2 Event Loop Monitoring

- `monitor_event_loop_lag()` background task.
- Metrics saved to `performance_metrics` every 5 seconds.
- Frontend `PerformanceHistory` visualizes trends.
- High lag triggers HUD glitch/vibrate effects.

### 11.3 Database Optimization

- Connection pool (no per-query open/close).
- pgvector extension for native vector similarity search.
- Migration runner for schema versioning.

### 11.4 Targets

| Metric | Target |
|--------|--------|
| Simple command latency | < 500ms backend processing |
| WS broadcast interval | Configurable (status loop) |
| Event-loop lag | < 50ms average under normal load |

---

## 12. Configuration

### 12.1 Environment Variables (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_PORT` | `8000` | FastAPI listen port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS origin |
| `LLM_PROVIDER` | `nvidia` | Primary LLM |
| `BACKEND_API_KEY` | — | API authentication |
| `WAKE_WORD_ENABLED` | `true` | Voice wake |
| `DATABASE_URL` | `postgresql+asyncpg://user:pass@localhost:5432/jarvis` | Persistence |
| `REDIS_ENABLED` | `true` | Optional cache |

Full template: [`.env.example`](.env.example).

### 12.2 Centralized Version

```python
# backend/config/environment.py
VERSION = "3.9.1"
```

Referenced by `main.py`, OpenAPI metadata, and frontend via `/api/health`.

---

## 13. Deployment

### 13.1 Development

```bash
# Terminal 1 — Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
npm install
npm run dev
```

### 13.2 Production Build

```bash
npm run build          # → dist/
# Serve dist/ via FastAPI StaticFiles or nginx
# Run uvicorn with WORKERS=4
```

### 13.3 Docker

`docker-compose.yml` orchestrates backend + optional Redis.

### 13.4 CI Pipeline

| Job | Platform | Steps |
|-----|----------|-------|
| `backend` | windows-latest | pytest + coverage |
| `frontend` | windows-latest | `npm ci`, `tsc`, `vitest`, `vite build` |

Python **3.12**, Node **20** in CI (project supports 3.11+ / 18+).

---

## 14. Testing Strategy

### 14.1 Backend (`backend/tests/`)

| File | Coverage |
|------|----------|
| `test_command_handler.py` | Dispatch routing, dangerous cmds |
| `test_memory.py` | DB operations, pooling |
| `test_bilingual_parser.py` | Hindi normalization |
| `conftest.py` | Mocked asyncpg.Pool fixtures |

**Run:** `pytest tests/ -v --cov=.`

### 14.2 Frontend (`src/__tests__/`)

| File | Coverage |
|------|----------|
| `apiClient.test.ts` | Typed client methods |

**Run:** `npm test` (Vitest)

### 14.3 Manual QA Checklist

- [ ] Voice command in English and Hinglish
- [ ] Shutdown confirmation flow
- [ ] WebSocket reconnect after backend restart
- [ ] Dashboard panels with empty API data
- [ ] OCR on image + screen capture
- [ ] WhatsApp contact fuzzy match

---

## 15. Error Handling

| Layer | Strategy |
|-------|----------|
| HTTP middleware | Catch-all 500 → `{ success: false, error }` |
| Command handler | Try/except per action; bilingual error messages |
| Frontend | `ErrorBoundary.tsx` + toast notifications |
| WebSocket | Auto-reconnect with exponential backoff |
| Database | Self-healing schema validation on init |

---

## 16. Observability

| Signal | Mechanism |
|--------|-----------|
| Structured logs | `utils/logger_structured.py` |
| System events | `log_system_event("STARTUP", ...)` |
| Performance DB | `performance_metrics` table |
| Response timing | `X-Response-Time` header |
| Command history | `conversations` table + `HistoryLog.tsx` |

---

## 17. Extension Points

| Extension | How to Add |
|-----------|------------|
| New voice command | Add to `config/commands.py` → route in `command_handler.py` → implement in module |
| New API endpoint | Create handler in module → add route in `routers/*.py` |
| New UI panel | Component in `src/components/` → wire in `MainHUD` or `AdvancedTools` |
| New LLM provider | Extend `modules/llm.py` with provider adapter |
| New memory category | Insert into `memory` table; optional `memory/*.md` node |

---

## 18. Known Limitations

| Limitation | Detail |
|------------|--------|
| Browser STT variance | Quality depends on Chrome/Edge locale packs |
| Windows-first automation | pywin32, pycaw, WMI are Windows-only |
| WhatsApp fragility | UI automation breaks on WhatsApp updates |
| Local-only trust model | Backend has full OS access |
| No built-in auth server | Single API key, not multi-user RBAC |

---

## 19. Dependency Graph (Simplified)

```mermaid
flowchart LR
    main --> routers
    routers --> modules
    modules --> utils
    modules --> config
    command_handler --> modules
    command_handler --> bilingual_parser
    websocket --> command_handler
    proactive --> llm
    proactive --> context
    memory --> database
    llm --> memory
```

---

## 20. Version History (Technical)

| Version | Technical Milestone |
|---------|---------------------|
| 3.4.1 | Async-first migration, event-loop monitor |
| 3.4.2 | Centralized VERSION, performance_metrics DB |
| 3.5.0 | ProactiveManager + WebSocket suggestions |
| 3.6.0 | Semantic memory retrieval (rapidfuzz) |
| 3.7.1 | 90-command routing parity, bilingual keys |
| 3.8.0 | Typed API client, DB pooling, CI pipeline, dashboard hardening |
| 3.9.0 | Autonomous Agentic Loop, Mobile Telemetry, Neural Feedback Loop, Trace Auditing |
| 3.9.1 | CodeQL SAST fix: bad HTML regex, incomplete sanitization, information exposure — zero high/medium findings |

---

## 21. References

- [PRD.md](PRD.md) — Product requirements
- [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) — Endpoint reference
- [docs/SETUP.md](docs/SETUP.md) — Environment setup
- [BACKEND_FRONTEND_SYNC.md](BACKEND_FRONTEND_SYNC.md) — API parity notes
- [backend/migrations/001_initial.sql](backend/migrations/001_initial.sql) — DB schema
- [memory/decisions.md](memory/decisions.md) — ADR log

---

*This document is the single source of truth for **how** JARVIS is implemented. Product intent lives in [PRD.md](PRD.md).*
