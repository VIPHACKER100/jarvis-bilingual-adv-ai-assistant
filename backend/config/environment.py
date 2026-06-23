import os
import platform
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

# Base paths
if getattr(sys, 'frozen', False):
    # Running in a PyInstaller bundle
    # sys._MEIPASS is the temporary folder where PyInstaller extracts bundled data
    BASE_DIR = Path(sys._MEIPASS)
    # PROJECT_ROOT should remain the directory containing the executable for persistent data
    PROJECT_ROOT = Path(sys.executable).parent.parent
else:
    # Running in development
    BASE_DIR = Path(__file__).parent.parent
    PROJECT_ROOT = BASE_DIR.parent

# Data and logs directories
DATA_DIR = PROJECT_ROOT / "data"
LOGS_DIR = PROJECT_ROOT / "logs"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# Server config
BACKEND_PORT = int(os.getenv("BACKEND_PORT", 8000))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Platform
PLATFORM = platform.system().lower()  # 'windows', 'darwin', 'linux'

# Wake word
WAKE_WORD_ENABLED = os.getenv("WAKE_WORD_ENABLED", "false").lower() == "true"
WAKE_WORD_PHRASE = os.getenv("WAKE_WORD_PHRASE", "jarvis")
WAKE_WORD_MODEL = os.getenv("WAKE_WORD_MODEL", "hey_jarvis")
WAKE_WORD_THRESHOLD = float(os.getenv("WAKE_WORD_THRESHOLD", 0.5))

# Mobile Sync & Auto-Discovery
MDNS_ENABLED = os.getenv("MDNS_ENABLED", "true").lower() == "true"
MDNS_SERVICE_NAME = os.getenv("MDNS_SERVICE_NAME", "JARVIS-CORE")
PAIRING_SECRET = os.getenv("PAIRING_SECRET", "JARVIS-SECRET-KEY")

# Version
VERSION = "4.0.0-alpha.2"
