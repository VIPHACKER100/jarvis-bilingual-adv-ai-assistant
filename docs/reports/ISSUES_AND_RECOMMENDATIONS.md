# Issues & Recommendations

**Date:** 2026-06-16  
**Priority:** P0 (critical) → P3 (nice-to-have)

---

## P0 — Critical (fixed or blocking)

### ✅ FIXED: Security — CodeQL SAST findings (v3.9.1)

Three security issues detected by GitHub CodeQL have been remediated:

- **Bad HTML filtering regexp (High)** — `securityService.ts` script tag regex replaced with general `/<[^>]*>/g` tag stripper
- **Incomplete multi-character sanitization (High)** — Protocol/event handler removal made iterative (3 passes) with whitespace variant coverage
- **Information exposure through an exception (Medium)** — `str(e)` removed from all error responses across `context.py` and `main.py`; exceptions are logged server-side only

### ✅ FIXED: `BilingualParser` has no attribute `parse`

- **Symptom:** `Error executing background command: 'BilingualParser' object has no attribute 'parse'`
- **Fix:** `command_handler.py` now uses `parser.parse_command(command)`
- **Verify:** Restart backend; send any WebSocket command

### Tesseract OCR not installed

- **Symptom:** `tesseract is not installed or it's not in your PATH`
- **Impact:** Screenshot/image OCR fails
- **Fix applied:** Graceful error message (no log spam)
- **User action:** Install Tesseract and add to PATH

```powershell
winget install UB-Mannheim.TesseractOCR
# Then add: C:\Program Files\Tesseract-OCR to PATH and restart backend
```

---

## P1 — Security

### 1. Missing authentication on agent endpoints

- **File:** `backend/routers/agent.py`
- **Risk:** The agent router exposes `/chat`, `/stream`, `/health`, and `/rag` endpoints with rate limiting but no authentication or authorization checks. An unauthenticated attacker could consume LLM credits or probe the system.
- **Suggestion:** Add a dependency-based authentication guard (API key or JWT verification) to all agent routes.

---

## P1 — Correctness

### 2. Silent failure when listening blocked by speaking ✅ RESOLVED

- **File:** `src/services/voiceService.ts:75`
- **Risk:** In `startListening()`, if `isSpeaking` is true the method returns without calling `onError`, leaving the caller uninformed about why listening didn't start.
- **Suggestion:** Call `onError` with a descriptive message before returning when `isSpeaking` is true.
- **Fix Applied (2026-06-23):** Added `onError('speaking')` call before the `return` statement in `startListening()` when `this.isSpeaking` is true, ensuring the caller is always notified when listening is blocked.

### 3. Missing error handling in streaming event generator

- **File:** `backend/routers/agent.py:63-73`
- **Risk:** The `event_stream()` generator in `agent_stream` can raise unhandled exceptions if the LLM gateway fails mid-stream, causing abrupt SSE disconnection without an error event. Clients receive no indication of failure.
- **Suggestion:** Wrap the `async for` loop in a `try-except` block and yield a JSON error event before re-raising or logging.

---

## P1 — High (voice UX broken for some commands)

> **v3.9.1**: Security SAST findings are fully resolved. See ✅ FIXED above.

### 4. Parser phrase collisions

Short phrases lose to longer fuzzy matches. See [COMMAND_TEST_MATRIX.md](./COMMAND_TEST_MATRIX.md).

**Recommended fixes in `bilingual_parser.py`:**

1. Match **whole words** for short triggers (`time`, `open`, `close`, `click`, `copy`, `press`)
2. Prefer **exact key phrase** over substring of another key (`uptime` vs `time`)
3. Raise priority when sample equals entire input (single-word commands)

**Config fix in `commands.py`:**

```python
# open_documents — REMOVE erroneous phrase:
'open_documents': ['open document', 'documents kholo', ...]  # remove 'open downloads'
```

### 5. `command_insights` missing voice dispatch

- **Symptom:** Voice "command insights" → agent fallback
- **Fix:** Add to `dispatch_command`:

```python
elif command_key == 'command_insights':
    from modules.memory import memory_manager
    insights = await memory_manager.get_command_insights()
    result = {'success': True, 'action_type': 'COMMAND_INSIGHTS', 'data': insights, ...}
```

### 6. `open_downloads` opens Documents

- **Cause:** `open_documents` includes `'open downloads'` in phrase list (line 79)
- **Fix:** Remove duplicate phrase from `open_documents`

---

## P2 — Medium (tests & maintainability)

### 8. Fragile onvoiceschanged handler chain in speak() ✅ RESOLVED

- **File:** `src/services/voiceService.ts:191`
- **Risk:** The `speak()` method overwrites `window.speechSynthesis.onvoiceschanged` with a wrapper, but if `speak()` is called multiple times in rapid succession, each call nests the previous handler, creating a fragile callback chain that can break or cause unintended double-invocations.
- **Suggestion:** Use `addEventListener` (or maintain a queue) to avoid nested callback wrapping.
- **Fix Applied (2026-06-23):** Constructor uses `addEventListener('voiceschanged', loadVoices)`, `speak()` uses `addEventListener('voiceschanged', trySpeak, { once: true })` instead of manual property overwrite + chaining. Eliminates nested callback risk entirely.

### 9. TypeScript `any` cast undermines type safety ✅ RESOLVED

- **File:** `src/services/voiceService.ts:25`
- **Risk:** `const w = window as any` bypasses TypeScript's compile-time checks for the `SpeechRecognition` constructor, hiding potential type mismatches.
- **Suggestion:** Augment the `Window` interface with the optional `SpeechRecognition` property instead of casting to `any`.
- **Fix Applied (2026-06-23):** Added `interface SpeechRecognitionWindow extends Window` with typed optional constructors, removed the `const w = window as any` intermediate variable. Uses `(window as SpeechRecognitionWindow).SpeechRecognition` instead.

