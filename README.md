# JARVIS — Bilingual AI Voice Assistant

> ponytail: trimmed from 452 to 66 lines — removed PostgreSQL/Docker/PyInstaller/OCR/WhatsApp sections

[![Version](https://img.shields.io/badge/Version-4.0.0--alpha.4-indigo?style=for-the-badge&logo=github)](https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.138-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tests](https://img.shields.io/badge/Tests-36_passing-brightgreen?style=flat-square&logo=pytest)](https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant)

Bilingual (English + Hinglish) voice assistant. React/Python.

Frontend is currently being rebuilt from the [Frontend Requirements Document (FRD)](docs/FRD.md) — the complete blueprint for the new UI.

## Quick Start

```bash
# Backend
cd backend
pip install -r requirements.txt
copy .env.example .env  # fill in your API keys
uvicorn backend.main:app

# Frontend (separate terminal)
npm install
copy .env.example .env  # VITE_JARVIS_API_KEY must match backend
npm run dev
```

## Architecture

- **Frontend**: React + Vite + TypeScript — being rebuilt from [FRD blueprint](docs/FRD.md) (planned: Zustand, Tailwind CSS, Recharts, React Router)
- **Backend**: FastAPI + stdlib sqlite3 — async-first, ~12 routers, single LLM client with multi-provider routing
- **LLM Providers**: OpenRouter, OpenAI, NVIDIA NIM, Google Gemini, Ollama
- **Database**: SQLite (zero deps — stdlib `sqlite3` + `asyncio.to_thread`)

## Tests

```bash
pytest backend/tests/ -v   # 36 backend tests
```

## Project Structure

```
backend/
  main.py            # FastAPI entry point
  routers/           # ~12 routers (agent, commands, health, settings, system, websocket, ...)
  modules/           # Feature modules (llm_client.py, window_manager.py, automation.py, ...)
  config/            # environment.py, defaults.py, commands.py, responses.py
  utils/             # database.py (stdlib sqlite3), security.py, logger_structured.py
  tests/             # 36 pytest tests
src/                 # React/TypeScript frontend
docs/                # Documentation
```

## Security

- API key auth via `X-API-Key` header (constant-time comparison)
- Health endpoints exempt
- `shell=True` banned by default — all subprocesses use list form
- Never commit `.env` files

## Docs

- [Setup](docs/SETUP.md)
- [Commands](docs/COMMANDS.md)
- [API](docs/API_DOCUMENTATION.md)
- [Changelog](docs/CHANGELOG.md)
- [Contributing](docs/CONTRIBUTING.md)
- [Security](docs/SECURITY.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Frontend Requirements (FRD)](docs/FRD.md)
