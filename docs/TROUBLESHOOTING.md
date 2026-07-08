# Troubleshooting
> ponytail: trimmed from 47 to 20 lines — removed PostgreSQL/OCR/sections

## Backend

### Port 8000 in use
- Windows: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`
- macOS/Linux: `lsof -ti:8000 | xargs kill -9`

### ModuleNotFoundError
Activate venv, then `pip install -r requirements.txt --force-reinstall`.

## Voice

### JARVIS doesn't hear me
- Use Chrome/Edge (best Web Speech API support)
- Click the lock icon → allow microphone
- No other app using the mic; check internet connection

### Command not understood
Use simple keywords: "Open Chrome" not "Can you start the browser". Check EN/हिंदी toggle.

## Auth failures (403)

- `BACKEND_API_KEY` in `backend/.env` must match `VITE_JARVIS_API_KEY` in root `.env`
- REST: add `X-API-Key` header; WebSocket: `?api_key=` param
- Restart both services after changing `.env`

## Need help?

[Open a GitHub issue](https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/issues).
