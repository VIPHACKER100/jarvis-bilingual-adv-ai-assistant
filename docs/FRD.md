# FRONTEND REQUIREMENTS DOCUMENT (FRD) — JARVIS v4.0

> **Generated from:** Python/FastAPI Backend at `backend/`
> **Backend Version:** `4.0.0-alpha.4`
> **Date:** July 8, 2026

---

# PHASE 1 — BACKEND ANALYSIS

## A. API ENDPOINTS INVENTORY

### A.1 Complete Endpoint Table

| # | Method | Endpoint Path | Router | Auth Required | Purpose |
|---|--------|--------------|--------|---------------|---------|
| E1 | GET | `/api/v1/health` | health | ❌ (exempt) | Full health report |
| E2 | GET | `/api/v1/ready` | health | ❌ (exempt) | Readiness probe (DB connected) |
| E3 | GET | `/api/v1/live` | health | ❌ (exempt) | Liveness probe |
| E4 | POST | `/api/v1/command` | commands | ✅ | Execute a voice/text command |
| E5 | POST | `/api/v1/confirm/{confirmation_id}` | commands | ✅ | Confirm/deny a dangerous action |
| E6 | GET | `/api/v1/pending` | commands | ✅ | List pending confirmations |
| E7 | GET | `/api/v1/system/status` | system | ✅ | Full system status (CPU, RAM, battery, disk, network, uptime, volume, active window) |
| E8 | GET | `/api/v1/system/battery` | system | ✅ | Battery info |
| E9 | GET | `/api/v1/system/time` | system | ✅ | Current time |
| E10 | GET | `/api/v1/system/date` | system | ✅ | Current date |
| E11 | POST | `/api/v1/system/shutdown` | system | ✅ | Shutdown computer (requires `confirmed=true`) |
| E12 | POST | `/api/v1/system/restart` | system | ✅ | Restart computer (requires `confirmed=true`) |
| E13 | POST | `/api/v1/system/sleep` | system | ✅ | Sleep computer (requires `confirmed=true`) |
| E14 | POST | `/api/v1/system/volume/up` | system | ✅ | Increase volume |
| E15 | POST | `/api/v1/system/volume/down` | system | ✅ | Decrease volume |
| E16 | POST | `/api/v1/system/mute` | system | ✅ | Toggle mute |
| E17 | GET | `/api/v1/system/uptime` | system | ✅ | System uptime |
| E18 | GET | `/api/v1/system/network` | system | ✅ | Network info (hostname, IP) |
| E19 | GET | `/api/v1/system/weather` | system | ✅ | Weather (opens browser) |
| E20 | POST | `/api/v1/system/search` | system | ✅ | Google search (opens browser) |
| E21 | GET | `/api/v1/system/performance/history` | system | ✅ | Historical performance metrics |
| E22 | GET | `/api/v1/system/personalities` | system | ✅ | List available personalities |
| E23 | POST | `/api/v1/system/personality/{p_id}` | system | ✅ | Set personality/theme |
| E24 | GET | `/api/v1/system/command-insights` | system | ✅ | Command usage analytics |
| E25 | GET | `/api/v1/system/security/processes` | system | ✅ | List running processes (top 50 by CPU) |
| E26 | GET | `/api/v1/system/security/connections` | system | ✅ | Active network connections scan |
| E27 | POST | `/api/v1/system/security/quarantine` | system | ✅ | Suspend/resume/terminate a process |
| E28 | GET | `/api/v1/settings` | settings | ✅ | Get all current settings |
| E29 | POST | `/api/v1/settings` | settings | ✅ | Update settings |
| E30 | GET | `/api/v1/settings/keys` | settings | ✅ | Get API key status (redacted) |
| E31 | POST | `/api/v1/settings/keys` | settings | ✅ | Update API keys in .env |
| E32 | POST | `/api/v1/settings/test-key` | settings | ✅ | Verify an API key (simulated) |
| E33 | POST | `/api/v1/agent/chat` | agent | ✅ | Non-streaming LLM chat |
| E34 | POST | `/api/v1/agent/stream` | agent | ✅ | Streaming LLM response (SSE) |
| E35 | GET | `/api/v1/agent/health` | agent | ❌ (exempt) | Agent subsystem health |
| E36 | WS | `/api/v1/audio/ws/audio` | audio | ✅ (query param) | Bidirectional audio (STT + TTS) |
| E37 | WS | `/ws` | websocket | ✅ (query param) | Real-time command/status comms |
| E38 | GET | `/favicon.ico` | app | ❌ | Serve favicon |
| E39 | GET | `/` | app | ❌ | Root (frontend or API info) |

### A.2 Detailed Endpoint Specifications

#### E1: GET `/api/v1/health`
- **Auth:** None (health-exempt)
- **Query params:** None
- **Response:** `{status, version, uptime_seconds, timestamp, performance: {db_latency_ms, cpu_usage_percent, memory_usage_percent}, automation: {active_macros, scheduler_active}}`
- **Errors:** None (always 200)

#### E2: GET `/api/v1/ready`
- **Auth:** None
- **Response:** `{status: "ready"|"not ready", database: "connected"|"disconnected"}`

#### E3: GET `/api/v1/live`
- **Auth:** None
- **Response:** `{status: "alive"}`

#### E4: POST `/api/v1/command`
- **Auth:** X-API-Key header (non-localhost)
- **Body:**
  ```json
  {
    "command": "string (1-500 chars)",
    "language": "en | hi | hinglish (default: en)",
    "session_id": "string (optional, max 100 chars)"
  }
  ```
- **Response:** `CommandResult` model:
  ```json
  {
    "success": true,
    "response": "string",
    "error": null,
    "response_time": 0.123,
    "timestamp": "ISO8601",
    "version": "4.0.0-alpha.4",
    "action_type": "OPEN_APP | SCREENSHOT | ...",
    "command_key": "unknown",
    "language": "en",
    "macro_name": null,
    "requires_confirmation": false,
    "confirmation_id": null,
    "suggestion": "string or null",
    "details": {...} or null,
    "data": {...} or null
  }
  ```
- **Errors:** 400 (no command), 403 (bad API key), 422 (validation), 500
- **Note:** If command can't be handled directly, the autonomous agent (ReAct loop) resolves it. The backend returns `action_type: "AGENT_RESOLVED"`. If the command is dangerous (e.g., shutdown), returns `requires_confirmation: true`.

#### E5: POST `/api/v1/confirm/{confirmation_id}`
- **Body:** `{"approved": bool, "details": {...} or null}`
- **Response:** `BaseResponse {success: bool, response: string}`
- **Errors:** 403, 404 (invalid ID), 500

#### E6: GET `/api/v1/pending`
- **Response:** `{...pending_confirmations dict...}` — raw dict of pending confirmation objects

#### E7-E20: System Endpoints
All accept optional `language` query param (`en`/`hi`). All return a model extending `BaseResponse`.

- **E7** `GET /system/status?language=en` → `SystemStatusResponse` (battery, cpu, memory, disk, network, uptime, volume, platform, active_window, context_suggestion, personality, event_loop_lag)
- **E8** `GET /system/battery?language=en` → `BatteryResponse {percent, is_charging}`
- **E9** `GET /system/time?language=en` → `TimeResponse {time: ISO, formatted: "10:00 AM"}`
- **E10** `GET /system/date?language=en` → `DateResponse {date: ISO, formatted: "Friday, May 15, 2026"}`
- **E11** `POST /system/shutdown?language=en&confirmed=false` → If not confirmed: `{success: false, requires_confirmation: true, confirmation_id: null}`. If confirmed: executes shutdown.
- **E12** `POST /system/restart` — same pattern as shutdown
- **E13** `POST /system/sleep` — same pattern as shutdown
- **E14** `POST /system/volume/up?amount=10&language=en` → `VolumeResponse {volume: int}`
- **E15** `POST /system/volume/down?amount=10&language=en` → `VolumeResponse {volume: int}`
- **E16** `POST /system/mute?language=en` → `BaseResponse`
- **E17** `GET /system/uptime?language=en` → `UptimeResponse {uptime_seconds, formatted}`
- **E18** `GET /system/network?language=en` → `NetworkInfoResponse {hostname, ip, interfaces}`
- **E19** `GET /system/weather?city=London&language=en` → `BaseResponse` (opens browser)
- **E20** `POST /system/search?query=hello&language=en` → `BaseResponse` (opens browser)