### 10. Duplicate getVoices() call in speak() ✅ RESOLVED

- **File:** `src/services/voiceService.ts:183-189`
- **Risk:** `getVoices()` is called on line 183 to populate the local `voices` variable, then called again inside the deferred `trySpeak` callback on line 189, making a redundant API call.
- **Suggestion:** Reuse the already-fetched `voices` array to avoid the redundant call.
- **Fix Applied (2026-06-23):** `trySpeak` now passes the already-captured `voices` variable instead of calling `this.synthesis.getVoices()` again inside the deferred callback.

### 11. Unused imports in agent.py

- **File:** `backend/routers/agent.py:7,10`
- **Risk:** The modules `time` (line 7) and `Depends` (line 9, from `fastapi`) are imported but never referenced. Unused imports increase code bloat and mislead maintainers.
- **Suggestion:** Remove unused imports.

### 12. Failing API test uses wrong path

**File:** `backend/tests/test_api.py`

```python
# Current (404):
client.get("/api/system/status")

# Should be:
client.get("/api/v1/system/status")
# or:
client.get("/system/status")
```

### 13. `test_all_command_keys_have_routes` failure

Will pass once `command_insights` dispatch is added (or add to intentional exclusions).

### 14. Param-sensitive file/media commands

Voice passes strings; handlers expect dicts. Add normalizer in `handle_command`:

```python
if isinstance(params, str) and command_key in FILE_PARAM_KEYS:
    params = infer_params_from_text(command_key, params, command)
```

### 15. `DANGEROUS_COMMANDS` includes `hibernate` with no command key

Remove from dangerous set or add `hibernate` command + handler.

### 16. `shutdown` vs `close_app` phrase overlap

Both use `band karo` — disambiguate by requiring `pc` / `computer` for shutdown.

---

## P3 — Low (polish & coverage)

| Item | Recommendation |
|------|----------------|
| Low REST test coverage | Add `httpx` integration tests for top 20 routes |
| No component tests | RTL tests for bridge + confirmation modal |
| `MobileDashboard.tsx` unused | Wire in App or remove |
| Dual API mounts | Document deprecation path for legacy routes |
| Agent fallback latency | Log when agent invoked vs direct dispatch |

---

## Manual QA checklist

Run with backend + frontend dev servers:

### System (safe)

- [ ] "What time is it" / "समय बताओ"
- [ ] "Check battery" / "बैटरी चेक करो"
- [ ] "System status"
- [ ] Volume up/down, mute

### Desktop

- [ ] "Take screenshot"
- [ ] "Get clipboard"
- [ ] Play/pause media

### Files

- [ ] "Open downloads" (after config fix)
- [ ] "Open documents"
- [ ] "Search file report.pdf"

### OCR (needs Tesseract)

- [ ] "Screenshot lo aur text nikalo"
- [ ] Media Tools → OCR screen

### AI

- [ ] Unknown phrase → agent responds
- [ ] Set personality → theme changes

### Security

- [ ] "Shutdown" → confirmation modal appears
- [ ] Deny → no shutdown

### WebSocket

- [ ] Mic → command → HUD shows result
- [ ] No `parse` attribute errors in logs

---

## Suggested fix order

1. **P1 Security** — Add authentication guard to agent routes (`backend/routers/agent.py`)
2. ~~**P1 Correctness** — Fix silent failure when speaking blocks listening (`src/services/voiceService.ts:75`)~~ **RESOLVED** in 2026-06-23 fix cycle
3. **P1 Correctness** — Add error handling in streaming event generator (`backend/routers/agent.py:63-73`)
4. **P1 UX** — Install Tesseract (user environment)
5. **P1 UX** — Fix `open_documents` typo phrase
6. **P1 UX** — Add `command_insights` dispatch
7. **P1 UX** — Improve parser word-boundary matching
8. **P2** — Remove unused imports `time` and `Depends` from `agent.py`
9. ~~**P2** — Fix fragile `onvoiceschanged` handler chain in `speak()`~~ **RESOLVED** in 2026-06-23 fix cycle
10. ~~**P2** — Replace `any` cast with augmented Window interface~~ **RESOLVED** in 2026-06-23 fix cycle
11. ~~**P2** — Eliminate duplicate `getVoices()` call~~ **RESOLVED** in 2026-06-23 fix cycle
12. **P2** — Fix `test_api.py` path
13. **P2** — Add param normalizer for file commands
14. **P2** — Expand integration tests
15. **P3** — Run CodeQL analysis after any security-related changes

---

## Files changed in recent session

| File | Change |
|------|--------|
| `backend/handlers/command_handler.py` | `parse_command` fix |
| `backend/modules/media.py` | Tesseract detection + graceful OCR errors |
| `docs/reports/*` | This audit (new) |
| `backend/scripts/quick_parser_audit.py` | Audit tooling (new) |
| `backend/main.py` | CodeQL: information exposure fix (generic error responses) |
| `backend/routers/context.py` | CodeQL: information exposure fix (generic error responses) |
| `src/services/securityService.ts` | CodeQL: bad HTML regex & incomplete sanitization fixes |
| `src/services/voiceService.ts` | Code review: 4 findings (correctness, maintainability, readability, performance) — **all resolved** in 2026-06-23 fix cycle |
| `backend/routers/agent.py` | Code review: 3 findings (security, style, correctness) |
