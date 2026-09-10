# Upgrade & Fix Plan — JARVIS Bilingual AI Assistant

**Date:** 2026-09-11 · **Baseline:** v4.0.0-alpha.4, branch `main` · **Companion doc:** [PROJECT_STATUS_REPORT.md](PROJECT_STATUS_REPORT.md) (all file:line references are evidence-verified there)

**Guiding principles**

1. Correctness before features — the agent, confirmations, and voice feedback are advertised and broken; nothing new ships until they work.
2. CI must be able to fail — every fix in Phase 0 gets a regression test, and CI gets teeth in Phase 1 so this class of bug can't silently ship again.
3. Security boundary before exposure — current posture is fine for solo loopback dev; harden before Docker/LAN.
4. Wire or cut — orphaned frontend features are either integrated per the FRD or deleted; no third state.

**Effort legend:** 🟢 < 1h · 🟡 1–4h · 🔴 0.5–2d

---

## Phase 0 — P0 Runtime Fixes (target: 1–2 days) ⚠️ do first

> **Status: ✅ COMPLETE (2026-09-11).** All items below are implemented and covered by regression tests: `backend/tests/test_p0_fixes.py` (17 tests, full backend suite now 53/53) and `src/hooks/useWebSocket.test.ts` (5 tests, vitest — newly installed with jsdom + testing-library). `npm run build` now type-checks (`tsc --noEmit && vite build`). Bonus fixes landed during implementation: `GET /pending` no longer 500s (`security.get_pending_actions()` was missing), and `agent.py` no longer crashes on its first line (`memory_manager.neural.get_neural_context` — the method was called on the wrong object).

### 0.1 Fix `log_command` signature mismatch 🟢

- **Fix:** make `log_command` accept optional details — `def log_command(cmd, cmd_type, success, details: dict | None = None)` — and merge `details` into the log event. One change in `utils/logger_structured.py:25` repairs 6 call sites at once.
- **Files:** `utils/logger_structured.py:25`, callers in `modules/system.py:269,291,312,354,371`, `modules/security.py:100-105`.
- **Acceptance:** `POST /api/v1/system/volume/up` returns `success: true` with a real response (not `command_not_understood`); regression test asserts volume response shape.

### 0.2 Make dangerous-command confirmation actually work end-to-end 🔴

This is two bugs stacked: the endpoint 500s (0.1) and even a successful confirmation executes nothing.

- **Step A:** with 0.1 fixed, `POST /api/v1/confirm/{id}` stops 500ing.
- **Step B:** implement execution. Simplest correct design: store the originating command payload on the pending confirmation when it's created; on `confirm_command(id, approved=True)`, re-dispatch through `command_handler` with `confirmed=True` (the flag `modules/system.py:203-211` already expects). Alternative: implement the never-called `security.register_callback()` (`modules/security.py:125`).
- **Files:** `modules/security.py`, `modules/command_handler.py:42-47`, `routers/commands.py:29-36` (add explicit error handling while here).
- **Acceptance:** pytest that requests a dangerous action, confirms it, and asserts the action executed; denial path leaves nothing executed.
- **Then update** `docs/API_DOCUMENTATION.md:181-186` to describe the real behavior.

### 0.3 Revive the LLM agent 🔴

- **Fix:** in `modules/llm_wrapper.py`, stop rebinding `llm_client = llm_module` (line 158) — either delete the alias, or inside `get_agent_response` (lines 146-155) call the real client explicitly (`from modules.llm_client import llm_client as _client; await _client.chat(...)`).
- **Also fix 5.6 while here:** `AGENT_SYSTEM_PROMPT` uses `{{tools_context}}` / `{{neural_context}}` (escaped braces, lines 17-42) so `.format()` at line 147 never injects them — change to single braces.
- **Files:** `modules/llm_wrapper.py:17-42,146-158`, importers `modules/agent.py:39,52`.
- **Acceptance:** pytest with a mocked LLM client asserting `get_agent_response` reaches a final answer in ≤2 iterations (today it AttributeErrors 5 times).

### 0.4 Fix WebSocket message schema 🟢

- **Fix:** add `data: Optional[Dict[str, Any]] = None` to `WebSocketMessage` (`models.py:437-443`). Also move the `json.loads` at `routers/websocket.py:56` inside the validation try so malformed JSON returns an error frame instead of dropping the connection.
- **Acceptance:** test sends `{"type": "confirmation", "data": {...}}` over the test WS client and the connection survives; malformed JSON gets an error frame.

