# Issues & Recommendations

**Date:** 2026-05-16  
**Priority:** P0 (critical) → P3 (nice-to-have)

---

## P0 — Critical (fixed or blocking)

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

## P1 — High (voice UX broken for some commands)

### 1. Parser phrase collisions

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

### 2. `command_insights` missing voice dispatch

- **Symptom:** Voice "command insights" → agent fallback
- **Fix:** Add to `dispatch_command`:

```python
elif command_key == 'command_insights':
    from modules.memory import memory_manager
    insights = await memory_manager.get_command_insights()
    result = {'success': True, 'action_type': 'COMMAND_INSIGHTS', 'data': insights, ...}
```

### 3. `open_downloads` opens Documents

- **Cause:** `open_documents` includes `'open downloads'` in phrase list (line 79)
- **Fix:** Remove duplicate phrase from `open_documents`

---

## P2 — Medium (tests & maintainability)

### 4. Failing API test uses wrong path

**File:** `backend/tests/test_api.py`

```python
# Current (404):
client.get("/api/system/status")

# Should be:
client.get("/api/v1/system/status")
# or:
client.get("/system/status")
```

### 5. `test_all_command_keys_have_routes` failure

Will pass once `command_insights` dispatch is added (or add to intentional exclusions).

### 6. Param-sensitive file/media commands

Voice passes strings; handlers expect dicts. Add normalizer in `handle_command`:

```python
if isinstance(params, str) and command_key in FILE_PARAM_KEYS:
    params = infer_params_from_text(command_key, params, command)
```

### 7. `DANGEROUS_COMMANDS` includes `hibernate` with no command key

Remove from dangerous set or add `hibernate` command + handler.

### 8. `shutdown` vs `close_app` phrase overlap

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

1. Install Tesseract (user environment)
2. Fix `open_documents` typo phrase
3. Add `command_insights` dispatch
4. Improve parser word-boundary matching
5. Fix `test_api.py` path
6. Add param normalizer for file commands
7. Expand integration tests

---

## Files changed in recent session

| File | Change |
|------|--------|
| `backend/handlers/command_handler.py` | `parse_command` fix |
| `backend/modules/media.py` | Tesseract detection + graceful OCR errors |
| `docs/reports/*` | This audit (new) |
| `backend/scripts/quick_parser_audit.py` | Audit tooling (new) |
