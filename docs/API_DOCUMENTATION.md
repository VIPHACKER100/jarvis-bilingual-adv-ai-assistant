# API
> ponytail: trimmed from 1606 to 79 lines — only 6 routes remain

## Base URL

```
http://localhost:8000
ws://localhost:8000/ws
```

All REST endpoints live under `/api/v1/`.

## Authentication

Pass `X-API-Key` header on all requests. WebSocket passes `?api_key=` query param (browsers don't support custom WS headers).  
Key comparison uses `hmac.compare_digest` (constant-time). Localhost (`127.0.0.1`, `::1`) bypasses auth for dev convenience.  
Health endpoints (`/api/v1/health`, `/api/v1/agent/health`) are exempt.

Set both `BACKEND_API_KEY` (backend `.env`) and `VITE_JARVIS_API_KEY` (root `.env`) to the same value.

```bash
curl -H "X-API-Key: your-key" http://localhost:8000/api/v1/agent/health
wscat -c "ws://localhost:8000/ws?api_key=your-key"
```

## Response format

```json
{ "success": true, "action_type": "COMMAND", "response": "...", "data": {}, "error": null }
```

> Only `agent/*` routes are consumed by the frontend. Additional route groups (`/system`, `/settings`, `/audio/ws`) exist for REST clients — see `backend/routers/` for the full list.

## Routes

### `POST /api/v1/agent/chat`

Body: `{ "query": "...", "language": "en", "session_id": "..." }`  
Returns AI response (`{ "response": "...", "session_id": "..." }`).

### `POST /api/v1/agent/stream`

Body: `{ "query": "...", "language": "en", "session_id": "..." }`  
Returns SSE stream of tokens. Same as chat but streamed.

### `GET /api/v1/agent/health`

Returns `{ "status": "healthy", "provider": "nvidia", "model": "..." }`.

### `GET /api/v1/health`

Returns `{ "status": "healthy" }`.

### `POST /api/v1/command`

Body: `{ "command": "open chrome", "language": "en" }`  
Executes a bilingual system command. Returns action result.

```json
{ "success": true, "action_type": "OPEN_APP", "response": "Opening chrome.", "data": { "app_name": "chrome" } }
```

### `WS /ws`

Bidirectional WebSocket for command execution + status.

**Send:**
```json
{ "type": "command", "command": "open chrome", "language": "en" }
{ "type": "ping" }
```

**Receive:**
```json
{ "type": "command_response", "data": { "success": true, "response": "..." } }
{ "type": "system_status", "data": { ... } }
{ "type": "pong", "timestamp": "..." }
```

## Error codes

| Code | Description |
|------|-------------|
| 400 | Bad request |
| 403 | Invalid/missing API key |
| 404 | Not found |
| 429 | Rate limit exceeded |
| 500 | Internal error |

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