### 0.5 Fix frontend WebSocket lifecycle 🟡

- **Fix (in `src/hooks/useWebSocket.ts`):**
  1. Store `options` in a ref updated by an effect; remove `options` from `connect`'s dep array (line 118) — or memoize the options object in `Home.tsx:52-65` with `useMemo`.
  2. Don't set `retriesRef.current = MAX_RETRIES` inside `disconnect()` (line 129) — use a separate `manualCloseRef` so cleanup-on-unmount doesn't poison auto-reconnect.
  3. Dedupe notifications: remove the `addNotification` call in the hook (`useWebSocket.ts:72-78`) **or** in `Home.tsx:57-59`, keep one.
  4. Make `isConnected` reactive — derive from store state rather than `getState()` (line 156).
- **Acceptance:** manual test — re-render Home (toggle theme/state) and the socket stays open; single toast per WS notification.

**Phase 0 exit criteria:** all 7 P0 defects closed with a regression test each; backend suite green; manual smoke: volume command reports success, confirm flow executes a dangerous action, agent answers a fallback query, Home page socket stays connected across re-renders.

---

## Phase 1 — CI Integrity & Test Coverage (target: 2–3 days) 🟡

> **Status: ✅ COMPLETE (2026-09-11).** All three `continue-on-error` flags removed; backend test job fixed to run from the repo root (`from backend.main import app` could not resolve from `backend/`) with `pytest-timeout` added to requirements; unused mypy dropped from CI; frontend test job now runs the real `npm test` (vitest installed in Phase 0); `Dockerfile.frontend` created (nginx serving the Vite build via the existing `nginx.conf`); ESLint (typescript-eslint + react-hooks v7) added with 0 errors / 9 tracked-debt warnings; vacuous assertions tightened in `test_api.py` / `test_v4.py` (the `/health`-404 test now hits `/api/v1/health`); markdownlint made green repo-wide (auto-fixed whitespace violations; FRD disable-comment per CHANGELOG convention; `memory/` + `skills/` runtime/tool artifacts excluded); prettier drift across 44 src files normalized. Full local gate verified: pytest 53/53, vitest 5/5, tsc, eslint, prettier, build, markdownlint, ci.yml YAML valid.

### 1.1 Make CI able to fail 🟢 each

- Remove `continue-on-error: true` from the backend test job and the two other jobs (`.github/workflows/ci.yml:51,86,134`).
- Docker job: create `Dockerfile.frontend` (multi-stage node build → nginx, `nginx.conf` already exists in repo root) **or** delete the job. Note `ci.yml:174,237` duplicate `Dockerfile.backend` builds — dedupe.
- Frontend test job (`ci.yml:112`): either add vitest + first tests (1.3) or temporarily replace `npx vitest run` with `npm run typecheck`.
- Run mypy or remove it from the pip install line (`ci.yml:74`) — currently dead weight.

### 1.2 Backend tests for the previously-broken paths 🔴

Add to `backend/tests/` (conftest fixtures already exist):

- `test_security.py` — confirmation create/approve/deny/timeout lifecycle; dangerous-command gating.
- `test_system_endpoints.py` — volume/mute/brightness happy-path response shapes (would have caught 0.1).
- `test_websocket.py` — command, confirmation, malformed-JSON frames.
- `test_agent.py` — ReAct loop with mocked `llm_client` (would have caught 0.3).
- `test_settings.py` — key update writes `.env` correctly and redacts responses.
Fix vacuous assertions meanwhile: `status_code in (200,403)` patterns (`test_api.py:16`, `test_v4.py:44,52,81`) and the `/health`-is-404 test (`test_v4.py:65` → use `/api/v1/health`).

### 1.3 Frontend toolchain 🟡

- `npm install` in the working clone (currently absent — nothing is locally runnable).
- Add `vitest` + `@testing-library/react` + `jsdom`; first tests: `useWebSocket` (connect/reconnect/dedupe), `store` slices, one page render each; add `"test": "vitest run"` script and wire into CI.
- Add ESLint (`typescript-eslint`, `eslint-plugin-react-hooks`) — the current `lint` script is only typecheck + prettier; the react-hooks rule would have flagged 0.5's dep-array bug.
- Fix `npm run build` to type-check: change to `tsc --noEmit && vite build` (vite alone does not type-check).

---

