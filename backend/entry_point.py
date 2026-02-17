#!/usr/bin/env python3
"""
JARVIS Entry Point for PyInstaller
This is the main entry point for the packaged executable
"""

import sys
import os
from pathlib import Path

# Add the backend directory to Python path
if getattr(sys, 'frozen', False):
    # Running in PyInstaller bundle
    bundle_dir = Path(sys._MEIPASS)
else:
    # Running in normal Python environment
    bundle_dir = Path(__file__).parent

# Set up paths
os.chdir(bundle_dir)
sys.path.insert(0, str(bundle_dir))

# Ensure data directories exist
data_dir = bundle_dir / 'data'
logs_dir = bundle_dir / 'logs'
data_dir.mkdir(exist_ok=True)
logs_dir.mkdir(exist_ok=True)

# Import and run main
from main import app
import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("JARVIS AI Assistant v2.0")
    print("Made by VIPHACKER100")
    print("=" * 60)
    print("\nStarting JARVIS Backend Server...")
    print("Server will be available at: http://localhost:8000")
    print("\nPress Ctrl+C to stop\n")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info"
    )
