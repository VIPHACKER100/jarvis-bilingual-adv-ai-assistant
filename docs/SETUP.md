# Setup
> ponytail: trimmed from 635 to 44 lines — removed Docker/PostgreSQL/PyInstaller/OCR/sections

## Quick start

```bash
git clone https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant.git
cd jarvis-bilingual-adv-ai-assistant
```

### Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate | macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS/Linux
# Edit .env — set BACKEND_API_KEY + LLM provider keys
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
# In a separate terminal, from project root:
npm install
npm run dev
```

Open `http://localhost:5173`, allow microphone, click the Arc Reactor.

## System requirements

| Component | Minimum |
|-----------|---------|
| OS | Windows 10+, macOS 11+, Ubuntu 20.04+ |
| RAM | 4 GB |
| Python | 3.11+ (3.13 recommended) |
| Node.js | 20 LTS |
| Browser | Chrome 90+, Edge 90+ |

## Verify

```bash
curl http://localhost:8000/api/v1/health
curl -H "X-API-Key: $BACKEND_API_KEY" http://localhost:8000/api/v1/agent/health
```

Both should return `{"status": "healthy"}`.

## Tests

```bash
cd backend && pytest tests/ -v   # 36 backend tests
```

## More

- [API docs](API_DOCUMENTATION.md)
- [Commands](COMMANDS.md)
- [Troubleshooting](TROUBLESHOOTING.md)
