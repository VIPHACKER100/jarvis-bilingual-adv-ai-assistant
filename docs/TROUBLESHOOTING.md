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

- **Issue**: Errors like `The requested module '/src/components/NotificationCenter.tsx' does not provide an export named 'default'`
- **Cause**: Mismatched imports in `App.tsx` or `JarvisModals.tsx`.
- **Solution**: As of v3.7.1, we have standardized all internal components to use **Named Exports**. If you encounter this, ensure your imports look like `import { NotificationCenter } from './components/NotificationCenter'` instead of `import NotificationCenter from ...`.

### Launcher (START_JARVIS.bat) fails

- Ensure the `release` folder structure is intact.
- Check `config.env` exists in the same folder as the launcher.
- Check logs in `backend/logs/`.

---

---

## 🔒 Security & CodeQL

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
- **Fix**: Ensure all database access uses context managers (`async with db_async.connection()`). Do NOT hold connections across LLM API calls. Increase `max_size` in `backend/utils/database_async.py` if needed (max 20).

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
