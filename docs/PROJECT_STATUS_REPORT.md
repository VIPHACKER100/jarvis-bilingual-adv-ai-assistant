# Project Status Report — JARVIS Bilingual AI Assistant

**Date:** 2026-09-11 · **Version:** 4.0.0-alpha.4 · **Branch audited:** `main` (origin default is `v2`)
**Method:** Two full codebase sweeps (backend ~11.2k LOC Python, frontend ~4.8k LOC TS), plus live verification: backend test suite executed (36/36 pass), every P0 defect below confirmed by direct code inspection.

---

## 1. Executive Summary

JARVIS is a bilingual (English / Hindi / Hinglish) voice-and-text desktop automation assistant: a FastAPI backend that parses commands and drives OS automation (volume, windows, files, screenshots, OCR/PDF, WhatsApp), with an LLM agent fallback (OpenRouter / OpenAI / NVIDIA NIM / Gemini / Ollama), and a React 19 + Vite + TypeScript frontend being rebuilt from the FRD blueprint.

**Overall verdict: strong architecture and hygiene, but the project ships unverified critical paths.** Four runtime-breaking defects sit on core flows — volume/mute/brightness commands misreport, the dangerous-command confirmation endpoint 500s, the LLM agent fallback is completely dead, and the WebSocket confirmation feature crashes. CI cannot catch any of this because the backend test job is `continue-on-error` and none of the broken modules have tests. The frontend is modern and strictly typed but has a large orphaned feature surface (voice, agent chat, streaming) and a WebSocket hook that disconnects permanently after the first re-render.

### Health Scorecard

| Area | Grade | Summary |
|---|---|---|
| Backend architecture | **A−** | Clean modular split, async-first, strict Pydantic v2, stdlib SQLite |
| Backend code hygiene | **B+** | Zero TODO/FIXME, zero bare `except`, strong typing; 2 blocking-call violations, some duplication |
| Backend correctness | **D** | 7 confirmed runtime defects, concentrated in security/confirmation/agent paths |
| Test suite | **C+** | 36/36 pass, but every broken path is untested; several vacuous assertions |
| CI/CD | **C** | Real security scanning (pip-audit, Trivy, CodeQL) but test jobs can't fail, one job builds a nonexistent Dockerfile |
| Frontend code | **B** | Strict TS (near-zero `any`, zero TODOs), clean layering; WS reconnect bug + dead feature surface |
| Security posture | **C+** | Good primitives (constant-time keys, rate limits, parameterized SQL) but localhost auth bypass + dangerous defaults |
| Documentation | **B+** | API doc verified to match all 39 endpoints; 3 known inaccuracies around confirmation flow |

---

## 2. Verification Performed (this audit)

- ✅ **Backend tests: 36/36 pass** (`pytest backend/tests/`, Python 3.13, 38s) — README claim confirmed. Note: `pytest-asyncio` and `aiofiles` (both declared in `backend/requirements.txt`) had to be installed first — the active environment was incomplete.
- ❌ **Frontend not runnable in this clone:** `node_modules` is absent; `npm run dev` / `build` / `typecheck` cannot execute until `npm install`. CI does run typecheck + build (Node 18/20/22), so the source is CI-verified but not locally verified.
- ✅ Each P0 defect in §5 was confirmed by direct code inspection — not inherited from tooling output.

> **Update (2026-09-11, later the same day):** Phase 0 of the fix plan has been implemented. All P0 defects are fixed and guarded by 22 new regression tests (backend suite now **53/53**, frontend **5/5** via newly added vitest). Two additional latent bugs were found and fixed during implementation: `GET /pending` called a nonexistent `security.get_pending_actions()` (500), and `agent.py:37` called `get_neural_context()` on the wrong object (crashed `run_loop` before the LLM was ever reached). See [UPGRADE_AND_FIX_PLAN.md](UPGRADE_AND_FIX_PLAN.md) Phase 0.

---

## 3. Project Snapshot

