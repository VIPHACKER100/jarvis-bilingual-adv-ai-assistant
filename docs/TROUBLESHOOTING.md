# JARVIS Troubleshooting Guide

Common issues and their solutions for JARVIS Bilingual AI Assistant.

---

## 🚀 Backend Issues

### Server fails to start (Port 8000 in use)

- **Windows**: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`
- **macOS/Linux**: `lsof -ti:8000 | xargs kill -9`
- **Solution**: Change `BACKEND_PORT` in your `.env` file.
- **Frontend Sync**: If using `npm run dev`, ensure `FRONTEND_URL` in `.env` is `http://localhost:5173`.

### Modular Router Errors

- Check `backend/logs/jarvis_system.log` for initialization errors.
- Ensure all routers are correctly included in `backend/main.py`.

### ModuleNotFoundError

- Ensure your virtual environment is active.
- Run `pip install -r requirements.txt --force-reinstall`.

---

## 🎙️ Voice & Commands

### JARVIS doesn't hear me

- Check browser microphone permissions (Chrome/Edge recommended).
- Ensure no other application is holding the microphone.
- Check Internet Connection (Web Speech API requires it for some languages).

### "I don't understand that command"

- Use simple keywords: "Open Chrome" instead of "Can you start the browser please".
- Check the EN/हिंदी toggle in the UI.

---

## 🖼️ Media & OCR

### OCR/Text Extraction fails

- Ensure Tesseract OCR is installed.
- **Windows**: Add `C:\Program Files\Tesseract-OCR` to your System PATH.
- Restart the backend after installation.

---

## 🧠 Memory & Analytics

### Facts are not being saved

- Check if PostgreSQL is running and `DATABASE_URL` is correctly set in your `.env` file.
- Some vague statements (like "I like food") aren't extracted automatically. Try explicit commands or let the system extract facts naturally over time.
- Review `backend/logs/jarvis_system.log` for any `[MemoryManager]` errors.

---

## 📱 Mobile Companion & Sync (v3.9.0)

### Mobile app cannot connect to backend

- **Network**: Ensure both the PC running the backend and the mobile device are on the exact same Wi-Fi network.
- **Firewall**: Windows Firewall may block the WebSocket connections or mDNS discovery. You may need to allow Python/Node through the firewall on private networks.
- **Pairing Code Expired**: Sync codes expire every 5 minutes. Generate a new code from the desktop HUD and try again.

---

## 📦 Build & Frontend Issues

### Vite Build/Dev Failures (v3.7.1)

- **Issue** (after rebuild): Errors like `The requested module '/src/components/NotificationCenter.tsx' does not provide an export named 'default'`
- **Cause**: Mismatched imports in `App.tsx` or `JarvisModals.tsx`.
- **Solution**: As of v3.7.1, we have standardized all internal components to use **Named Exports**. If you encounter this, ensure your imports look like `import { NotificationCenter } from './components/NotificationCenter'` instead of `import NotificationCenter from ...`.

### Launcher (START_JARVIS.bat) fails

- Ensure the `release` folder structure is intact.
- Check `config.env` exists in the same folder as the launcher.
- Check logs in `backend/logs/`.

---

---

## 🔒 Security, Authentication & CodeQL

### API key authentication failures (403 Forbidden)

JARVIS v4.0 requires API key authentication for all endpoints except health probes.

**Symptom**: All requests return `{"detail": "Invalid or missing API key"}`.

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| `BACKEND_API_KEY` not set in `backend/.env` | Set `BACKEND_API_KEY` to a secure random string |
| `VITE_JARVIS_API_KEY` not set in frontend `.env` | Set `VITE_JARVIS_API_KEY` in root `.env` — must match `BACKEND_API_KEY` |
| REST request missing `X-API-Key` header | Add `-H "X-API-Key: your-key"` to curl, or set in `apiClient.ts` |
| WebSocket URL missing `?api_key=` param | Ensure `ws://host:port/ws?api_key=your-key` includes the key |
| Key mismatch between frontend and backend | Both `.env` files must use the **exact same** key value |
| Request from non-localhost without key | Localhost (`127.0.0.1`, `::1`) is exempt; remote requests always require a key |

**Debugging checklist:**

1. Verify `BACKEND_API_KEY` is set in `backend/.env`
2. Verify `VITE_JARVIS_API_KEY` is set in root `.env` and matches
3. Restart both backend and frontend after changing `.env`
4. Test direct: `curl -H "X-API-Key: your-key" http://localhost:8000/api/v1/agent/chat`
5. Check backend logs for `API key validation failed` warnings

### Health endpoint returns 403

**Symptom**: Docker/K8s health checks fail with 403.

**Fix**: The following endpoints are **exempt** from authentication:
- `GET /api/v1/health`
- `GET /api/v1/agent/health`

Verify the probe is targeting one of these paths, not a generic `/api/` path.

### Frontend WebSocket connection failures (remote deploy)