#### E21: GET `/api/v1/system/performance/history`
- **Query Params:** `limit` (int, 1-1440, default 60)
- **Response:** `{success: true, data: [{timestamp, event_loop_lag, cpu_percent, memory_percent}, ...]}`

#### E22: GET `/api/v1/system/personalities`
- **Response:** `{success: true, data: [{id: "stark", name: "Stark Legacy", accent: "#facc15"}, ...]}`

#### E23: POST `/api/v1/system/personality/{p_id}`
- **Path Params:** `p_id` — "stark" | "midnight" | "avenue" | "linear"
- **Success:** `{success: true, message: "Personality set to stark", config: {name, accent, primary, secondary, voice_pitch, voice_rate, style, motto, id}}`
- **Error:** 400 "Invalid personality ID"

#### E24: GET `/api/v1/system/command-insights`
- **Query Params:** `days` (int, 1-365, default 30)
- **Response:** `{success: true, data: {top_commands: [...], daily_activity: [...], peak_hour: {hour, count}, failure_patterns: [...], period_days: 30}}`

#### E25: GET `/api/v1/system/security/processes`
- **Response:** `{success: true, processes: [{pid, name, cpu_percent, memory_mb, status, threat_level: "safe"}, ...]}` — top 50 by CPU

#### E26: GET `/api/v1/system/security/connections`
- **Response:** `{success: true, connections: [{pid, process, local_addr, remote_addr, status}, ...]}`

#### E27: POST `/api/v1/system/security/quarantine`
- **Query Params:** `pid` (int), `action` ("suspend" | "resume" | "terminate", default "suspend")
- **Response:** `{success: bool, response: string}`

#### E28: GET `/api/v1/settings`
- **Response:** `{success: true, settings: {llm_provider, nvidia_model, openrouter_model, language, port, log_level, enable_dangerous_commands, confirmation_timeout, wake_word_enabled, wake_word_phrase}}`

#### E29: POST `/api/v1/settings`
- **Body:** `SettingsUpdateRequest` (partial):
  ```json
  {
    "llm_provider": "openrouter | nvidia | openai | google | ollama",
    "enable_dangerous_commands": true,
    "confirmation_timeout": 30,
    "wake_word_enabled": true,
    "wake_word_phrase": "jarvis"
  }
  ```
- **Response:** Full settings object (same as GET)

#### E30: GET `/api/v1/settings/keys`
- **Response:** `{NVIDIA_API_KEY: true|false, OPENROUTER_API_KEY: true|false, BACKEND_API_KEY: true|false}` — returns whether each key is set, not the key value

#### E31: POST `/api/v1/settings/keys`
- **Body:** `ApiKeyUpdateRequest` (partial):
  ```json
  {
    "nvidia_api_key": "nvapi-...",
    "openrouter_api_key": "sk-or-...",
    "gemini_api_key": "AIza...",
    "backend_api_key": "..."
  }
  ```
- **Response:** `{success: true, response: "Updated N keys in .env"}`

#### E32: POST `/api/v1/settings/test-key`
- **Body:** `{provider: "string", api_key: "string"}`
- **Response:** `{success: true, response: "Verified {provider} key (simulated)"}` — ⚠️ **Note: Simulated, not actually tested**

#### E33: POST `/api/v1/agent/chat`
- **Auth:** X-API-Key header + rate limited (30 req/min per IP)
- **Body:** `AgentQuery {query: string (1-2000), language: "en"|"hi"|"hinglish", stream: false, use_rag: false, session_id: string|null}`
- **Response:** `{success: true, response: "string", provider: "openrouter"|"nvidia"|..., language: "en"}`
- **Errors:** 422 (validation), 429 (rate limit), 500

#### E34: POST `/api/v1/agent/stream`
- **Auth:** X-API-Key header + rate limited (15 req/min per IP)
- **Body:** Same as E33 with `stream: true`
- **Response:** Server-Sent Events (SSE) stream:
  - `data: {"type": "meta", "provider": "...", "language": "..."}\n\n`
  - `data: {"type": "chunk", "text": "..."}\n\n`
  - `data: {"type": "done", "full_text": "..."}\n\n`
  - On error: `data: {"type": "error", "error": "..."}\n\n`
  - On partial: `data: {"type": "partial_done", "full_text": "...", "truncated": true}\n\n`
- **Errors:** 422, 429, errors emitted in-stream with `type: "error"`

#### E35: GET `/api/v1/agent/health`
- **Auth:** None (health-exempt)
- **Response:** `{success: true, online: bool, active_provider: string|null}`

#### E36: WS `/api/v1/audio/ws/audio`
- **Query Params:** `language` (default "en"), `api_key` (for non-local auth)
- **Message Protocol (JSON):**
  - **STT:** `{"type": "stt", "audio": "<base64>"}` → response: `{"type": "stt_result", "text": "..."}` or `{"type": "error", "error": "..."}`
  - **TTS:** `{"type": "tts", "text": "...", "voice": "alloy"}` → response: `{"type": "tts_audio", "audio": "<base64>", "format": "opus"}` or `{"type": "tts_error", "error": "..."}`
  - **TTS Stream:** `{"type": "tts_stream", "text": "...", "voice": "alloy"}` → stream: `{"type": "tts_chunk", "audio": "<base64>", "format": "opus"}` per chunk + `{"type": "tts_end"}`
  - **Ping:** `{"type": "ping"}` → response: `{"type": "pong"}`
- **Limits:** Max audio payload 10 MB, max TTS text 2000 chars

#### E37: WS `/ws`
- **Query Params:** `client_id`, `token`, `device_id`, `api_key` (optional)
- **Auth:** API key for non-local; device auth for mobile
- **Message Protocol (JSON):**
  - **Command:** `{"type": "command", "command": "...", "language": "en"|"hi"|"hinglish", "params": {...}, "session_id": "..."}` → response: `{"type": "command_result", "data": {...}}`
  - **Confirmation:** `{"type": "confirmation", "data": {"confirmation_id": "...", "approved": true}}` → response: `{"type": "notification", "data": {...}}`
  - **Ping:** `{"type": "ping"}` → response: `{"type": "pong"}`
  - **Get Status:** `{"type": "get_status"}` → response: `{"type": "system_status", "data": {...}}`
- **Server Broadcasts (no request needed):**
  - `{"type": "system_status", "data": {...}, "timestamp": "..."}` (every 5 sec)
  - `{"type": "notification", "data": {"title": "...", "message": "...", "type": "info|warning|error|success", "duration": 5000}}`
  - `{"type": "proactive_suggestion", "data": {"text": "...", "timestamp": "..."}}`
  - `{"type": "agent_thinking", "session_id": "..."}`
  - `{"type": "agent_thinking", "data": {"thought": "...", "session_id": "..."}}`
  - `{"type": "agent_resolved", "data": {"full_response": "...", "session_id": "..."}}`

---

## B. DATA MODELS & ENTITIES

