# API Documentation

> Updated to reflect all 39 endpoints from backend analysis (see [FRD](FRD.md) for full specs).

## Base URL

```
http://localhost:8000
ws://localhost:8000/ws
```

All REST endpoints live under `/api/v1/`. WebSocket endpoints are at `/ws` and `/api/v1/audio/ws/audio`.

## Authentication

Pass `X-API-Key` header on all REST requests (except health-exempt endpoints).  
WebSocket passes `?api_key=` query param (browsers don't support custom WS headers).  
Key comparison uses `hmac.compare_digest` (constant-time). Localhost (`127.0.0.1`, `::1`) bypasses auth for dev convenience.  
Health endpoints (`/api/v1/health`, `/api/v1/ready`, `/api/v1/live`, `/api/v1/agent/health`, `/api/v1/audio/`) are exempt.

Set both `BACKEND_API_KEY` (backend `.env`) and `VITE_JARVIS_API_KEY` (root `.env`) to the same value.

## Response Format

All endpoints return JSON. Base response shape:

```json
{ "success": true, "response": "...", "data": {}, "action_type": "...", "error": null }
```

Error responses include `request_id` and `timestamp` for 500-level errors.

## Endpoint Inventory

### Health & Probes (public, no auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Full health report (version, uptime, DB latency, CPU, memory, automation status) |
| GET | `/api/v1/ready` | Readiness probe — DB connectivity check |
| GET | `/api/v1/live` | Liveness probe — always returns `{"status": "alive"}` |
| GET | `/api/v1/agent/health` | Agent subsystem health — provider status |

### Commands

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/command` | ✅ | Execute a voice/text command. Body: `{command, language?, session_id?}`. Dangerous actions return `requires_confirmation: true` + `confirmation_id` and are **not** executed yet |
| POST | `/api/v1/confirm/{confirmation_id}` | ✅ | Confirm/deny a dangerous action. Body: `{approved, details?}`. **On approval the original command is re-executed** — the response carries the action's outcome. Returns 404 for unknown/expired/already-decided confirmations |
| GET | `/api/v1/pending` | ✅ | List pending confirmations (id, command, expiry) |

### System

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/system/status` | ✅ | Full system status (CPU, RAM, battery, disk, network, uptime, volume, active window, personality) |
| GET | `/api/v1/system/battery` | ✅ | Battery percentage + charging status |
| GET | `/api/v1/system/time` | ✅ | Current time (ISO + formatted) |
| GET | `/api/v1/system/date` | ✅ | Current date (ISO + formatted) |
| POST | `/api/v1/system/shutdown` | ✅ | Shutdown computer (requires `confirmed=true`) |
| POST | `/api/v1/system/restart` | ✅ | Restart computer (requires `confirmed=true`) |
| POST | `/api/v1/system/sleep` | ✅ | Sleep computer (requires `confirmed=true`) |
| POST | `/api/v1/system/volume/up` | ✅ | Increase volume (`?amount=10`) |
| POST | `/api/v1/system/volume/down` | ✅ | Decrease volume (`?amount=10`) |
| POST | `/api/v1/system/mute` | ✅ | Toggle mute |
| GET | `/api/v1/system/uptime` | ✅ | System uptime (seconds + formatted) |
| GET | `/api/v1/system/network` | ✅ | Network info (hostname, IP, interfaces) |
| GET | `/api/v1/system/weather` | ✅ | Weather (opens browser) |
| POST | `/api/v1/system/search` | ✅ | Google search (opens browser) |
| GET | `/api/v1/system/performance/history` | ✅ | Historical performance metrics (`?limit=60`) |
| GET | `/api/v1/system/personalities` | ✅ | List available personalities |
| POST | `/api/v1/system/personality/{p_id}` | ✅ | Set personality (`stark`/`midnight`/`avenue`/`linear`) |
| GET | `/api/v1/system/command-insights` | ✅ | Command usage analytics (`?days=30`) |
| GET | `/api/v1/system/security/processes` | ✅ | Top 50 running processes by CPU |
| GET | `/api/v1/system/security/connections` | ✅ | Active network connections |
| POST | `/api/v1/system/security/quarantine` | ✅ | Suspend/resume/terminate a process (`?pid=X&action=suspend`) |

### Settings

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/settings` | ✅ | Get all current settings |
| POST | `/api/v1/settings` | ✅ | Update settings (partial body) |
| GET | `/api/v1/settings/keys` | ✅ | Get API key status (boolean — set/unset, not the key value) |
| POST | `/api/v1/settings/keys` | ✅ | Update API keys in `.env` |
| POST | `/api/v1/settings/test-key` | ✅ | Verify an API key (⚠️ simulated — returns success regardless) |

### Agent (LLM)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/agent/chat` | ✅ | Non-streaming LLM chat (rate limited: 30 req/min) |
| POST | `/api/v1/agent/stream` | ✅ | Streaming LLM response via SSE (rate limited: 15 req/min) |

### WebSocket

| Endpoint | Auth | Purpose |
|----------|------|---------|
| WS `/ws` | `?api_key=` | Bidirectional real-time: commands, status, notifications, proactive suggestions |
| WS `/api/v1/audio/ws/audio` | `?api_key=` | Bidirectional audio STT (base64) + TTS (base64 chunks) |

### Utility

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/` | ❌ | Root — API info or frontend |
| GET | `/favicon.ico` | ❌ | Favicon |

## WebSocket Details

### WS `/ws` — Command & Status

**Send:**

```json
{ "type": "command", "command": "open chrome", "language": "en" }
{ "type": "confirmation", "data": { "confirmation_id": "...", "approved": true } }
{ "type": "get_status" }
{ "type": "ping" }
```

**Receive:**

```json
{ "type": "command_result", "data": { "success": true, "response": "..." } }
{ "type": "system_status", "data": {...}, "timestamp": "..." }          // every 5s
{ "type": "notification", "data": { "title": "...", "message": "...", "type": "info|warning|error|success" } }
{ "type": "proactive_suggestion", "data": { "text": "...", "timestamp": "..." } }
{ "type": "agent_thinking", "data": { "thought": "...", "session_id": "..." } }
{ "type": "agent_resolved", "data": { "full_response": "...", "session_id": "..." } }
{ "type": "pong", "timestamp": "..." }
```

### WS `/api/v1/audio/ws/audio` — STT/TTS

**Send:**

```json
{ "type": "stt", "audio": "<base64>" }
{ "type": "tts", "text": "...", "voice": "alloy" }
{ "type": "tts_stream", "text": "...", "voice": "alloy" }
{ "type": "ping" }
```

**Receive:**

```json
{ "type": "stt_result", "text": "..." }
{ "type": "tts_audio", "audio": "<base64>", "format": "opus" }
{ "type": "tts_chunk", "audio": "<base64>", "format": "opus" }   // via tts_stream
{ "type": "tts_end" }
{ "type": "pong" }
{ "type": "error", "error": "..." }
```

**Limits:** Max audio payload 10 MB, max TTS text 2000 chars.

## SSE — Agent Streaming

`POST /api/v1/agent/stream` returns Server-Sent Events:

```
data: {"type": "meta", "provider": "...", "language": "..."}\n\n
data: {"type": "chunk", "text": "..."}\n\n
data: {"type": "done", "full_text": "..."}\n\n
data: {"type": "error", "error": "..."}\n\n
data: {"type": "partial_done", "full_text": "...", "truncated": true}\n\n
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad request (missing field, SQL injection pattern) |
| 403 | Invalid/missing API key |
| 404 | Not found (incl. unknown confirmation id on `/confirm/{id}`) |
| 413 | Request body too large (>512 KB — enforced on actual streamed bytes, incl. chunked requests) |
| 422 | Pydantic validation failure |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 1008 (WS) | Unauthorized WebSocket |

Note: the SQLi pattern filter does not apply to `/api/v1/command` — command
bodies legitimately contain words like "delete"; the command pipeline and the
database layer (stdlib sqlite3, fully parameterized) validate downstream.

## Dangerous Commands (Require Confirmation)

The following actions require `POST /api/v1/confirm/{id}` or a WS
`confirmation` message before they execute:

- `shutdown`, `restart`, `sleep`, `hibernate`
- `delete`, `remove`, `format`, `uninstall`

Flow: `POST /command` returns `requires_confirmation: true` +
`confirmation_id` → the client shows a dialog → approval
(`POST /confirm/{id}` with `{approved: true}`) re-executes the original
command and returns its outcome; denial discards it. Empty recycle bin,
close-app, and WhatsApp sends are **not** confirmation-gated.

Confirmation timeout: 30 seconds (configurable). Auto-rejected on timeout.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