| | |
|---|---|
| Backend | FastAPI, ~11,200 LOC — 7 routers, 23 modules, 8 utils, 6 test files + conftest |
| Frontend | React 19 + Vite 6 + TS 5.9 (strict) + Tailwind 4 + Zustand 5 + RRD 7 — 44 files, ~4,800 LOC |
| API surface | 37 REST endpoints + 2 WebSockets, all under `/api/v1`, `X-API-Key` auth (health exempt) |
| Database | Stdlib `sqlite3` via `utils/database.py` (WAL, `asyncio.to_thread`), no migrations by design |
| LLM providers | OpenRouter, OpenAI, NVIDIA NIM, Google Gemini, Ollama (single unified client) |
| Auth | API key middleware + localhost bypass; WS key via query string |
| CI | GitHub Actions: ruff, pip-audit (strict), Trivy, CodeQL, typecheck + build matrix, docker builds |
| Branches | Working branch `main`; origin default is `v2` (divergent — PRs target `v2` per repo config) |

---

## 4. What's Working Well

- **Async discipline:** near-exemplary use of `asyncio.to_thread` for all blocking I/O (DB, psutil, file ops).
- **Input validation:** Pydantic v2 with `extra="forbid"`, strict-mode base models, 500-char command caps, language-pattern validation.
- **Security primitives done right:** constant-time API-key comparison everywhere, centralized key resolution, security-headers middleware, 512 KB body cap, per-route rate limits, parameterized SQL throughout, direct-socket IP (X-Forwarded-For not trusted).
- **Zero debt markers:** no TODO/FIXME/HACK in backend or frontend; no bare `except:` anywhere.
- **Genuinely strict TypeScript:** `strict`, `noUncheckedIndexedAccess`, `noUnusedLocals`, etc. — and the code complies. Only 5 `any`s (all in the untyped Web Speech API hook).
- **Honest documentation:** `docs/API_DOCUMENTATION.md` was cross-checked endpoint-by-endpoint — all 39 documented routes exist and behave as described (3 exceptions noted in §8).
- **Real CI security scanning:** pip-audit `--strict`, Trivy, CodeQL, dependabot — more than most hobby projects ever have.

---

## 5. Critical Defects (P0) — verified, runtime-breaking

### 5.1 Volume / mute / brightness commands misreport as failures

`utils/logger_structured.py:25` defines `log_command(cmd, cmd_type, success)` with **3 parameters**, but `modules/system.py:269, 291, 312, 354, 371` call it with a **4th dict argument** → `TypeError` on every call. The broad `except` at e.g. `system.py:276-281` swallows it, so the API returns `"command_not_understood"` **even when the OS action succeeded**. The user hears "I didn't understand" while the volume changes.

### 5.2 Dangerous-action confirmation endpoint returns 500

`modules/security.py:100-105` (`confirm_command`) calls `log_command(..., details=...)` — same signature mismatch, but this call is **not** inside any try/except, and `routers/commands.py:29-36` has no error handling → `POST /api/v1/confirm/{id}` (the approval path for shutdown etc.) raises **500 every time**.

### 5.3 LLM agent fallback is completely dead

`modules/llm_client.py:160` creates the real client: `llm_client = LLMClient()` (has `.chat`). Then `modules/llm_wrapper.py:158` **rebinds the name**: `llm_client = llm_module` (an `LLMModule` instance with no `.chat` — verified). So `get_agent_response()` (`llm_wrapper.py:146-155`) calls `llm_client.chat(...)` on itself → `AttributeError`. `modules/agent.py:39,52` imports exactly this broken name; the error is caught and retried with backoff for `MAX_ITERATIONS=5`, so **every query that falls back to the agent ends in "couldn't reach a final conclusion."** The flagship AI feature does not work.

### 5.4 WebSocket "confirmation" message type crashes the connection

`routers/websocket.py:95` reads `message.data`, but `WebSocketMessage` (`models.py:437-443`) has **no `data` field** (extras are ignored, not stored) → `AttributeError` → caught at `websocket.py:126` → **connection dropped**. This is documented as a working feature in `docs/API_DOCUMENTATION.md:116`.

### 5.5 Approving a dangerous command never executes it

`security.register_callback()` (`modules/security.py:125`) is **never called anywhere**; `confirm_command()` only flips a status flag. In the command flow, `system_module.shutdown()` is always invoked without `confirmed=True` (`command_handler.py:42-47` → `system.py:203-211`). The entire confirmation design has no execution path behind it — approval records a decision and nothing happens.

### 5.6 Agent system prompt never receives tools/context