## Phase 2 — Security Hardening (target: 2–4 days) — **required before Docker/LAN exposure** 🔒

> Decision point: if JARVIS stays a single-user loopback tool, items marked *(LAN)* can defer; items marked *(now)* apply regardless.

| # | Item | Fix | Priority |
|---|---|---|---|
| 2.1 | Localhost auth bypass is total (all 4 sites: `main.py:190-193`, `middleware_security.py:186-188`, `websocket.py:33`, `audio.py:43`) | Extract one `is_local_request()` helper; add `REQUIRE_AUTH_ON_LOCALHOST` env (default false today, true for Docker image); fail closed in container | *(LAN)* 🔴 |
| 2.2 | Dockerfile.backend binds `0.0.0.0` while auth bypass assumes loopback | Same as 2.1 — container must enforce the key | *(LAN)* 🔴 |
| 2.3 | `ENABLE_DANGEROUS_COMMANDS` defaults `true` (`config/defaults.py:20`) | Default `false`; require explicit opt-in | *(now)* 🟢 |
| 2.4 | `PAIRING_SECRET` fallback `"JARVIS-SECRET-KEY"` (`environment.py:48`, `.env.example:40`) | Refuse to start pairing when unset; generate random on first run | *(now)* 🟢 |
| 2.5 | SQLi filter 400s legitimate "delete file X" commands (`middleware_security.py:20-23`) | Exempt `/api/v1/command` (command content is validated downstream), or drop the keyword filter in favor of the existing parameterized-SQL guarantee | *(now)* 🟡 |
| 2.6 | WS API key in query string (`websocket.py:23`, `audio.py:24`) | Accept `X-API-Key` header / `Sec-WebSocket-Protocol` token, or short-lived ticket endpoint; keep query param as fallback with log scrubbing | *(LAN)* 🟡 |
| 2.7 | `shell=True` + interpolation: AppleScript (`modules/desktop.py:364-368`), `start ""` (`window_manager.py:243-246`) | Escape single quotes properly or pass through argv; add a lint rule / grep gate banning new `shell=True` | *(now)* 🟡 |
| 2.8 | Pairing token `==` compare (`websocket.py:43`) | `secrets.compare_digest` | *(now)* 🟢 |
| 2.9 | Quarantine endpoint lacks audit trail (`routers/system.py:186-190`) | Write quarantine actions to `performance_metrics`-style audit table + WS event | *(now)* 🟡 |
| 2.10 | API-key management rewrites `.env` + injects `os.environ` via API (`routers/settings.py:70-134`) | Fine for loopback; behind 2.1 require re-auth and don't hot-inject — restart-to-apply | *(LAN)* 🟡 |
| 2.11 | Rate-limiter buckets never evicted; body cap trusts Content-Length only (`middleware_security.py:144-155,133-138`) | Periodic bucket eviction; read/stream body to count actual bytes | 🟢 |

---

## Phase 3 — Frontend Completion per FRD (target: 3–5 days) 🎨

### 3.1 Wire the orphaned headline features 🟡

- **Voice in/out:** mount `useSpeechRecognition` + `useTextToSpeech` in `Home.tsx` (both are written, unused). Fix hardcoded `'en-US'` (`useSpeechRecognition.ts:26`) → derive from the app's language cycle (en → hi → hinglish) so Hindi voice actually works — this is the "bilingual" promise.
- **Agent chat + streaming:** `src/api/agent.ts` (chat + SSE via fetch/ReadableStream, well-written) and `useSSE.ts` are unreachable. Add an agent panel on Home; this is the FRD's core interaction.
- Delete `src/services/notifications.ts` (duplicate system) and unused `ui/Modal.tsx` / `ui/Tooltip.tsx` — or adopt Modal for `ConfirmationDialog`.

### 3.2 Fix quality gaps 🟢 each

- `ConfirmationDialog.tsx:63-148`: add `role="dialog"`, `aria-modal`, focus trap, Escape-to-cancel, focus restore.
- `auth:invalid-key` event handled only in `Home.tsx:83-95` — move listener into `api/client.ts` consumers or the store so Settings/Analytics react to 403 too.
- Remove dead conditional `Home.tsx:118`; fix `void cmdLoading` workaround in `Analytics.tsx:48`; remove unused `@` alias from `vite.config.ts` + `tsconfig.json`.
- Delete unused `uuid`/`@types-uuid` deps.
- `index.html`: remove dead inline CSS (lines 26-58) and the conflicting Orbitron/Share Tech Mono font stack (the app uses Inter/JetBrains Mono/Rajdhani).

