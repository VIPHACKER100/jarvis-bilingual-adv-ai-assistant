# API & Frontend Coverage Report

**Date:** 2026-05-16  
**Backend:** FastAPI (dual-mounted routes)  
**Frontend:** React 19 + Vite + Zustand

---

## API routing model

Routes are registered **twice** in `backend/main.py`:

1. **Versioned:** `/api/v1{path}`
2. **Legacy:** `{path}` (same router, no prefix)

**Exceptions:**

- WebSocket: `WS /ws` only
- Context router: `/context/*` (legacy mount only)
- Root: `GET /` — health JSON or static SPA

---

## REST API inventory

### Health

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Backend health |

### Commands & security

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/command` | Execute command (REST) |
| POST | `/confirm/{confirmation_id}` | Confirm dangerous action |
| GET | `/pending` | Pending confirmations |

### System (`/system`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/system/status` | CPU/RAM/disk |
| GET | `/system/battery` | Battery info |
| GET | `/system/time` | Current time |
| GET | `/system/date` | Current date |
| POST | `/system/shutdown` | Shutdown PC |
| POST | `/system/restart` | Restart PC |
| POST | `/system/sleep` | Sleep PC |
| POST | `/system/volume/up` | Volume up |
| POST | `/system/volume/down` | Volume down |
| POST | `/system/mute` | Toggle mute |
| GET | `/system/uptime` | System uptime |
| GET | `/system/network` | IP / network |
| GET | `/system/weather` | Weather query |
| POST | `/system/search` | Google search |
| GET | `/system/performance/history` | Metrics history |
| GET | `/system/personalities` | List themes |
| POST | `/system/personality/{p_id}` | Set theme |
| GET | `/system/command-insights` | Usage analytics |
| GET | `/system/security/processes` | Process list |
| GET | `/system/security/connections` | Network connections |
| POST | `/system/security/quarantine` | Quarantine process |

### Windows & apps

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/windows/list` | List windows |
| GET | `/apps/list` | List apps |
| POST | `/apps/open` | Open application |
| POST | `/apps/close` | Close application |
| POST | `/windows/minimize` | Minimize |
| POST | `/windows/maximize` | Maximize |
| POST | `/windows/restore` | Restore |
| POST | `/windows/activate` | Activate window |
| POST | `/windows/focus` | Focus window |

### Files (`/files`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/files/open` | Open folder |
| GET | `/files/list` | List directory |
| POST | `/files/search` | Search files |
| POST | `/files/create` | Create folder |
| POST | `/files/delete` | Delete file |
| POST | `/files/copy` | Copy file |
| POST | `/files/move` | Move file |
| POST | `/files/rename` | Rename file |
| GET | `/files/info` | File metadata |

### Media & OCR (`/media`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/media/ocr/image` | OCR image file |
| POST | `/media/ocr/pdf` | OCR PDF |
| POST | `/media/ocr/screen` | Screenshot OCR |

### PDF tools (`/pdf`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/pdf/merge` | Merge PDFs |
| POST | `/pdf/split` | Split PDF |
| POST | `/pdf/to-images` | PDF → images |
| POST | `/pdf/from-images` | Images → PDF |

### Image tools (`/image`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/image/convert` | Convert format |
| POST | `/image/resize` | Resize image |
| POST | `/image/compress` | Compress image |

### Desktop (`/desktop`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/desktop/screenshot` | Full screenshot |
| POST | `/desktop/screenshot/region` | Region screenshot |
| GET | `/desktop/clipboard/text` | Read clipboard |
| POST | `/desktop/clipboard/text` | Write clipboard |
| DELETE | `/desktop/clipboard` | Clear clipboard |
| POST | `/desktop/media/play` | Play/pause |
| POST | `/desktop/media/next` | Next track |
| POST | `/desktop/media/previous` | Previous track |
| POST | `/desktop/media/stop` | Stop media |
| POST | `/desktop/wallpaper` | Change wallpaper |
| POST | `/desktop/zoom` | Screen zoom |

### Memory (`/memory`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/memory/conversation` | Save conversation |
| GET | `/memory/conversations` | List conversations |
| GET | `/memory/stats` | Memory stats |
| DELETE | `/memory/conversations` | Clear history |
| POST | `/memory/fact` | Add fact |
| GET | `/memory/facts` | List facts |
| PUT | `/memory/fact/{fact_id}` | Update fact |
| DELETE | `/memory/fact/{fact_id}` | Delete fact |
| GET | `/memory/nodes` | List neural nodes |
| GET | `/memory/nodes/{name}` | Get node |
| PUT | `/memory/nodes/{name}` | Update node |