`AGENT_SYSTEM_PROMPT` (`llm_wrapper.py:17-42`) contains `{{tools_context}}` / `{{neural_context}}` (escaped braces), so the `.format()` at `llm_wrapper.py:147` only unescapes them — the agent operates with **no tool list and no memory context** even once 5.3 is fixed.

### 5.7 Frontend WebSocket permanently disconnects after first re-render

`src/hooks/useWebSocket.ts`: `connect`'s dependency array includes `options` (line 118); `HomePage` passes an inline options object (`Home.tsx:52-65`), so `connect` gets a new identity every render → the effect (`useWebSocket.ts:147-152`) re-runs → `disconnect()` sets `retriesRef.current = MAX_RETRIES` (line 129) → the guard at line 36 blocks all future reconnects. Related: WS `notification` messages produce **duplicate toasts** (hook at `useWebSocket.ts:72-78` and `Home.tsx:57-59` both call `addNotification`), and the returned `isConnected` is a non-reactive snapshot (`useWebSocket.ts:156`).

---

## 6. High-Priority Issues (P1)

### CI cannot gate quality

| Issue | Evidence |
|---|---|
| Backend test job is `continue-on-error: true` — failures never fail CI | `.github/workflows/ci.yml:134` (also 51, 86) |
| `mypy` installed in CI but never run | `ci.yml:74` |
| Docker job builds `Dockerfile.frontend` — **file does not exist** (job always fails) | `ci.yml:184` |
| Frontend job runs `npx vitest run` — vitest is **not in package.json** and there are **0 test files** (job cannot pass) | `ci.yml:112` |
| Two docker-build jobs duplicate `Dockerfile.backend` | `ci.yml:174, 237` |

### Security posture (dev-first; unsafe beyond localhost)

1. **Total auth bypass on loopback.** Server binds `127.0.0.1` (`main.py:386`) and every auth path skips localhost IPs (`main.py:190-193`, `utils/middleware_security.py:186-188`, `routers/websocket.py:33`, `routers/audio.py:43`) → **every request is exempt**. Any local process can drive shutdown, file deletion, and process kill without a key. Acceptable for a single-user dev tool; unacceptable before any LAN/Docker exposure (`Dockerfile.backend:48` already binds `0.0.0.0`).
2. **`ENABLE_DANGEROUS_COMMANDS` defaults to `true`** (`config/defaults.py:20`).
3. **Hardcoded `PAIRING_SECRET` fallback** `"JARVIS-SECRET-KEY"` (`config/environment.py:48`), shipped in `.env.example:40`.
4. **API keys written to `.env` and hot-injected into `os.environ` via unauthenticated-on-localhost API** (`routers/settings.py:70-134`).
5. **WS API key in query string** (`websocket.py:23`, `audio.py:24`) — leaks into logs/proxies.
6. **SQLi filter false-positives break the product:** any body containing `DELETE|DROP|INSERT|EXEC|TRUNCATE` is 400-rejected (`middleware_security.py:20-23`) — so the command "delete file X" never reaches the command system.
7. **`shell=True` with interpolation:** `modules/desktop.py:364-368` (AppleScript, only double quotes sanitized — a single quote in a title/message breaks out) and `window_manager.py:243-246` (`start "", app_name`).
8. **Pairing token compared with `==`,** not constant-time (`websocket.py:43`).
9. **Quarantine endpoint can kill any PID** with only `logger.info` for audit (`routers/system.py:186-190` → `system.py:562-581`).
10. Minor: rate-limiter buckets never evicted (`middleware_security.py:144-155`); body cap trusts `Content-Length` only so chunked requests bypass it (`middleware_security.py:133-138`).

### Correctness / reliability (P1)

- Blocking sync file I/O inside async paths: `routers/system.py:132`, `modules/command_handler.py:275` (inconsistent with `routers/settings.py:62`, which does it right).
- `DatabaseManager.fetchval()` never closes its connection — one leaked connection per call (`utils/database.py:186-188`).

---

## 7. Dead Weight & Cleanup Items (P2)

**Backend**