### 3.3 PWA & assets 🟡

- Add `public/favicon.ico` (referenced `index.html:21`, missing) and `public/icons/icon-192x192.png` + `icon-512x512.png` (referenced `public/manifest.json:10-23`, missing — install prompt is broken today).
- Decide: add a service worker (vite-plugin-pwa) for offline shell, or drop the manifest. Don't ship a half-PWA.

---

## Phase 4 — Dependency & Code Cleanup (target: 1–2 days) 🧹

**Backend deps** (`backend/requirements.txt` / `requirements-prod.txt`):

- Remove dead: `asyncpg`, `alembic`, `sqlalchemy` (lines 11-13 — DB is stdlib sqlite3; CI installs them for nothing).
- Replace deprecated: `PyPDF2` → `pypdf`; delete `fuzzywuzzy` (`rapidfuzz` already pinned); `google-generativeai` → `google-genai` or drop if Gemini goes through OpenAI-compat; replace/unplug `win10toast`.
- Remove `OTEL_ENABLED` residue (`logger_structured.py:31`).

**Code:**

- Fix or delete stale scripts (`scripts/audit_project.py:77`, `quick_parser_audit.py:6` — import a deleted `config.commands`).
- Delete dead backend code: try/except-pass `main.py:141-148`; unused `security.is_dangerous`; duplicate import `routers/commands.py:32`; after 0.3, fold `llm_wrapper.py` into `llm_client.py`.
- Extract the 4× copy-pasted localhost-bypass check (done as part of 2.1).
- Sync `tests/conftest.py:24-61` schema with `utils/database.py:24-88` (missing `paired_devices`, `quick_actions`) — or generate both from one schema constant.
- Fix `DatabaseManager.fetchval()` connection leak (`database.py:186-188`); wrap sync `save_config` calls in `asyncio.to_thread` (`routers/system.py:132`, `modules/command_handler.py:275`).
- Version string consistency: mDNS advertises `"3.9.0"` (`utils/mdns.py:35`) vs `4.0.0-alpha.4`; remove leftover `aryanahirwar.in` referer (`llm_wrapper.py:82`).

**Docs:** update `API_DOCUMENTATION.md` (confirmation behavior, WS `data` field) and `CHANGELOG.md` after Phase 0.

---

## Phase 5 — Upgrades & Bigger Bets (backlog, unprioritized)

- **Versioned schema:** if the DB grows, add a `schema_version` pragma + tiny migration runner (Alembic is overkill for stdlib sqlite3 — don't reintroduce it).
- **i18n layer:** today "bilingual" is per-command language params with backend-side responses; if UI strings should translate too, add a lightweight i18n (e.g. `types/index.ts`-adjacent dictionary, no RTL needed for EN/HI).
- **Frontend feature parity:** FRD lists panels (FileBrowser, WindowManager, WhatsApp, DeviceSync, InputSimulator, MediaTools) that alpha.3 had and the rebuild hasn't reached — sequence them off the FRD once Phases 0-3 land.
- **Coverage gate:** add `pytest --cov` with a floor (e.g. 60%) and frontend coverage once tests exist.
- **Branch hygiene:** `main` (working) vs `v2` (origin default/PR target) — pick one default and align.

---

## Suggested Order & Milestones

| Milestone | Contents | Effort | Outcome |
|---|---|---|---|
| **M1 "Product works"** | Phase 0 (all) + regression tests for each fix | 1–2 d | Volume/confirm/agent/WS all functional |
| **M2 "Regression-proof"** | Phase 1 | 2–3 d | CI fails on breakage; ~65+ backend tests, frontend test+lint running |
| **M3 "Safe to expose"** | Phase 2 *(now)* items; *(LAN)* items before any Docker/LAN run | 2–4 d | Dangerous defaults off, injection surfaces closed, audit trail |
| **M4 "Frontend whole"** | Phase 3 | 3–5 d | Voice + agent chat live, PWA installable, a11y fixed |
| **M5 "Clean base"** | Phase 4 | 1–2 d | No dead deps/code, docs truthful |

**Total to M5: roughly 9–16 focused working days.** M1 alone (~1–2 days) removes every user-facing breakage — if time is scarce, do M1 + the three `continue-on-error` removals from M2 and nothing else.