### Automation (`/automation`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/automation/task` | Create scheduled task |
| GET | `/automation/tasks` | List tasks |
| POST | `/automation/task/{task_id}/toggle` | Enable/disable |
| DELETE | `/automation/task/{task_id}` | Delete task |
| POST | `/automation/macro` | Save macro |
| GET | `/automation/macros` | List macros |
| POST | `/automation/macro/{macro_id}/run` | Run macro |
| GET | `/automation/status` | Automation status |

### Settings (`/settings`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/settings` | Get settings |
| GET | `/settings/keys` | List API key names |
| POST | `/settings` | Update settings |
| POST | `/settings/keys` | Set API key |
| POST | `/settings/test-key` | Test API key |

### WhatsApp (`/whatsapp`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/whatsapp/open` | Open WhatsApp |
| POST | `/whatsapp/send` | Send message |
| POST | `/whatsapp/call` | Start call |
| GET | `/whatsapp/contacts` | List contacts |
| GET | `/whatsapp/status` | Connection status |
| POST | `/whatsapp/draft_reply` | Smart reply draft |

### Input (`/input`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/input/cursor` | Cursor position |
| POST | `/input/move` | Move cursor |
| POST | `/input/click` | Click |
| POST | `/input/double_click` | Double-click |
| POST | `/input/right_click` | Right-click |
| POST | `/input/type` | Type text |
| POST | `/input/press` | Press key |
| POST | `/input/scroll` | Scroll |
| POST | `/input/drag` | Drag |
| POST | `/input/shortcut` | Hotkey |

### Notifications & sync

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/notifications` | Push notification |
| GET | `/sync/pairing-code` | Mobile pairing code |
| GET | `/sync/status` | Sync status |
| POST | `/sync/pair` | Pair device |
| GET | `/sync/devices` | List devices |
| DELETE | `/sync/devices/{device_id}` | Unpair |
| POST | `/sync/telemetry` | Telemetry |

### Context (legacy only)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/context/suggestion` | Proactive suggestion |
| GET | `/context/quick-actions` | Quick actions |
| POST | `/context/quick-actions` | Update quick actions |

### WebSocket

| Type | Path | Messages |
|------|------|----------|
| WS | `/ws` | `command`, `confirmation`, `command_result`, `agent_thinking`, `error` |

**Estimated unique route definitions:** ~100 (×2 mounts ≈ 200 URLs)

---

## API test coverage

| Route tested | Test file | Result |
|--------------|-----------|--------|
| `GET /` | `test_api.py` | Pass |
| `GET /api/system/status` | `test_api.py` | **Fail (404)** — should be `/system/status` or `/api/v1/system/status` |
| All other routes | — | **Not covered** by automated tests |

**Coverage estimate:** ~1% of REST endpoints have automated tests.

---

## Frontend test coverage

### Tested (Vitest)

| Module | Tests | Coverage |
|--------|-------|----------|
| `apiClient.ts` | healthCheck, system status, executeCommand, memory, settings, headers, safeRequest | Good unit coverage |
| `jarvisStore.ts` | mode, language, history, connection, UI toggles | State defaults |

### Not tested (UI components)

| Component | Risk |
|-----------|------|
| `ArcReactor` | Voice UX |
| `MainHUD` | Transcript display |
| `useJarvisBridge` | WebSocket integration |
| `useVoiceController` | STT/TTS |
| `DesktopControls` | Desktop actions |
| `MediaTools` | OCR UI |
| `ConfirmationModal` | Dangerous commands |
| `VisionOverlay` | Screen analysis |
| `AutomationDashboard` | Macros |

**Recommendation:** Add React Testing Library tests for `useJarvisBridge` and critical modals.

---

## Frontend ↔ backend contract

| Channel | Client | Server | Auth |
|---------|--------|--------|------|
| REST | `apiClient.ts` → `/api/v1` | FastAPI routers | API key header |
| WebSocket | `websocketService.ts` → `/ws` | `websocket.py` | Session |
| Voice | `voiceService.ts` → bridge | `handle_command` | — |

Documented flow: `BACKEND_FRONTEND_SYNC.md`

---

## Suggested API test additions

Priority endpoints for integration tests:

1. `GET /api/v1/system/status` (with/without API key)
2. `POST /api/v1/command` — safe commands (`time`, `battery`)
3. `GET /api/v1/desktop/screenshot`
4. `POST /api/v1/media/ocr/screen` (skip if no Tesseract)
5. WebSocket command round-trip
