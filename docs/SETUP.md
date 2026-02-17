# JARVIS Setup Guide

Complete installation and setup instructions for JARVIS Bilingual AI Assistant.

---

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Quick Install](#quick-install)
3. [Detailed Setup](#detailed-setup)
4. [Troubleshooting](#troubleshooting)
5. [Post-Installation](#post-installation)

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
- **Python**: 3.11 or 3.12
- **Node.js**: 20 LTS

---

## Quick Install

### One-Command Setup (Coming Soon)

```bash
# Windows
powershell -Command "Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/VIPHACKER100/jarvis/main/install.ps1' -OutFile 'install.ps1'; .\install.ps1"

# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/VIPHACKER100/jarvis/main/install.sh | bash
```

---

## Detailed Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/VIPHACKER100/jarvis-bilingual-adv-ai-assistant.git
cd jarvis-bilingual-adv-ai-assistant
```

### Step 2: Install Frontend Dependencies

```bash
npm install
```

If you encounter errors:

```bash
# Clear npm cache
npm cache clean --force

# Use legacy peer deps
npm install --legacy-peer-deps
```

### Step 3: Setup Python Backend

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

### Step 4: Environment Configuration

Create `.env` file in `backend/` directory:

```bash
cd backend
copy .env.example .env  # Windows
cp .env.example .env    # macOS/Linux
```

Edit `.env`:

```env
# Server Configuration
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:5173

# Security
CONFIRMATION_TIMEOUT=30
ENABLE_DANGEROUS_COMMANDS=true

# Logging
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=30

# WhatsApp
WHATSAPP_DESKTOP_PATH=
AUTO_DETECT_WHATSAPP=true

# Optional: API Keys for future features
GEMINI_API_KEY=
OPENROUTER_API_KEY=
```

### Step 5: Verify Installation

#### Test Backend

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main.py
```

You should see:

#### Test Success

```text
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

#### Test Frontend

In new terminal:

```bash
npm run dev
```

You should see:

#### Vite Output

```text
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 6: First Run

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

**Production Mode** (Coming Soon):

```bash
# Build frontend
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
