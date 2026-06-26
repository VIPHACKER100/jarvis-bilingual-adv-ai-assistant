# Setup Guide

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Install](#quick-install)
3. [Detailed Setup](#detailed-setup)
4. [Platform-Specific Notes](#platform-specific-notes)
5. [Troubleshooting](#troubleshooting)
6. [Post-Installation](#post-installation)
7. [Updating JARVIS](#updating-jarvis)
8. [Uninstalling](#uninstalling)
9. [Getting Help](#getting-help)

---

## System Requirements

### Minimum Requirements

- **OS**: Windows 10/11, macOS 11+, or Ubuntu 20.04+
- **RAM**: 4GB
- **Storage**: 2GB free space
- **Browser**: Chrome 90+ or Edge 90+
- **Microphone**: Required for voice commands

### Recommended Requirements

- **OS**: Windows 11, macOS 13+, or Ubuntu 22.04+
- **RAM**: 8GB+
- **Storage**: 5GB free space
- **Browser**: Latest Chrome or Edge
- **Python**: 3.13
- **Python**: 3.11+ (3.13 recommended — see `pyproject.toml`)
- **Node.js**: 20 LTS

---

## Quick Install

### One-Command Setup (Coming Soon)

```bash
# Windows
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/main/scripts/install.ps1' -OutFile 'install.ps1'; .\install.ps1"

# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/main/scripts/install.sh | bash
```

---

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant.git
cd jarvis-bilingual-adv-ai-assistant
```

### Step 2: (Frontend) Install Dependencies

> The frontend source code (`src/`, `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`) is fully
> present in the repository. Install dependencies and start the dev server:

```bash
# From project root
npm install
npm run dev
```

> See [docs/FRD.md](FRD.md) for the full frontend specification and
> [docs/FRONTEND_COMPONENT_CATALOG.md](FRONTEND_COMPONENT_CATALOG.md) for the component inventory.

### Step 3: Setup PostgreSQL Database

JARVIS v4.0 uses PostgreSQL with the pgvector extension for semantic vector search. You can run it via Docker Compose or install directly.

#### Option A: Docker Compose (Recommended)

```bash
# From project root, start PostgreSQL + Redis
docker compose up -d postgres redis
```

This starts:
- **PostgreSQL 16** with pgvector extension on port `5432`
- **Redis** on port `6379`

The database and schema are created automatically on first backend launch via Alembic migrations.

#### Option B: Manual PostgreSQL Setup

Install PostgreSQL 16+ with pgvector:

**Windows:**
```cmd
# Download PostgreSQL from https://www.postgresql.org/download/windows/
# Run installer, remember the postgres password

# Enable pgvector (run in psql or SQL shell)
CREATE EXTENSION IF NOT EXISTS vector;
```

**macOS:**
```bash
brew install postgresql@16 pgvector
brew services start postgresql@16
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install postgresql-16 postgresql-16-pgvector
sudo systemctl start postgresql
```

Create the database:
```bash
createdb jarvis
```

Set the `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL=postgresql+asyncpg://postgres:your-password@localhost:5432/jarvis
```

### Step 4: Setup Python Backend

#### Windows

```cmd
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install Tesseract OCR (optional, for text extraction)
# Download from: https://github.com/UB-Mannheim/tesseract/wiki
# Install and add to PATH: C:\Program Files\Tesseract-OCR
```

#### macOS

```bash
cd backend

# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Tesseract OCR
brew install tesseract

# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### Linux (Ubuntu/Debian)

```bash
cd backend

# Install system dependencies
sudo apt-get update
sudo apt-get install -y python3-dev python3-pip python3-venv tesseract-ocr

# Create virtual environment
python3 -m venv venv

# Activate
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

#### Run Database Migrations

After the backend dependencies are installed and PostgreSQL is running:

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
alembic upgrade head
```

This applies all schema migrations (tables, indexes, pgvector extension).

### Step 5: Environment Configuration

Create `.env` file in `backend/` directory:

```bash
cd backend
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux
```

Edit `backend/.env`:

```env
# Server Configuration
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173

# Authentication (required for all API requests)
# Generate a secure random key: openssl rand -hex 32
BACKEND_API_KEY=your-secure-api-key-here

# Database (PostgreSQL with pgvector)
DATABASE_URL=postgresql+asyncpg://postgres:your-password@localhost:5432/jarvis

# Redis (optional, for task scheduling)
# REDIS_URL=redis://localhost:6379/0

# LLM Provider Selection (nvidia | openrouter | openai | google | ollama)
LLM_PROVIDER=nvidia

# NVIDIA API (primary provider)
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NVIDIA_MODEL=deepseek-ai/deepseek-v4-pro

# OpenRouter API (secondary provider)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENROUTER_MODEL=google/gemini-2.0-flash-001

# OpenAI API
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# OPENAI_MODEL=gpt-4o-mini

# Google / Gemini
# GEMINI_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Ollama (local — no API key needed)
# OLLAMA_URL=http://localhost:11434/api/chat
# OLLAMA_MODEL=llama3

# Security
CONFIRMATION_TIMEOUT=30
ENABLE_DANGEROUS_COMMANDS=true

# Logging
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=30

# Wake Word (Windows only)
WAKE_WORD_ENABLED=false
WAKE_WORD_PHRASE=jarvis

# Mobile Sync & Discovery
MDNS_ENABLED=true
MDNS_SERVICE_NAME=JARVIS-CORE
PAIRING_SECRET=your-pairing-secret-here

# WhatsApp
WHATSAPP_DESKTOP_PATH=
AUTO_DETECT_WHATSAPP=true

# Audio & TTS
TTS_VOICE=alloy
TTS_LANGUAGE=en

# OpenTelemetry (optional tracing)
# OTEL_ENABLED=false
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces
```

Also create a `.env` file in the project root for the frontend:

```env
# Frontend .env (project root)
VITE_JARVIS_API_KEY=your-secure-api-key-here
# Must match BACKEND_API_KEY in backend/.env — used for API + WebSocket auth
VITE_BACKEND_URL=http://localhost:8000
```

> **Frontend URL configuration**: WebSocket and API URLs are computed automatically in `src/config.ts` from the detected hostname and `BACKEND_PORT`. For remote deployments, edit `src/config.ts` to set custom `WS_API_BASE_URL` and `AUDIO_WS_URL` values.

### Step 6: Run Tests (Optional)

#### Backend Tests

```bash
cd backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
pytest                     # runs 47+ backend tests
```

#### Frontend Tests

```bash
# From project root — runs 172 frontend tests via vitest
npm test
```

### Step 7: Verify Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

You should see:

```text
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
    INFO:     JARVIS Backend starting up (Modular Architecture)...
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 8: Start Frontend

```bash
npm run dev
```

> **Important**: The frontend `.env` (project root) and backend `.env` (`backend/`) must share the same `BACKEND_API_KEY` / `VITE_JARVIS_API_KEY` value. Both `.env` files use the same secret for API authentication.

### Step 9: First Run

1. Open browser to: `http://localhost:5173`
2. Allow microphone permissions when prompted
3. Click the Arc Reactor to activate JARVIS
4. Test with a simple command: "What time is it?"

---

## Platform-Specific Notes

### Windows Specific Notes

#### Windows Additional Requirements

- **Visual C++ Redistributable**: Install from Microsoft
- **Windows Build Tools** (if building from source):

  ```cmd
  pip install --upgrade setuptools wheel
  ```

#### Windows Known Issues

- **Tesseract not found**: Ensure `C:\Program Files\Tesseract-OCR` is in system PATH
- **Permission denied**: Run terminal as Administrator for some operations

### macOS Specific Notes

#### macOS Additional Requirements

- **Xcode Command Line Tools**:

  ```bash
  xcode-select --install
  ```

#### macOS Known Issues

- **Security warnings**: Go to System Preferences > Security & Privacy > Allow
- **Microphone access**: Grant permission in System Preferences > Security & Privacy > Microphone

### Linux Specific Notes

#### Linux Additional Requirements

**Ubuntu/Debian:**

```bash
sudo apt-get install -y \
  python3-dev python3-pip python3-venv \
  tesseract-ocr tesseract-ocr-eng \
  libtesseract-dev \
  scrot xclip python3-tk python3-dev
```

**Fedora:**

```bash
sudo dnf install -y \
  python3-devel python3-pip python3-virtualenv \
  tesseract tesseract-langpack-eng \
  scrot xclip
```

**Arch Linux:**

```bash
sudo pacman -S \
  python python-pip python-virtualenv \
  tesseract tesseract-data-eng \
  scrot xclip
```

---

## Troubleshooting

### Backend Won't Start

### ModuleNotFoundError

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt --force-reinstall
```

### Port 8000 already in use

```bash
# Find and kill process using port 8000
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:8000 | xargs kill -9
```

### Permission denied

```bash
# Windows - Run as Administrator
# macOS/Linux
sudo chown -R $USER:$USER .
```

### Frontend Can't Connect to Backend

1. **Check backend is running**:

   ```bash
   curl http://localhost:8000/
   ```

2. **Verify CORS settings** in `backend/main.py`:

   ```python
   allow_origins=["http://localhost:5173"]
   ```

3. **Check firewall** - Allow ports 8000 and 5173

### Microphone Not Working

1. **Use Chrome or Edge** - Best Web Speech API support
2. **Check permissions**:
   - Click lock icon in address bar
   - Ensure Microphone is set to "Allow"
3. **Check not in use** by another application
4. **Refresh page** after granting permission

### OCR Not Working

**Windows:**

```cmd
# Verify Tesseract installation
tesseract --version

# If not found, add to PATH:
setx PATH "%PATH%;C:\Program Files\Tesseract-OCR"
```

**macOS:**

```bash
brew install tesseract
```

**Linux:**

```bash
sudo apt-get install tesseract-ocr
```

### Voice Recognition Not Working

1. **Check browser compatibility**:
   - Chrome: ✅ Fully supported
   - Edge: ✅ Fully supported
   - Firefox: ⚠️ Limited support
   - Safari: ❌ Not supported

2. **Check internet connection** (for cloud-based recognition)

3. **Try speaking clearly** with minimal background noise

---

## Post-Installation

### Running JARVIS

**Development Mode** (2 terminals):

Terminal 1:

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate
python main.py
```

Terminal 2:

```bash
npm run dev
```

**Production Mode**:

```bash
# Build standalone executable (Windows)
python scripts/build.py
```

This orchestrates:
1. Cleaning previous build artifacts
2. Building the frontend via `npm run build` (Vite)
3. Building the backend via `PyInstaller` using `JARVIS_Backend.spec`
4. Parsing and filtering PyInstaller warning output
5. Creating a release package with `START_JARVIS.bat` launcher, `README.txt` quick-start guide, and `config.env` template
6. Zipping the final release as `JARVIS_v{VERSION}.zip` in `dist/`

**Prerequisites:** Node.js/npm, PyInstaller (`pip install pyinstaller`). The script runs from the project root.

Alternatively, you can build individually:

```bash
# Build frontend only
npm run build

# Start production server
python backend/main.py --production
```

### Auto-Start (Optional)

**Windows**:

1. Create batch file `start-jarvis.bat`:

   ```batch
   start cmd /k "cd /d C:\path\to\jarvis\backend && venv\Scripts\activate && python main.py"
   start cmd /k "cd /d C:\path\to\jarvis && npm run dev"
   ```

**macOS/Linux**:

1. Create script `start-jarvis.sh`:

   ```bash
   #!/bin/bash
   cd /path/to/jarvis/backend
   source venv/bin/activate
   python main.py &
   cd /path/to/jarvis
   npm run dev
   ```

2. Make executable: `chmod +x start-jarvis.sh`

---

## Updating JARVIS

```bash
# Pull latest changes
git pull origin main

# Update frontend
npm install

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt --upgrade
```

---

## Uninstalling

```bash
# Delete virtual environment
cd backend
rm -rf venv  # macOS/Linux
rmdir /s /q venv  # Windows

# Delete node_modules
cd ..
rm -rf node_modules

# Delete repository
cd ..
rm -rf jarvis-bilingual-adv-ai-assistant
```

---

## Getting Help

- **GitHub Issues**: [github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/issues](https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant/issues)
- **Documentation**: Check `docs/` directory
- **Community**: Join our Discord (coming soon)

---

## Next Steps

- Read [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for API reference
- Check [COMMANDS.md](COMMANDS.md) for complete command list
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more fixes

---

### Happy Automating! 🤖