| Model | Storage | Fields | Relationships | Used By Endpoints |
|-------|---------|--------|---------------|-------------------|
| **ConversationEntry** | SQLite `conversations` | id (PK, auto), timestamp, user_input, jarvis_response, command_type, success (bool), context (JSON), language, session_id | FK to sessions via session_id | E4, E21, E24, E37 |
| **MemoryEntry** | SQLite `memory` | id (PK, auto), key (unique), value, category, created_at, updated_at, confidence (float), source | - | E4 (via command `save_memory`) |
| **Session** | SQLite `sessions` | id (PK, auto), session_id (unique), started_at, ended_at, command_count, metadata | has_many conversations | E4 |
| **PerformanceMetric** | SQLite `performance_metrics` | id (PK, auto), timestamp, event_loop_lag, cpu_percent, memory_percent | - | E21, E37 (auto-saved) |
| **PairedDevice** | SQLite `paired_devices` | id (PK, auto), device_id (unique), device_name, device_type, access_token, paired_at, last_seen | - | E37 |
| **QuickAction** | SQLite `quick_actions` | id (PK, auto), label, command, icon, order | - | ❌ No endpoint exposes this |
| **ScheduledTask** | JSON file `scheduled_tasks.json` | id, name, description, command, schedule_type, schedule_time, days, enabled, created_at, last_run, run_count, parameters, condition | - | ❌ No REST endpoint (internal only) |
| **Macro** | JSON file `macros.json` | id, name, description, commands (array), trigger, trigger_phrase, hotkey, enabled, created_at, run_count | - | ❌ No REST endpoint (internal only) |
| **Contact** | JSON file `contacts.json` | Dynamic key-value: alias → {name, phone} or string | - | ❌ No REST endpoint (internal only) |
| **Config** | JSON file `config.json` | language, llm_provider, nvidia_model, openrouter_model, confirmation_timeout, wake_word_enabled, wake_word_phrase, enable_dangerous_commands, personality, etc. | - | E28, E29, E23 |
| **MemoryNode** | Markdown `.md` files | name, path, size, updated_at, is_core (derived) | - | ❌ No REST endpoint (internal to agent) |

---

## C. AUTHENTICATION & AUTHORIZATION

### Strategy: API Key (Bearer via X-API-Key header or WS query param)