**Symptom**: WebSocket connection succeeds on localhost but fails when deploying to a remote server.

**Common causes and fixes:**

| Cause | Fix |
|-------|-----|
| `websocketService.ts` uses `token` query param | Changed to `api_key` — must match the backend's expected query parameter name |
| `useAudioWS.ts` connects to wrong WS path | Must connect to `/api/v1/audio/ws/audio`, not a stale path |
| `config.ts` missing `WS_API_BASE_URL` | Ensure `config.ts` exports `WS_API_BASE_URL` for WebSocket URL construction |
| SSE streaming returns 403 | `useAgentStream.ts` must include `X-API-Key` header in the SSE fetch call |

**Verification**: Check `src/config.ts` for `WS_API_BASE_URL` and `AUDIO_WS_URL` definitions. Verify `websocketService.ts` uses `api_key` (not `token`) as the query parameter name.

### Settings keys endpoint exposes partial key material

**Symptom**: `GET /api/v1/settings/keys` returns something like `{"NVIDIA_API_KEY": "abcd...wxyz"}` instead of a boolean.

**Cause**: Older versions leaked the first and last 4 characters of each API key in the response.

**Fix**: The `redact()` function in `settings.py` now returns `bool(key)` — just a `true`/`false` indicating whether the key is configured, with no key material in the response. All callers have been updated to handle booleans.

### WebSocket connection refused (auth)

**Symptom**: Failed to construct WebSocket — `401` close code.

**Fix**: The browser WebSocket API does not support custom headers. Pass the API key as a query parameter:

```javascript
const apiKey = import.meta.env.VITE_JARVIS_API_KEY;
const ws = new WebSocket(`ws://localhost:8000/ws${apiKey ? '?api_key=' + apiKey : ''}`);
```

### CodeQL security alerts (v3.9.1)

All previously detected high/medium CodeQL issues have been resolved:

- **Bad HTML filtering regexp (High)** — Replaced bypassable script-tag regex with general HTML tag stripper
- **Incomplete multi-character sanitization (High)** — Made sanitization iterative (3 passes) with whitespace-variant coverage
- **Information exposure through an exception (Medium)** — All backend error responses now return generic messages; full error details are logged server-side only

If you run a new CodeQL analysis and find other alerts, verify they are not reintroduced by custom code changes.

---

## ⚡ Performance Issues

### High event loop lag (>100ms)

- **Symptom**: WebSocket messages delayed, UI feels sluggish, system status shows high `event_loop_lag`.
- **Cause**: A synchronous call is blocking the async event loop.
- **Diagnostic**: Check `backend/logs/jarvis_system.log` for `CRITICAL: Event loop lag detected` warnings. The lag value indicates which function is blocking.
- **Common culprits**: `time.sleep()`, `requests.get/post`, synchronous file I/O (`open().read()`), `subprocess.run()`.
- **Fix**: Replace with `asyncio.sleep()`, `httpx.AsyncClient`, `aiofiles`, or `asyncio.create_subprocess_exec`. See [Performance Guide](PERFORMANCE_GUIDE.md) for examples.
- **Advanced profiling**: Use `py-spy top --pid <PID>` to identify the blocking function, or set `PYTHONASYNCIODEBUG=1` for automatic coroutine timing warnings.

### Database connection pool exhaustion

- **Symptom**: `asyncpg.exceptions.InterfaceError: cannot acquire connection` or `TimeoutError` in logs.
- **Cause**: Too many concurrent database connections; connections held too long (e.g., across LLM calls).
- **Diagnostic**: Check pool status in a debug endpoint: `db_async._pool.get_size()` / `db_async._pool.get_idle_size()`.
- **Fix**: Ensure all database access uses context managers (`async with db_async.connection()`). Do NOT hold connections across LLM API calls. Increase `max_size` in `backend/utils/database.py` if needed (max 20).

### Slow LLM responses

- **Symptom**: User waits >5 seconds for a response.
- **Diagnostic**: Check which provider is active in logs (`LLM Gateway → nvidia`). Check `cost_tracker.stats()` for per-provider latency.
- **Fix**: Switch to a faster model (e.g., `google/gemini-2.0-flash-001`). Reduce `max_tokens` for simple queries. Check if the circuit breaker has tripped (`circuit.state == "open"`).

### Memory usage growing over time

- **Symptom**: JARVIS process RSS increases continuously over hours/days.
- **Diagnostic**: Check `cost_tracker._history` length (should be bounded at 1000). Check `websocket_manager.active_connections` count (should not grow past disconnects).
- **Fix**: The `CostTracker` uses a bounded deque (max 1000 records). If WebSocket connections leak, ensure `disconnect` handlers properly clean up. See [Troubleshooting Performance](TROUBLESHOOTING_PERFORMANCE.md) for full memory profiling guide.

---

## 📞 Still need help?

- Open an issue on [GitHub](https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/issues).
- Visit [aryanahirwar.in](https://aryanahirwar.in) for updates.
