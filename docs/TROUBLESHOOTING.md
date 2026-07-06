# JARVIS Troubleshooting Guide

ponytail: trimmed from 209 to ~50 lines — removed security auth deep-dive (covered in API_DOCS.md) and performance deep-dive (covered by conventions)

## Backend Issues

### Server fails to start (Port 8000 in use)
- **Windows**: `netstat -ano | findstr :8000` then `taskkill /PID <PID> /F`
- **macOS/Linux**: `lsof -ti:8000 | xargs kill -9`
- Change `BACKEND_PORT` in `.env` as needed.

### ModuleNotFoundError
Ensure venv is active, then `pip install -r requirements.txt --force-reinstall`.

## Voice & Commands

### JARVIS doesn't hear me
- Check browser microphone permissions (Chrome/Edge recommended).
- Ensure no other app is using the mic.
- Check internet (Web Speech API requires it for some languages).

### Command not understood
Use simple keywords: "Open Chrome" not "Can you start the browser please". Check EN/हिंदी toggle.

## Media & OCR

### OCR fails
Ensure Tesseract OCR is installed. On Windows, add `C:\Program Files\Tesseract-OCR` to system PATH. Restart backend.

## Memory & Analytics

### Facts not saving
Check PostgreSQL is running and `DATABASE_URL` is correctly set. Vague statements may not be extracted automatically.

## Build & Frontend

### Vite build fails
Standardized to named exports. Use `import { Component }` not `import Component`.

### API key auth failures (403)
- Verify `BACKEND_API_KEY` in `backend/.env`
- Verify `VITE_JARVIS_API_KEY` in root `.env` matches
- Restart both after changing `.env`
- REST: add `X-API-Key` header; WebSocket: `?api_key=` param

## Still need help?
Open an issue on [GitHub](https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/issues).