- **Key resolution:** `get_backend_api_key()` checks `BACKEND_API_KEY` then `VITE_JARVIS_API_KEY` (env vars)
- **Localhost bypass:** Requests from `127.0.0.1`, `localhost`, `::1` skip auth
- **Health exemption:** `/api/v1/health`, `/api/v1/agent/health`, `/api/v1/ready`, `/api/v1/live`, `/api/v1/audio/` are auth-exempt
- **WS auth:** API key passed as `?api_key=` query param (browsers can't set WS headers) + constant-time `hmac.compare_digest()`
- **Mobile device auth:** Additional `device_id` + `token` validation against `paired_devices` table
- **Rate limiting:** Per-route, in-memory, per-client-IP
  - `POST /api/v1/agent/chat`: max 30 req/min
  - `POST /api/v1/agent/stream`: max 15 req/min
- **Roles:** None. Single-user desktop assistant with no role-based access control.
- **Frontend expectation:** The frontend must include `X-API-Key: <key>` header in all REST calls except health endpoints.

### Protected vs Public Routes

| Public (no auth) | Protected (X-API-Key required) |
|-----------------|-------------------------------|
| `/api/v1/health` | All `/api/v1/system/*` |
| `/api/v1/agent/health` | All `/api/v1/settings` and `/api/v1/settings/*` |
| `/api/v1/ready` | `/api/v1/command` |
| `/api/v1/live` | `/api/v1/confirm/*` |
| `/api/v1/audio/ws/audio` (WS — auth via query param) | `/api/v1/pending` |
| `/` | `/api/v1/agent/chat` |
| `/favicon.ico` | `/api/v1/agent/stream` |
| | `/ws` (WS — auth via query param) |

---

## D. BUSINESS LOGIC & RULES

### Dangerous Commands (Require Confirmation)
The following commands require user confirmation via `/api/v1/confirm/{id}` or WS confirmation:
- `shutdown`, `restart`, `sleep`, `hibernate`
- `delete` (file), `remove`, `format`, `uninstall`
- Empty recycle bin, close app, send WhatsApp message via desktop

**Confirmation flow:**
1. User issues a dangerous command → server returns `requires_confirmation: true`, `confirmation_id: "uuid"`
2. Frontend must show a confirmation dialog
3. User approves/rejects → POST `/confirm/{id}` with `{approved: true/false}`
4. Confirmation has timeout (`CONFIRMATION_TIMEOUT`, default 30 sec)
5. If timeout → auto-rejected → logged to neural memory

### Bilingual Support
- Language detection in parser: Hindi (Devanagari + Latin script Hinglish keywords) vs English
- All system responses available in `en` and `hi`
- Language param on most endpoints
- Auto-persist `preferred_language` setting in memory

### Agent Flow
1. User command → bilingual parser extracts `command_key`
2. Direct dispatch if known command (70+ command keys)
3. If `command_key == "unknown"` → autonomous agent loop (max 5 iterations)
4. Agent uses ReAct loop: Thought → Action → Observation
5. Dangerous actions blocked in agent (requires manual confirmation)
6. Agent can use tools: system_status, google_search, open_app, close_app, whatsapp_message, take_screenshot, search_files, read_file, analyze_screen, get_screen_summary, narrate_screen, ocr_image, get_clipboard, set_clipboard, get_time, save_memory, list_memories

### Proactive System
- Backend broadcasts `system_status` every 5 seconds via WebSocket
- Backend broadcasts `proactive_suggestion` based on active window context via LLM analysis every 15 seconds
- System health: low battery alert (<20%, not charging) and high CPU alert (>90%) broadcast as notifications
- 5-minute periodic conversation pruning to prevent unbounded table growth (max 500 old entries)

### Context Management
- Extracts personal facts from conversation (name, location, birthday, profession, preferences, contacts)
- Detects user mood (frustrated, happy, urgent, neutral)
- Tracks conversation topics
- Generates context-aware follow-up suggestions

### File Uploads
- **No file upload REST endpoints exist** in the backend
- Screenshots are generated server-side and returned as base64 `data:image/png;base64,...`
- Audio for STT is received via WebSocket as base64

---

## E. ERROR PATTERNS

### Standard Error Response Shape
```json
{
  "success": false,
  "error": "Descriptive error message",
  "response": "Optional human-readable fallback",
  "request_id": "uuid (included for 500 errors)",
  "timestamp": "2026-07-08T12:00:00"
}
```

### Error Code Map

| HTTP Status | Condition | Response Shape | Frontend Handling |
|-------------|-----------|---------------|-------------------|
| **400** | SQL injection pattern detected (blocked by middleware) | `{success: false, error: "Invalid input pattern detected"}` | Show generic "Invalid input" error |
| **400** | Missing required fields (e.g., empty command) | `{detail: "Command not provided"}` | Show field validation error |
| **403** | Invalid/missing API Key | `{success: false, detail: "Invalid or missing API Key"}` | Redirect to settings/API key config |
| **413** | Request body too large (>512KB) | `{success: false, error: "Request body too large"}` | Show size limit error |
| **422** | Pydantic validation failure | Standard FastAPI 422 with field errors | Show per-field validation errors |
| **429** | Rate limit exceeded | `{detail: "Rate limit exceeded (X req/min)"}` | Show "Too many requests" with retry timer |
| **500** | Unhandled server error | `{success: false, error: "An internal server error occurred", request_id, timestamp}` | Show generic error with request_id for debugging |
| **1008 (WS)** | Unauthorized WebSocket | Connection closed code 1008 | Reconnect with valid API key |

---

# PHASE 2 — FRONTEND REQUIREMENTS DOCUMENT

## 📄 PAGES REQUIRED

### PAGE-1: Home / Landing
- **Route:** `/`
- **Access:** Public
- **Purpose:** Main landing that serves as both a dashboard and the primary voice assistant interface. Shows system status overview and provides quick command input.

**API Calls on This Page:**

| Call # | Method + Endpoint | When Triggered | What Updates on UI |
|--------|------------------|----------------|-------------------|
| C1 | WS `/ws` | On page load | All real-time updates (system_status, notifications, proactive_suggestions, agent_thinking) |
| C2 | GET `/api/v1/system/status` | On mount (REST fallback) | Initial system status |
| C3 | POST `/api/v1/command` | When user submits text command | Command result display |

**UI Sections:**
1. **System Status Bar** — Real-time CPU%, RAM%, battery%, volume, uptime (updated via WS every 5s). Shows `status.battery.percent`, `status.battery.is_charging`, `status.cpu.percent`, `status.memory.percent`, `status.volume`, `status.uptime`.
2. **Command Input** — Text input field + submit button. Sends to `POST /command`. Shows loading spinner during execution. Displays result response text.
3. **Conversation Log** — Scrollable list of user commands and JARVIS responses. Stored in-memory for session. Could optionally fetch history via WS.
4. **Notification Area** — Toast notifications for system events (low battery, high CPU, confirmation requests, proactive suggestions). Display from WS `type: "notification"` and `type: "proactive_suggestion"`.
5. **Active Window Card** — Shows `status.active_window.title` and `status.active_window.process`. Styled as a glass-panel card.
6. **Quick Actions Toolbar** — Buttons for: volume up/down, mute, screenshot, system status refresh.
7. **Personality Indicator** — Shows current personality. Shows `status.personality.name`, accent color.

**Page States:**
- **Loading:** Skeleton/spinner while connecting WebSocket
- **Connected:** Full UI active
- **Disconnected:** Show reconnection banner, attempt reconnect every 3s
- **Error:** Show error banner if WS fails permanently

---

### PAGE-2: Settings / Configuration
- **Route:** `/settings`
- **Access:** Protected (requires valid API key in store)
- **Purpose:** View and modify all JARVIS settings, API keys, personality selection, dangerous command preferences.

**API Calls on This Page:**

| Call # | Method + Endpoint | When Triggered | What Updates on UI |
|--------|------------------|----------------|-------------------|
| C4 | GET `/api/v1/settings` | On mount | All settings fields |
| C5 | GET `/api/v1/settings/keys` | On mount | API key status indicators |
| C6 | POST `/api/v1/settings` | On save | Updated settings display |
| C7 | POST `/api/v1/settings/keys` | On API key save | Key status indicators |
| C8 | POST `/api/v1/settings/test-key` | On "Test Key" click | Test result message |
| C9 | GET `/api/v1/system/personalities` | On mount | Personality list |
| C10 | POST `/api/v1/system/personality/{id}` | On personality select | Personality indicator + message |

**UI Sections:**
1. **General Settings Form**
   - LLM Provider (select: openrouter | nvidia | openai | google | ollama). Maps to `settings.llm_provider`.
   - Wake Word Toggle (checkbox). Maps to `settings.wake_word_enabled`.
   - Wake Word Phrase (text input). Maps to `settings.wake_word_phrase`.
   - Enable Dangerous Commands (checkbox). Maps to `settings.enable_dangerous_commands`.
   - Confirmation Timeout (number input, seconds). Maps to `settings.confirmation_timeout`.
2. **API Keys Section**
   - NVIDIA API Key (password input, masked). Maps to `nvidia_api_key`. Show set/unset status.
   - OpenRouter API Key (password input, masked). Maps to `openrouter_api_key`.
   - Gemini API Key (password input, masked). Maps to `gemini_api_key`.
   - Backend API Key (password input, masked). Maps to `backend_api_key`.
   - Each field has: "Test" button, "Save" button, status indicator (green dot = set, gray = unset).
3. **Personality Selection** — Grid of cards, one per personality. Shows name + accent color swatch. Active one highlighted. On click: POST to set.
4. **Information Display** — Read-only: nvidia_model, openrouter_model, port, log_level.

**Forms:**
- **Settings form:** Fields → select/toggle/input → client-side validation (confirmation_timeout: >= 5, wake_word_phrase: max 50 chars) → API field: exact match to SettingsUpdateRequest → On success: toast "Settings saved" → On error: toast with error
- **API Keys form:** Fields → password input → no client validation → API field: ApiKeyUpdateRequest → On success: toast "Keys updated" → On failure: toast with error

**Page States:** Loading (skeleton), Loaded, Saving (disable form), Error (alert banner)

---

### PAGE-3: System Dashboard / Analytics
- **Route:** `/analytics`
- **Access:** Protected
- **Purpose:** Detailed system monitoring, performance history, command insights, security overview.

**API Calls on This Page:**

| Call # | Method + Endpoint | When Triggered | What Updates on UI |
|--------|------------------|----------------|-------------------|
| C11 | GET `/api/v1/system/performance/history?limit=1440` | On mount | Performance charts |
| C12 | GET `/api/v1/system/command-insights?days=30` | On mount | Command analytics |
| C13 | GET `/api/v1/system/security/processes` | On mount or refresh | Process list |
| C14 | GET `/api/v1/system/security/connections` | On mount or refresh | Network connections |
| C15 | POST `/api/v1/system/security/quarantine?pid=X&action=suspend` | On "Suspend" button | Process list update |
| C16 | GET `/api/v1/system/network` | On mount | Network info |

**UI Sections:**
1. **Performance Charts** — Line charts for CPU %, Memory %, Event Loop Lag over time. X = time, Y = percentage. Use data from `/performance/history`.
2. **Command Insights** — Bar chart of top commands, daily activity line chart, peak hour display, failure patterns table.
3. **Running Processes** — Table with columns: PID, Name, CPU%, Memory MB, Status, Threat Level, Actions (Suspend/Resume/Terminate buttons). Top 50 by CPU.
4. **Network Security** — Table of active connections: PID, Process, Local Address, Remote Address, Status.
5. **Network Info Card** — Hostname, IP address, interfaces list.

**Page States:** Loading (skeleton charts), Loaded, Refresh spinner, Error states per section

---

### PAGE-4: Audio / Voice Interface *(optional but implied by backend)*
- **Route:** `/voice` (or integrated into Home)
- **Access:** Protected
- **Purpose:** Full voice interaction using Web Audio API + WebSocket. Record mic → send to STT → display result → send to command → read response via TTS.

**API Calls on This Page:**

| Call # | Method + Endpoint | When Triggered | What Updates on UI |
|--------|------------------|----------------|-------------------|
| C17 | WS `/api/v1/audio/ws/audio` | On voice mode start | Speech recognition results, audio playback |
| C18 | POST `/api/v1/command` or WS `/ws` command | After STT result | Command result display |
| C19 | POST `/api/v1/agent/stream` | For LLM chat responses | Streaming text display |

**UI Sections:**
1. **Mic Button** — Big button, pulsing when recording. Toggle on/off.
2. **Audio Waveform** — Live audio visualization during recording.
3. **Transcript Display** — Shows `stt_result.text` as it comes in.
4. **Response Display** — Shows command result or agent response.
5. **TTS Playback Indicator** — Shows when TTS audio is playing.

**Page States:** Idle, Recording, Transcribing, Processing, Speaking, Error

---

## 🧩 COMPONENTS REQUIRED

### COMP-1: SystemStatusBar
- **Type:** UI Component
- **Used On Pages:** PAGE-1, PAGE-3
- **Props:** `status: SystemStatusResponse` (from WS or REST)
- **Behavior:** Displays CPU%, RAM%, battery% (with icon & color), volume slider preview, uptime. Auto-updates on new status data. Shows charging indicator for battery.
- **API dependency:** Receives data from parent (fed by WS message type `system_status`)
- **States:** Loading (skeleton bars), Normal, Warning (cpu > 80, battery < 20), Error

### COMP-2: CommandInput
- **Type:** Form
- **Used On Pages:** PAGE-1
- **Props:** `onSubmit: (command, language) => void`, `disabled: boolean`
- **Behavior:** Text input with language toggle (EN/HI/Hinglish) and submit button. Auto-focus on mount. Keyboard shortcut: Enter to submit.
- **States:** Default, Focused, Disabled (during processing), Error (validation)

### COMP-3: ConversationLog
- **Type:** UI Component
- **Used On Pages:** PAGE-1
- **Props:** `entries: Array<{type: 'user'|'jarvis', text: string, timestamp: string, action_type?: string}>`
- **Behavior:** Scrollable list. User messages right-aligned. JARVIS messages left-aligned with icon. Shows typing indicator while waiting for response.
- **States:** Empty ("Start by typing or speaking a command"), Active, Typing indicator

### COMP-4: NotificationToast
- **Type:** UI Component
- **Used On Pages:** PAGE-1, PAGE-2, PAGE-3
- **Props:** `id, title, message, type: 'info'|'success'|'warning'|'error', duration: number, onDismiss`
- **Behavior:** Auto-dismiss after duration (default 5000ms). Stack multiple notifications. Click to dismiss.
- **States:** Entering, Visible, Exiting

### COMP-5: ConfirmationDialog
- **Type:** Modal
- **Used On Pages:** PAGE-1
- **Props:** `command: string, details: string, onApprove: () => void, onReject: () => void, timeout: number`
- **Behavior:** Shows "This command requires confirmation" + command details. Approve/Reject buttons. Countdown timer showing remaining time (default 30s). Auto-rejects on timeout.
- **States:** Open (with timer), Approving (loading), Rejecting (loading), Timed Out

### COMP-6: PersonalityCard
- **Type:** Card
- **Used On Pages:** PAGE-2
- **Props:** `personality: {id, name, accent}, isActive: boolean, onClick: (id) => void`
- **Behavior:** Shows name, accent color swatch. Active card has border glow using accent color. Clickable.
- **States:** Default, Active, Hover

### COMP-7: PerformanceChart
- **Type:** Widget
- **Used On Pages:** PAGE-3
- **Props:** `data: Array<{timestamp, value}>, label: string, color: string, yAxisLabel: string`
- **Behavior:** Renders a line/area chart. Responsive. Tooltip on hover.
- **States:** Loading (skeleton), Empty (no data), Data, Error

### COMP-8: ProcessTable
- **Type:** Table
- **Used On Pages:** PAGE-3
- **Props:** `processes: Array<{pid, name, cpu_percent, memory_mb, status, threat_level}>, onAction: (pid, action) => void`
- **Behavior:** Sortable by columns (click header). Action buttons (Suspend/Resume/Terminate) per row. Suspended processes grayed out.
- **States:** Loading, Empty ("No processes available"), Data, Action loading

### COMP-9: ApiKeyCard
- **Type:** Card
- **Used On Pages:** PAGE-2
- **Props:** `name: string, value: string|null, isSet: boolean, onChange: (value) => void, onTest: () => void`
- **Behavior:** Label, password input (with show/hide toggle), green/gray status dot, "Test" button, "Save" button.
- **States:** Hidden/Visible password, Unset/Set, Testing, Saving, Test Result

### COMP-10: SettingsToggle
- **Type:** UI Component
- **Used On Pages:** PAGE-2
- **Props:** `label: string, description: string, checked: boolean, onChange: (checked) => void`
- **Behavior:** Toggle switch with label and description text.
- **States:** On, Off

### COMP-11: LoadingOverlay
- **Type:** UI Component
- **Used On Pages:** All
- **Props:** `visible: boolean, message?: string`
- **Behavior:** Full-screen or container overlay with spinner and optional message.
- **States:** Visible, Hidden

### COMP-12: ErrorBoundary
- **Type:** UI Component
- **Used On Pages:** All
- **Props:** `children, fallback?: ReactNode`
- **Behavior:** Catches rendering errors. Shows fallback UI with "Something went wrong" message + retry button.

### COMP-13: VoiceButton (optional, for PAGE-4)
- **Type:** UI Component
- **Props:** `isRecording: boolean, onToggle: () => void, disabled: boolean`
- **Behavior:** Animated mic button. Pulsing ring when recording. Red when active, gray when idle.
- **States:** Idle, Recording, Processing, Disabled

### COMP-14: AudioWaveform (optional, for PAGE-4)
- **Type:** UI Component
- **Props:** `analyserNode: AnalyserNode | null`
- **Behavior:** Real-time audio frequency visualization using Canvas API.
- **States:** Idle (flat line), Active (moving bars), Hidden

### COMP-15: QuickActionsBar
- **Type:** UI Component
- **Used On Pages:** PAGE-1
- **Props:** `onAction: (actionKey: string) => void`
- **Behavior:** Horizontal row of icon buttons: volume up, volume down, mute/unmute, take screenshot, system status.
- **States:** Normal, Processing (disabled during action)

---

## ⚡ FUNCTIONS / HOOKS / SERVICES REQUIRED

### FN-1: useWebSocket
- **Type:** Custom hook
- **Purpose:** Manages a WebSocket connection to `/ws` with auto-reconnect, message parsing, and typed event callbacks
- **Input:** `apiKey: string`, `options: {onMessage, onStatus, onNotification, onSuggestion}`
- **Returns:** `{ send, isConnected, reconnect }`
- **Logic:**
  1. Connect to `ws://{host}/ws?api_key={apiKey}&client_id={uuid}`
  2. Parse incoming JSON messages
  3. Dispatch to registered callbacks based on `type` field
  4. Auto-reconnect on disconnect (3s delay, max 10 retries)
  5. Send heartbeat ping every 30 seconds
  6. On reconnect, re-query system status
- **Error handling:** Catch WebSocket errors, trigger reconnection

### FN-2: useAudioWebSocket
- **Type:** Custom hook
- **Purpose:** Manages a WebSocket connection to `/api/v1/audio/ws/audio` for STT/TTS
- **Input:** `apiKey: string`, `language: string`
- **Returns:** `{ sendAudio, requestTTS, requestTTSStream, isConnected }`
- **Logic:**
  1. Connect to `ws://{host}/api/v1/audio/ws/audio?api_key={apiKey}&language={lang}`
  2. `sendAudio(blob)` → reads blob as base64 string → sends `{type: "stt", audio: base64}` → parses `stt_result`
  3. `requestTTS(text, voice)` → sends `{type: "tts", text, voice}` → receives `tts_audio` → plays via Web Audio API
  4. `requestTTSStream(text, voice)` → sends `{type: "tts_stream", text, voice}` → receives `tts_chunk` chunks → plays incrementally

### FN-3: apiService
- **Type:** API call library (singleton object)
- **Purpose:** All REST API calls, typed, with auth header injection
- **Used by:** All pages and components
- **Functions:**

```typescript
// Health
getHealth(): Promise<HealthReport>
getReady(): Promise<{status, database}>
getLive(): Promise<{status}>

// Command
executeCommand(data: CommandRequest): Promise<CommandResult>
confirmAction(confirmationId: string, data: ConfirmationRequest): Promise<BaseResponse>
getPendingActions(): Promise<Record<string, any>>

// System
getSystemStatus(language?: string): Promise<SystemStatusResponse>
getBattery(language?: string): Promise<BatteryResponse>
getTime(language?: string): Promise<TimeResponse>
getDate(language?: string): Promise<DateResponse>
shutdownSystem(language?: string, confirmed?: boolean): Promise<BaseResponse>
restartSystem(language?: string, confirmed?: boolean): Promise<BaseResponse>
sleepSystem(language?: string, confirmed?: boolean): Promise<BaseResponse>
volumeUp(amount?: number, language?: string): Promise<VolumeResponse>
volumeDown(amount?: number, language?: string): Promise<VolumeResponse>
toggleMute(language?: string): Promise<BaseResponse>
getUptime(language?: string): Promise<UptimeResponse>
getNetworkInfo(language?: string): Promise<NetworkInfoResponse>
getWeather(city?: string, language?: string): Promise<BaseResponse>
googleSearch(query: string, language?: string): Promise<BaseResponse>
getPerformanceHistory(limit?: number): Promise<{success, data: PerformanceEntry[]}>
getPersonalities(): Promise<{success, data: PersonalityInfo[]}>
setPersonality(id: string): Promise<{success, message, config}>
getCommandInsights(days?: number): Promise<{success, data: CommandInsights}>
getRunningProcesses(): Promise<{success, processes: ProcessInfo[]}>
getNetworkConnections(): Promise<{success, connections: ConnectionInfo[]}>
quarantineProcess(pid: number, action: string): Promise<{success, response}>

// Settings
getSettings(): Promise<SettingsResponse>
updateSettings(data: SettingsUpdateRequest): Promise<SettingsResponse>
getApiKeyStatus(): Promise<ApiKeyStatusResponse>
updateApiKeys(data: ApiKeyUpdateRequest): Promise<BaseResponse>
testApiKey(provider: string, apiKey: string): Promise<BaseResponse>

// Agent
chatWithAgent(query: AgentQuery): Promise<AgentChatResponse>
streamAgentChat(query: AgentQuery): Promise<EventSource> // SSE
getAgentHealth(): Promise<AgentHealthResponse>
```

- **Error handling:** All functions catch HTTP errors and throw typed `ApiError` with status and message.

### FN-4: authService
- **Type:** Auth helper
- **Purpose:** Manage API key storage, validation, and injection
- **Input:** None
- **Returns:** `{ getApiKey, setApiKey, clearApiKey, hasApiKey, getAuthHeaders }`

**Logic:**
1. `getApiKey()` → reads `BACKEND_API_KEY` from localStorage
2. `setApiKey(key)` → writes to localStorage
3. `clearApiKey()` → removes from localStorage
4. `hasApiKey()` → returns boolean
5. `getAuthHeaders()` → returns `{"X-API-Key": key}` object (empty object if no key)

### FN-5: useAudioRecorder
- **Type:** Custom hook (optional, for voice features)
- **Purpose:** Record microphone audio using Web Audio API, return audio blob
- **Input:** None
- **Returns:** `{ isRecording, startRecording, stopRecording, audioBlob, error }`
- **Logic:**
  1. Request `navigator.mediaDevices.getUserMedia({audio: true})`
  2. Pipe to MediaRecorder with `audio/webm` codec
  3. On stop, return blob
- **Error handling:** Catch permission denied, no microphone

### FN-6: notificationService
- **Type:** Utility
- **Purpose:** Manage in-app notification queue, display toasts
- **Logic:**
  1. `addNotification({title, message, type, duration})` → adds to queue
  2. Auto-removes after duration
  3. Max 5 concurrent notifications
  4. Deduplicate by title+message

### FN-7: useSSE
- **Type:** Custom hook
- **Purpose:** Connect to Server-Sent Events for agent streaming
- **Input:** `url: string, options: FetchOptions`
- **Returns:** `{ data: StreamEvent, isConnected, error, start, stop }`

**Logic:**
1. POST to `POST /api/v1/agent/stream` with fetch + `ReadableStream`
2. Parse `data: ...` lines
3. Dispatch `{type: "meta"}`, `{type: "chunk"}`, `{type: "done"}` etc.
4. Handle `{type: "error"}` and `{type: "partial_done"}` gracefully

### FN-8: formatters
- **Type:** Utility module
- **Purpose:** Format data for display
- **Functions:**
  - `formatBytes(bytes: number): string` → "1.5 MB", "2.3 GB"
  - `formatUptime(seconds: number): string` → "2d 5h 30m"
  - `formatDate(iso: string): string` → "Friday, May 15, 2026"
  - `formatTime(iso: string): string` → "10:00 AM"
  - `truncate(text: string, max: number): string` → "hello..." (max 200 chars)
  - `formatPercent(value: number): string` → "85%"

### FN-9: validators
- **Type:** Utility module
- **Purpose:** Client-side validation (mirroring backend rules)
- **Functions:**
  - `validateCommand(text: string): {valid: boolean, error?: string}` — min 1 char, max 500 chars
  - `validateQuery(text: string): {valid: boolean, error?: string}` — min 1 char, max 2000 chars
  - `validateLanguage(lang: string): boolean` — must be "en", "hi", or "hinglish"
  - `validateConfirmationTimeout(seconds: number): boolean` — must be >= 5, <= 300
  - `validateWakeWord(text: string): boolean` — max 50 chars

---

## 🔐 AUTH FLOWS TO IMPLEMENT

### Flow 1: Login (API Key Entry)
1. User navigates to settings page
2. If `authService.hasApiKey()` is false → show API key entry prompt
3. User enters `BACKEND_API_KEY`
4. Called `authService.setApiKey(key)`
5. Test by calling `GET /api/v1/system/status` (first non-health endpoint)
6. If 403 → show "Invalid API Key" error, clear key
7. If 200 → store key, enable all protected features
8. **No backend login endpoint exists** — API key is the sole auth mechanism

### Flow 2: Logout
1. User clicks "Disconnect" / "Clear API Key"
2. `authService.clearApiKey()`
3. Close all WebSocket connections
4. Redirect to home page (public mode)
5. All protected calls will now 403

### Flow 3: Persistent Session
1. On app start, check `localStorage` for api key
2. If found → attempt GET `/api/v1/system/status`
3. If success → full app mode
4. If 403 → clear key, show key entry prompt
5. If network error → show offline mode banner

### Flow 4: WebSocket Auth
1. Open WS connection: `new WebSocket("ws://{host}/ws?api_key={key}&client_id={uuid}")`
2. If server rejects → `close` with code 1008 → attempt reconnection with 3s delay (max 3 attempts)
3. If reconnection fails → show "WebSocket disconnected" banner, fall back to REST polling

---

## 🌐 STATE MANAGEMENT REQUIREMENTS

### Global State Slices

```
AppState {
  auth: {
    apiKey: string | null
    isAuthenticated: boolean
    isCheckingAuth: boolean
  }

  webSocket: {
    isConnected: boolean
    clientId: string
    reconnectAttempts: number
  }

  systemStatus: SystemStatusResponse | null

  conversation: {
    entries: Array<{type: 'user'|'jarvis', text: string, timestamp: string, action_type: string | null}>
    isProcessing: boolean
  }

  notifications: Array<{
    id: string
    title: string
    message: string
    type: 'info'|'success'|'warning'|'error'
    duration: number
  }>

  settings: {
    data: SettingsData | null
    isLoading: boolean
  }

  pendingConfirmations: Array<{
    id: string
    command: string
    details: string
    timeout: number
    expiresAt: number
  }>
}
```

### Persistence Strategy
- **localStorage:** `BACKEND_API_KEY` (auth), `preferred_language`, `personality_id`
- **sessionStorage:** Nothing (all transient)
- **Cookies:** Nothing (API key is localStorage + header)
- **Clear on logout:** WebSocket connections, conversation entries, system status cache

---

## 📡 API INTEGRATION LAYER

### Base Configuration

```typescript
// api/client.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_PREFIX = "/api/v1";

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: inject X-API-Key
apiClient.interceptors.request.use((config) => {
  const key = authService.getApiKey();
  if (key) {
    config.headers["X-API-Key"] = key;
  }
  return config;
});

// Response interceptor: global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      authService.clearApiKey();
      window.dispatchEvent(new CustomEvent("auth:invalid-key"));
    }
    if (error.response?.status === 429) {
      // Rate limit — could dispatch notification
    }
    return Promise.reject(error);
  }
);
```

### WebSocket Base

```typescript
// api/websocket.ts
const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
const WS_PATH = "/ws";
const AUDIO_WS_PATH = "/api/v1/audio/ws/audio";
```

### All Service Functions (by Entity)

**Health Service:**
- `healthApi.getHealth()` → GET `/health`
- `healthApi.getReady()` → GET `/ready`
- `healthApi.getLive()` → GET `/live`

**Command Service:**
- `commandsApi.execute(data: CommandRequest)` → POST `/command`
- `commandsApi.confirm(id: string, data: ConfirmationRequest)` → POST `/confirm/{id}`
- `commandsApi.getPending()` → GET `/pending`

**System Service:**
- `systemApi.getStatus(lang?)` → GET `/system/status`
- `systemApi.getBattery(lang?)` → GET `/system/battery`
- `systemApi.getTime(lang?)` → GET `/system/time`
- `systemApi.getDate(lang?)` → GET `/system/date`
- `systemApi.shutdown(lang?, confirmed?)` → POST `/system/shutdown`
- `systemApi.restart(lang?, confirmed?)` → POST `/system/restart`
- `systemApi.sleep(lang?, confirmed?)` → POST `/system/sleep`
- `systemApi.volumeUp(amount?, lang?)` → POST `/system/volume/up`
- `systemApi.volumeDown(amount?, lang?)` → POST `/system/volume/down`
- `systemApi.mute(lang?)` → POST `/system/mute`
- `systemApi.uptime(lang?)` → GET `/system/uptime`
- `systemApi.network(lang?)` → GET `/system/network`
- `systemApi.weather(city?, lang?)` → GET `/system/weather`
- `systemApi.search(query, lang?)` → POST `/system/search`
- `systemApi.performanceHistory(limit?)` → GET `/system/performance/history`
- `systemApi.personalities()` → GET `/system/personalities`
- `systemApi.setPersonality(id)` → POST `/system/personality/{id}`
- `systemApi.commandInsights(days?)` → GET `/system/command-insights`
- `systemApi.processes()` → GET `/system/security/processes`
- `systemApi.networkConnections()` → GET `/system/security/connections`
- `systemApi.quarantine(pid, action)` → POST `/system/security/quarantine`

**Settings Service:**
- `settingsApi.get()` → GET `/settings`
- `settingsApi.update(data)` → POST `/settings`
- `settingsApi.getKeys()` → GET `/settings/keys`
- `settingsApi.updateKeys(data)` → POST `/settings/keys`
- `settingsApi.testKey(provider, key)` → POST `/settings/test-key`

**Agent Service:**
- `agentApi.chat(data: AgentQuery)` → POST `/agent/chat`
- `agentApi.stream(data: AgentQuery)` → POST `/agent/stream` (returns Response for SSE parsing)
- `agentApi.health()` → GET `/agent/health`

---

## 🎨 UI/UX REQUIREMENTS FROM BACKEND LOGIC

### Validation (Client-Side Mirror)

| Field | Backend Rule | Frontend Validation | Message |
|-------|-------------|-------------------|---------|
| `command` | min_length=1, max_length=500 | Disable submit if empty. Max length 500. | "Command must be 1-500 characters" |
| `query` | min_length=1, max_length=2000 | Disable submit if empty. Max length 2000. Show counter. | "Query must be 1-2000 characters" |
| `language` | must match `^(en\|hi\|hinglish)$` | Dropdown/select limited to 3 options | N/A (no error possible) |
| `confirmation_timeout` | int >= 0 | Number input, min 5, max 300 | "Must be between 5 and 300 seconds" |
| `session_id` | max_length=100 | Auto-generated UUID. No user input needed. | N/A |
| Audio payload | Max 10 MB | Client-side mic recording chunked or limited | "Audio too long" |
| TTS text | Max 2000 chars | Truncate to 2000 on client side | "Text truncated to 2000 characters" |

### Conditional UI Rules

| Condition | UI Behavior |
|-----------|------------|
| `command_result.requires_confirmation === true` | Show ConfirmationDialog with command text and auto-generated `confirmation_id` |
| `system_status.battery.percent < 20 && !system_status.battery.is_charging` | Show persistent "Low Battery" warning banner |
| `system_status.cpu.percent > 90` | Show "High CPU Usage" notification via toast |
| `websocket_message.type === "notification"` | Show NotificationToast with title/message/type/duration |
| `websocket_message.type === "proactive_suggestion"` | Show suggestion chip/banner that user can click to execute |
| `websocket_message.type === "agent_thinking"` | Show "JARVIS is thinking..." indicator in conversation log |
| `action_type === "AGENT_RESOLVED"` | Display agent response with special styling in conversation log |
| `personality.config.accent` | Use as CSS custom property for primary accent color across UI |
| `is_macos()` platform detected | Adjust keyboard shortcuts display (Cmd vs Ctrl) |
| `enable_dangerous_commands === false` | Disable/hide shutdown, restart, delete buttons |
| Language is `"hi"` | UI language toggle affects all response text display |

### Proactive Suggestion Display
When a `proactive_suggestion` WS message is received, display a small, non-intrusive suggestion banner at the bottom of the screen with:
- Suggestion text (15 words max)
- "Dismiss" button
- "Execute" button (sends command)

### Confirmation Timer
When a `requires_confirmation` result is received, show a modal with:
- The dangerous command text
- A circular countdown timer (30 seconds default)
- "Approve" (green) and "Reject" (red) buttons
- Auto-reject + notification on timeout

### Personality Theme Application
- Personality `accent` color → CSS variable `--accent-color`
- Personality `primary` color → CSS variable `--primary-color`
- Personality `secondary` color → CSS variable `--secondary-color`
- All theme transitions should be smooth (300ms ease)

### File Uploads
- **Backend has no file upload endpoints.** Screenshots are generated server-side. Audio is sent via WebSocket base64. No file upload component needed.

---

## 📋 MASTER TASK LIST FOR FRONTEND TEAM

### 🔴 P0 — Critical (Build First) — Estimated: 5 days

| # | Task | Type | Hours | Depends On | Files |
|---|------|------|-------|-----------|-------|
| 1 | Set up React + Vite project with TypeScript, Tailwind CSS | Setup | 4 | - | `package.json`, `vite.config.ts`, `tsconfig.json` |
| 2 | Configure API client (axios) with base URL, auth interceptor, error handling | Service | 4 | 1 | `src/api/client.ts` |
| 3 | Implement `authService` with localStorage persistence | Service | 2 | - | `src/services/auth.ts` |
| 4 | Build `useWebSocket` hook with auto-reconnect + typed messages | Hook | 8 | 1 | `src/hooks/useWebSocket.ts` |
| 5 | Build PAGE-1 (Home): system status bar, command input, conversation log | Page | 10 | 2,3,4 | `src/pages/Home.tsx`, `src/components/...` |
| 6 | Build COMP-1 (SystemStatusBar) with all states | Component | 3 | 5 | `src/components/SystemStatusBar.tsx` |
| 7 | Build COMP-2 (CommandInput) with validation + language toggle | Component | 4 | 5 | `src/components/CommandInput.tsx` |
| 8 | Build COMP-4 (NotificationToast) with auto-dismiss | Component | 3 | 5 | `src/components/NotificationToast.tsx` |
| 9 | Build COMP-5 (ConfirmationDialog) with countdown timer | Component | 4 | 5 | `src/components/ConfirmationDialog.tsx` |

### 🟡 P1 — High Priority — Estimated: 6 days

| # | Task | Type | Hours | Depends On | Files |
|---|------|------|-------|-----------|-------|
| 10 | Build PAGE-2 (Settings) with forms for all settings + API keys | Page | 10 | 2 | `src/pages/Settings.tsx` |
| 11 | Build COMP-6 (PersonalityCard) grid with active state | Component | 3 | 10 | `src/components/PersonalityCard.tsx` |
| 12 | Build COMP-9 (ApiKeyCard) with show/hide toggle + test | Component | 4 | 10 | `src/components/ApiKeyCard.tsx` |
| 13 | Build COMP-10 (SettingsToggle) | Component | 2 | 10 | `src/components/SettingsToggle.tsx` |
| 14 | Implement full Settings API service functions | Service | 3 | 2 | `src/api/settings.ts` |
| 15 | Implement all system API service functions | Service | 4 | 2 | `src/api/system.ts` |
| 16 | Build PAGE-3 (Analytics): charts, process table, command insights | Page | 12 | 15 | `src/pages/Analytics.tsx` |
| 17 | Build COMP-7 (PerformanceChart) with chart library | Component | 6 | 16 | `src/components/PerformanceChart.tsx` |
| 18 | Build COMP-8 (ProcessTable) with sort + actions | Component | 6 | 16 | `src/components/ProcessTable.tsx` |

### 🟢 P2 — Standard — Estimated: 4 days

| # | Task | Type | Hours | Depends On | Files |
|---|------|------|-------|-----------|-------|
| 19 | Build COMP-3 (ConversationLog) with typing indicator | Component | 4 | 5 | `src/components/ConversationLog.tsx` |
| 20 | Build COMP-15 (QuickActionsBar) | Component | 3 | 5 | `src/components/QuickActionsBar.tsx` |
| 21 | Implement `useSSE` hook for agent streaming | Hook | 4 | 2 | `src/hooks/useSSE.ts` |
| 22 | Integrate `/agent/stream` into command flow (when command is AGENT_RESOLVED) | Feature | 6 | 21,5 | `src/services/agent.ts`, Home.tsx |
| 23 | Build state management (Context API or Zustand store) | State | 4 | 1 | `src/store/...` |
| 24 | Build notificationService | Service | 2 | - | `src/services/notifications.ts` |
| 25 | Build formatters utility | Utility | 2 | - | `src/utils/formatters.ts` |
| 26 | Build validators utility | Utility | 2 | - | `src/utils/validators.ts` |
| 27 | Route setup (react-router): /, /settings, /analytics | Setup | 2 | 1 | `src/App.tsx` |

### ⚪ P3 — Nice to Have / Polish — Estimated: 3 days

| # | Task | Type | Hours | Depends On | Files |
|---|------|------|-------|-----------|-------|
| 28 | Build PAGE-4 (Voice Interface) with mic recording | Page | 8 | 1 | `src/pages/Voice.tsx` |
| 29 | Build COMP-13 (VoiceButton) with animation | Component | 3 | 28 | `src/components/VoiceButton.tsx` |
| 30 | Build `useAudioRecorder` hook | Hook | 4 | 28 | `src/hooks/useAudioRecorder.ts` |
| 31 | Build `useAudioWebSocket` hook for audio WS | Hook | 6 | 4,28 | `src/hooks/useAudioWebSocket.ts` |
| 32 | Apply personality theme colors as CSS variables globally | UI | 2 | 11 | `src/styles/themes.css` |
| 33 | Add bilingual UI text support (en/hi toggle for labels) | Feature | 4 | 23 | `src/i18n/...` |
| 34 | Add keyboard shortcuts (Enter=submit, Escape=clear) | UI | 2 | 5 | `src/hooks/useKeyboardShortcuts.ts` |
| 35 | Add PWA support (manifest, service worker) | Setup | 3 | 1 | `public/manifest.json` |
| 36 | Add error boundary + global error tracking | Component | 2 | 1 | `src/components/ErrorBoundary.tsx` |

---

## 📊 FRONTEND COMPLEXITY REPORT

| Area | Count | Complexity |
|------|-------|------------|
| **Total Pages** | 4 (Home, Settings, Analytics, Voice) | Medium |
| **Total Components** | 15 | Medium |
| **Total API Calls (REST)** | ~30 unique endpoints | Medium-High |
| **WebSocket Message Types** | 9 inbound + 5 outbound | Medium |
| **Auth Flows** | 4 (Login, Logout, Session, WS Auth) | Low |
| **Forms** | 3 (Settings, API Keys, Command Input) | Low-Medium |
| **Protected Routes** | 3 (all except Home root) | Low |
| **Global State Slices** | 7 | Medium |
| **Custom Hooks** | 4 (useWebSocket, useAudioWS, useSSE, useAudioRecorder) | Medium |
| **Reusable Services** | 6 (api, auth, notifications, validators, formatters, i18n) | Low-Medium |

### Estimated Frontend Build Time
- **Solo developer:** 4–5 weeks (18 working days)
- **Team of 2:** 2.5–3 weeks (12 working days)
- **Team of 3+:** 2 weeks (10 working days)

### Recommended Tech Stack
| Layer | Technology | Reasoning |
|-------|-----------|-----------|
| **Framework** | React 18+ with Vite | Fast builds, modern ecosystem |
| **Language** | TypeScript (strict) | Type safety matching Pydantic models |
| **Styling** | Tailwind CSS v3 + CSS variables for themes | Matches JARVIS design system (glass-panel, neon-text, cyber-border) |
| **State** | Zustand (lightweight) | Simpler than Redux, fits single-user app |
| **Routing** | React Router v6 | Simple, well-supported |
| **Charts** | Recharts (for PAGE-3) | React-native, responsive |
| **WebSocket** | Native WebSocket API + custom hooks | No library needed; thin wrapper |
| **HTTP** | Axios | Interceptors for auth, timeout, error handling |
| **TTS/STT** | Web Speech API (SpeechRecognition + SpeechSynthesis) | Built into browsers; no extra deps |
| **SSE** | Fetch ReadableStream | No EventSource polyfill needed for POST-based SSE |

### Top 3 Frontend Risks

1. **WebSocket reliability on flaky connections** — The `useWebSocket` hook must handle disconnects gracefully, re-establish state, and not flood the server with reconnect attempts. Testing needed for: network toggle, sleep/wake, proxy issues.

2. **Confirmation timeout UX** — The 30-second confirmation timeout is server-enforced. The frontend must synchronize its countdown timer accurately and handle the race condition where the user clicks "Approve" simultaneously with server timeout. A "stale confirmation" error must be surfaced.

3. **SSE streaming across reverse proxies** — The backend returns SSE via `POST /api/v1/agent/stream` with `Cache-Control: no-cache` and `X-Accel-Buffering: no`. If a reverse proxy (nginx, Caddy) is in front, it may buffer the stream. The frontend must handle connection drops mid-stream and resume gracefully. The `partial_done` event type exists specifically for this scenario.

---

## ⚠️ UNCLEAR / AMBIGUITIES FLAGGED

1. **`/api/v1/settings/keys` returns booleans, not masked keys** — The frontend cannot pre-fill API key inputs because the backend only returns whether a key *is set* (true/false). Users must re-enter their keys each time they visit settings. This is intentional for security but may be UX-frustrating.

2. **`POST /api/v1/settings/test-key` is simulated** — The endpoint always returns `"Verified {provider} key (simulated)"` regardless of whether the key is actually valid. The frontend should still show this as "Key test passed" but add a note that it's a simulated check.

3. **`quick_actions` table in SQLite has no endpoint** — The backend creates a `quick_actions` table but there is no REST or WS endpoint to read/write it. ⚠️ **CLARIFY:** Is this table for future use? Should the frontend implement quick action buttons statically instead?

4. **Scheduled tasks and macros have no REST endpoints** — The `AutomationManager` operates entirely internally. There is no way for the frontend to list, create, or modify scheduled tasks or macros via API. ⚠️ **CLARIFY:** Are these meant to be managed through voice commands only?

5. **Device pairing flow has no complete API** — The models include `DevicePairingRequest`, `DevicePairingResponse`, `PairedDevice`, `SyncStatusResponse`, and `MobileTelemetryRequest`, but there are **no REST endpoints** for pairing, sync, or telemetry. The pairing manager exists in `utils/pairing.py` but has no route. ⚠️ **CLARIFY:** Is mobile pairing implemented elsewhere, or is this for future use?

6. **Audio WS `/api/v1/audio/ws/audio` has conflicting auth exemption** — In `main.py`, line 180: `/api/v1/audio/` is listed in `HEALTH_EXEMPT_PREFIXES`, meaning the middleware skips auth for it. But `audio.py` line 40-48 performs its own auth check. This is as designed (WS handles its own auth), but the middleware exemption path string (`/api/v1/audio/`) could theoretically also match future REST audio endpoints if added. ⚠️ **CLARIFY:** Should the frontend pass `api_key` query param to the audio WS? Yes — it is required for non-localhost connections.

7. **No logout endpoint** — There is no `/logout` or token invalidation mechanism. The API key is statically configured. "Logout" on the frontend simply clears localStorage. This is fine for a single-user desktop app but should be documented.

---

*End of Frontend Requirements Document (FRD). A frontend developer can begin implementing directly from this document without needing to read the backend code.*
