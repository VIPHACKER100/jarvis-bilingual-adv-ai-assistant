#!/usr/bin/env python3
"""
JARVIS Build Script
Creates standalone executable for Windows
"""

import os
import sys
import shutil
import subprocess
from pathlib import Path

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
BACKEND_DIR = PROJECT_ROOT / 'backend'
FRONTEND_DIR = PROJECT_ROOT / 'src'
DIST_DIR = PROJECT_ROOT / 'dist'
BUILD_DIR = PROJECT_ROOT / 'build'
RELEASE_DIR = PROJECT_ROOT / 'release'

def clean_build_dirs():
    """Clean previous build artifacts"""
    print("🧹 Cleaning build directories...")
    
    dirs_to_clean = [BUILD_DIR, DIST_DIR, RELEASE_DIR]
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            shutil.rmtree(dir_path, ignore_errors=True)
            print(f"  ✓ Removed {dir_path}")

def build_backend():
    """Build backend executable with PyInstaller"""
    print("\n🔨 Building JARVIS Backend...")
    
    os.chdir(BACKEND_DIR)
    
    # Run PyInstaller
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        'JARVIS_Backend.spec',
        '--clean',
        '--noconfirm'
    ]
    
    try:
        subprocess.run(cmd, check=True)
        print("  ✓ Backend executable built successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Backend build failed: {e}")
        return False

def build_frontend():
    """Build frontend with Vite"""
    print("\n🎨 Building JARVIS Frontend...")
    
    os.chdir(PROJECT_ROOT)
    
    # Build frontend
    try:
        subprocess.run(['npm', 'run', 'build'], check=True, shell=True)
        print("  ✓ Frontend built successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Frontend build failed: {e}")
        return False
    except FileNotFoundError:
        print("  ✗ npm not found. Please install Node.js")
        return False

def create_release_package():
    """Create final release package"""
    print("\n📦 Creating release package...")
    
    RELEASE_DIR.mkdir(exist_ok=True)
    
    # Copy backend executable
    backend_dist = BACKEND_DIR / 'dist' / 'JARVIS_Backend'
    if backend_dist.exists():
        shutil.copytree(backend_dist, RELEASE_DIR / 'backend', dirs_exist_ok=True)
        print("  ✓ Copied backend executable")
    
    # Frontend is bundled inside backend executable, no need to copy separately    
    # Create launcher script
    create_launcher_script()
    
    # Create README
    create_release_readme()
    
    # Create .env template
    create_env_template()
    
    print(f"\n📁 Release package created in: {RELEASE_DIR}")

def create_launcher_script():
    """Create Windows launcher batch file"""
    launcher_content = '''@echo off
chcp 65001 >nul
title JARVIS AI Assistant
echo.
echo ╔═══════════════════════════════════════╗
echo ║     JARVIS AI Assistant v2.0          ║
echo ║     Made by VIPHACKER100              ║
echo ╚═══════════════════════════════════════╝
echo.
echo Starting JARVIS Backend...
start "" "%~dp0backend\\JARVIS_Backend.exe"
echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend...
start "" "http://localhost:8000"
echo.
echo JARVIS is starting in your browser!
echo.
echo Press any key to stop JARVIS...
pause >nul
taskkill /F /IM JARVIS_Backend.exe 2>nul
echo.
echo JARVIS stopped. Goodbye!
timeout /t 2 >nul
'''
    
    launcher_path = RELEASE_DIR / 'START_JARVIS.bat'
    with open(launcher_path, 'w', encoding='utf-8') as f:
        f.write(launcher_content)
    
    print("  ✓ Created launcher script (START_JARVIS.bat)")

def create_release_readme():
    """Create release README"""
    readme_content = '''# JARVIS AI Assistant v2.0

## 🚀 Quick Start

1. Double-click `START_JARVIS.bat`
2. Wait for the browser to open
3. Click the Arc Reactor to activate JARVIS
4. Start speaking!

## 📋 Requirements

- Windows 10/11
- Microphone (for voice commands)
- Chrome or Edge browser

## 🎮 Usage

- **Activate**: Click the Arc Reactor
- **Language**: Toggle EN/हिंदी in top right
- **Voice Commands**: Speak naturally in English or Hindi
- **Memory**: Click 🧠 button to view conversation history
- **Automation**: Click ⚡ button for scheduled tasks

## 🗣️ Example Commands

**System:**
- "What time is it?" / "Samay kya hai?"
- "Volume up" / "Aawaz badhao"

**Applications:**
- "Open Chrome" / "Chrome kholo"
- "Close Notepad" / "Notepad band karo"

**Files:**
- "Open Downloads" / "Downloads kholo"
- "Take screenshot" / "Screenshot lo"

## 📁 Files

- `backend/` - JARVIS backend server
- `frontend/` - Web interface
- `START_JARVIS.bat` - Launch JARVIS

## 🆘 Support

- Website: https://viphacker100.com
- GitHub: https://github.com/VIPHACKER100
- Email: support@viphacker100.com

---
Made with ❤️ by VIPHACKER100 (Aryan Ahirwar)
'''
    
    readme_path = RELEASE_DIR / 'README.txt'
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print("  ✓ Created README.txt")

def create_env_template():
    """Create environment configuration template"""
    env_content = '''# JARVIS Configuration
# Edit these settings as needed

# Server Configuration
BACKEND_PORT=8000
FRONTEND_URL=http://localhost:8000

# Security
CONFIRMATION_TIMEOUT=30
ENABLE_DANGEROUS_COMMANDS=true

# Logging
LOG_LEVEL=INFO
LOG_RETENTION_DAYS=30

# Automation
AUTO_START_SCHEDULER=true
'''
    
    env_path = RELEASE_DIR / 'config.env'
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(env_content)
    
    print("  ✓ Created config.env template")

def main():
    """Main build process"""
    print("=" * 60)
    print("JARVIS AI Assistant v2.0 - Build Script")
    print("Made by VIPHACKER100")
    print("=" * 60)
    
    # Clean previous builds
    clean_build_dirs()
    
    # Build frontend first
    if not build_frontend():
        print("\n✗ Build failed!")
        sys.exit(1)
    
    # Build backend (which bundles the frontend)
    if not build_backend():
        print("\n✗ Build failed!")
        sys.exit(1)
    
    # Create release package
    create_release_package()
    
    print("\n" + "=" * 60)
    print("✅ Build completed successfully!")
    print(f"📁 Release package: {RELEASE_DIR}")
    print("=" * 60)
    print("\nTo distribute:")
    print("1. Zip the 'release' folder")
    print("2. Share JARVIS_v2.0.zip")
    print("3. Users just run START_JARVIS.bat")

if __name__ == '__main__':
    main()