- Stale scripts with broken imports: `scripts/audit_project.py:77`, `scripts/quick_parser_audit.py:6` (import `config.commands`, which no longer exists; the latter also reads a deleted `handlers/` file).
- Dead code: try/except-pass at `main.py:141-148`; `security.is_dangerous()` never called; duplicate import `routers/commands.py:32`.
- Duplication: localhost-bypass check copy-pasted in 4 places; DB schema duplicated in `tests/conftest.py:24-61` and already **drifted** from `utils/database.py:24-88`; `llm_wrapper.py` largely shadows `llm_client.py`.
- Artifacts: leftover third-party URL `"HTTP-Referer": "https://aryanahirwar.in"` (`llm_wrapper.py:82`) vs developer `VIPHACKER100` (`main.py:378`); mDNS advertises version `"3.9.0"` (`utils/mdns.py:35`) vs actual `4.0.0-alpha.4`; `OTEL_ENABLED` residue in `logger_structured.py:31`.

**Dependencies**

- Dead in `backend/requirements.txt:11-13`: `asyncpg`, `alembic`, `sqlalchemy` — the DB is stdlib sqlite3 (installed by CI for nothing).
- Deprecated in `requirements-prod.txt`: `PyPDF2==3.0.1` (→ `pypdf`), `fuzzywuzzy==0.18.0` (redundant — `rapidfuzz` already pinned), `google-generativeai==0.8.6` (→ `google-genai`), `win10toast==0.9` (unmaintained).
- `.baseline` files are the pre-bump dependency snapshots used by the pip-audit baseline — intentional, keep.

**Frontend**

- Entire features written but **never wired**: agent chat + SSE streaming (`src/api/agent.ts`, `src/hooks/useSSE.ts`), voice input/TTS (`useSpeechRecognition.ts`, `useTextToSpeech.ts` — advertised in the page title, and recognition is hardcoded `en-US` so Hindi voice can't work), a second notification service (`services/notifications.ts`), `ui/Modal.tsx`, `ui/Tooltip.tsx`.
- `uuid` + `@types/uuid` in package.json — **zero imports** (code uses `crypto.randomUUID()`).
- `index.html:26-58` dead inline CSS (`.scanline`, `.hologram-text`, …) and a second font stack (Orbitron/Share Tech Mono) conflicting with `styles/index.css` (Inter/JetBrains Mono/Rajdhani).
- PWA is broken: `manifest.json` references `/icons/icon-192x192.png` and `/icons/icon-512x512.png` — neither exists; `favicon.ico` referenced at `index.html:21` is missing; no service worker.
- No ESLint (only Prettier; the `lint` script is really typecheck + format check). No test runner. `@` path alias configured but unused.

---

## 8. Test & Documentation Status

**Tests (36/36 backend passing):** parser (10), command dispatch (8), v4 smoke (8), memory DB (6), API (2), config (2). Well-built conftest with temp DB + mock fixtures.

**Coverage gaps — every P0 path is untested:** security confirmation lifecycle, settings `.env` key writes, system power/volume endpoints, both WebSocket handlers, agent loop, `llm_client.py`. That is exactly why §5 shipped. Vacuous patterns to fix: `status_code in (200, 403)` assertions (`test_api.py:16`, `test_v4.py:44,52,81`) and a `/health` 404 that passes its assertions (`test_v4.py:65`).

**Frontend:** 0 tests, no runner, no ESLint. Typecheck/build are CI-verified.

**Docs:** API doc matches all 39 endpoints (verified). Inaccuracies: WS confirmation documented but broken (§5.4); `/confirm/{id}` documented as executing the action — it doesn't (§5.5); `/settings/test-key` documented as simulated — correct.

---

## 9. Immediate Recommendations (TL;DR)

1. **Fix the 7 P0 defects** (§5) — mostly small, surgical diffs; the product's headline features (agent, confirmations, voice feedback) don't work without them. → [UPGRADE_AND_FIX_PLAN.md](UPGRADE_AND_FIX_PLAN.md), Phase 0.
2. **Make CI able to fail:** remove the three `continue-on-error` flags, fix or delete the `Dockerfile.frontend` job, add vitest or drop the frontend test job.
3. **Test what you fixed:** add regression tests for confirmation flow, volume endpoints, WS messages, and the agent loop before touching anything else.
4. **Decide the security boundary now:** today's localhost-bypass + `ENABLE_DANGEROUS_COMMANDS=true` is fine for solo dev on loopback, and must be revisited before Docker/LAN (the Docker image already binds `0.0.0.0`).
5. **Wire or cut the orphaned frontend features** (voice, agent chat/streaming) — they're the product's selling points and are 80% written.
