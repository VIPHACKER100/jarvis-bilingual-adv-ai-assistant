# Contributing to JARVIS

Guide for contributors to the JARVIS Bilingual AI Assistant project.

---

## Development setup

```bash
# Clone the repository
git clone https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant.git
cd jarvis-bilingual-adv-ai-assistant

# Backend
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Frontend
cd ..
npm install
```

### Environment variables

Copy `.env.example` to `.env` and configure:

```bash
# Authentication (must match between backend and frontend)
BACKEND_API_KEY=your-secure-api-key-here
VITE_JARVIS_API_KEY=your-secure-api-key-here  # Must match BACKEND_API_KEY for WebSocket auth

# Database
DATABASE_URL=postgresql+asyncpg://jarvis:jarvis_dev_password@localhost:5432/jarvis

# LLM Providers
NVIDIA_API_KEY=your-key-here
OPENROUTER_API_KEY=your-key-here
OPENAI_API_KEY=your-key-here

# Logging
LOG_LEVEL=DEBUG
```

### Running the project

```bash
# Backend
cd backend
python -m uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
npm run dev
```

---

## Project structure

```
jarvis-bilingual-adv-ai-assistant/
├── backend/
│   ├── main.py                 # FastAPI app + lifespan + background tasks
│   ├── config.py               # Re-exports from config/ package
│   ├── config/
│   │   ├── environment.py      # Version, paths, platform detection
│   │   ├── commands.py         # Command definitions
│   │   ├── responses.py        # Bilingual response templates
│   │   └── defaults.py         # Default configuration values
│   ├── models.py               # Pydantic request/response models
│   ├── routers/                # FastAPI APIRouter modules (one per domain)
│   ├── handlers/               # Command handler logic
│   ├── modules/                # Business logic (memory, LLM, RAG, etc.)
│   │   ├── llm_gateway/        # Unified LLM provider gateway
│   │   │   ├── gateway.py      # Main entry point
│   │   │   ├── adapters.py     # Provider adapters (OpenAI, Google, Ollama)
│   │   │   ├── cost.py         # Token usage and cost tracking
│   │   │   └── circuit.py      # Circuit breaker pattern
│   │   ├── rag/                # Retrieval-Augmented Generation pipeline
│   │   │   ├── pipeline.py     # RAG orchestration
│   │   │   ├── search.py       # Hybrid search (keyword + semantic)
│   │   │   └── embeddings.py   # Embedding service
│   │   ├── memory.py           # Memory and conversation management
│   │   ├── proactive.py        # Background proactive suggestions
│   │   └── ...                 # Other domain modules
│   ├── utils/
│   │   ├── database_async.py   # PostgreSQL async pool (asyncpg)
│   │   ├── database.py         # SQLite compatibility layer
│   │   ├── logger_structured.py # Structured logging (structlog + OTEL)
│   │   ├── websocket_manager.py
│   │   └── middleware_security.py
│   ├── migrations/             # Database migration scripts
│   └── tests/                  # pytest test suite
├── src/                        # React + TypeScript frontend
├── memory/                     # Persistent memory nodes (Markdown)
├── docs/                       # Project documentation
└── .opencode/agents/           # AI agent definitions
```

---

## Coding standards

### Python (Backend)

- **Python 3.11+** required
- **Async-first**: All I/O functions must be `async`. Use `asyncio.to_thread()` for blocking work.
- **Type hints**: All function signatures must have complete type annotations.
- **Docstrings**: Module-level docstrings required. Function docstrings for public APIs.
- **Linting**: Ruff with project defaults in `pyproject.toml`. Run `ruff check backend/` before committing.
- **Imports**: Sorted with `ruff` auto-fix. No `from X import *`.

### TypeScript (Frontend)

- **Strict mode** enabled (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- **Named exports** only — no default exports for internal components
- **Interface-based typing** — no `any` casts
- **Build check**: Run `npm run check` (TypeScript + Vite build) before committing

### Markdown (Documentation)

- **ATX headings** (`#`, `##`) — never Setext underlines
- **Blank lines** before and after headings, lists, and code fences
- **Fenced code blocks** with language tags
- **Linting**: Run `markdownlint` with `.markdownlint.json` rules

---

## Async code standards

### Rule 1: Every I/O function must be async

```python
# ✅ Correct
async def get_user_data(user_id: int) -> Optional[dict]:
    return await db_manager.fetchone("SELECT * FROM users WHERE id = $1", user_id)

# ❌ Incorrect
def get_user_data(user_id: int) -> Optional[dict]:
    return db_manager.fetchone_sync("SELECT * FROM users WHERE id = ?", user_id)
```

### Rule 2: Offload blocking work to threads

```python
# ✅ Correct
async def process_image(path: Path) -> bytes:
    def _process():
        img = Image.open(path)
        return img.tobytes()
    return await asyncio.to_thread(_process)

# ❌ Incorrect
async def process_image(path: Path) -> bytes:
    img = Image.open(path)  # Blocks the event loop!
    return img.tobytes()
```

### Rule 3: Use context managers for database connections

```python
# ✅ Correct
async with db_async.connection() as conn:
    row = await conn.fetchrow("SELECT ...")

# ❌ Incorrect
conn = await db_async._pool.acquire()
# If exception occurs here, connection is leaked
```

### Rule 4: Use return_exceptions=True in gather

```python
# ✅ Correct — independent tasks don't cancel each other
results = await asyncio.gather(
    get_cpu(), get_memory(), get_disk(),
    return_exceptions=True
)

# ❌ Incorrect — one failure cancels all
results = await asyncio.gather(get_cpu(), get_memory(), get_disk())
```

### Rule 5: Never use time.sleep() or requests in async code

```python
# ✅ Correct
await asyncio.sleep(5)
async with httpx.AsyncClient() as client:
    resp = await client.get(url)

# ❌ Incorrect
time.sleep(5)  # Blocks everything
resp = requests.get(url)  # Blocks everything
```

---

## Performance testing requirements

### What to measure

| Metric | Tool | Threshold |
|--------|------|-----------|
| Event loop lag | Built-in `monitor_event_loop_lag` | <100ms |
| API response time | `X-Response-Time` header | <200ms (P95) |
| LLM latency | `cost_tracker.stats()` | <5s (provider-dependent) |
| Database query time | PostgreSQL `log_min_duration_statement` | <50ms (P95) |
| Frontend bundle size | `vite build` output | <500KB (lazy) |

### Running performance tests

```bash
# Backend test suite
cd backend
pytest tests/ -v --tb=short

# Frontend test suite
npm test

# Full build check
npm run check  # TypeScript + Vite build

# Ruff lint
ruff check backend/
```

### Adding performance-sensitive code

When adding code that affects latency:

1. **Add timing instrumentation** during development:

```python
import time
start = time.perf_counter()
# ... your code ...
elapsed_ms = (time.perf_counter() - start) * 1000
logger.debug(f"YourOperation completed in {elapsed_ms:.1f}ms")
```

2. **Benchmark critical paths** with realistic data sizes
3. **Test with event loop lag monitor active** — verify lag stays under 100ms
4. **Document performance characteristics** in the PR description

---

## Code review checklist for performance

Before approving a PR, verify:

### Async correctness

- [ ] No `time.sleep()`, `requests.*`, `subprocess.run`, or synchronous file I/O in async functions
- [ ] All `asyncio.gather` calls use `return_exceptions=True` for independent tasks
- [ ] All coroutines are properly `await`ed
- [ ] Background tasks use `asyncio.create_task()` and are tracked or intentionally fire-and-forget

### Database

- [ ] Database connections use context managers (`async with`)
- [ ] No database connections held across LLM calls or other slow operations
- [ ] Queries include `LIMIT` clauses for unbounded result sets
- [ ] New tables have appropriate indexes

### Memory

- [ ] No unbounded data structures (lists, dicts) that grow with request count
- [ ] Large objects are explicitly deleted or scoped to context managers
- [ ] No circular references in long-lived objects

### LLM

- [ ] Token limits are appropriate for the use case
- [ ] Cost tracking records are bounded (if applicable)
- [ ] Circuit breaker state is checked before making calls

### Monitoring

- [ ] New endpoints log at appropriate levels
- [ ] Error cases are logged with context (not silently swallowed)
- [ ] Performance-sensitive operations include timing metrics

---

## Testing standards

### Backend (pytest)

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=backend --cov-report=term-missing

# Run specific test file
pytest tests/test_memory.py -v
```

- All tests must pass before merging
- New features must include tests
- Mock external dependencies (LLM providers, database)
- Use fixtures in `conftest.py` for shared setup

### Frontend (vitest)

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

- All tests must pass before merging
- Component tests should cover key user interactions
- API client tests should mock HTTP responses

---

## Commit message format

Follow conventional commits:

```
<type>(<scope>): <description>

[optional body]
```

**Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

**Examples:**

```
feat(llm): add Google Gemini adapter to LLM Gateway
fix(memory): prevent conversation pruning from deleting active session entries
docs(performance): add pgvector optimization guide
refactor(adapters): collapse 3 OpenAI-compatible adapters into one
test(memory): add unit tests for neural context retrieval
perf(rag): cache embedding results for repeated queries
```

---

## Pull request process

1. Create a feature branch from `main`
2. Make changes following the coding standards above
3. Run the full test suite: `pytest tests/ -v && npm test && npm run check`
4. Ensure linting passes: `ruff check backend/`
5. Write a clear PR description explaining the change and its motivation
6. Request review from a maintainer
7. Address review feedback
8. Squash-merge into `main`

---

## Related documents

- [Performance Optimization Guide](PERFORMANCE_GUIDE.md)
- [Troubleshooting Performance](TROUBLESHOOTING_PERFORMANCE.md)
- [API Documentation](API_DOCUMENTATION.md)
- [Setup Guide](SETUP.md)
