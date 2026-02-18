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
from typing import List
import itertools

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
    
    # Run PyInstaller with warning suppression for known issues
    cmd = [
        sys.executable, '-m', 'PyInstaller',
        'JARVIS_Backend.spec',
        '--clean',
        '--noconfirm',
        '--log-level=WARN'  # Reduce noise from known warnings
    ]
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print("  ✓ Backend executable built successfully")
            return True
        else:
            print(f"  ✗ Backend build failed with return code {result.returncode}")
            stderr_tail = result.stderr[-1000:] if result.stderr else "No stderr"
            print("STDERR:", stderr_tail)
            return False
    except subprocess.CalledProcessError as e:
        print(f"  ✗ Backend build failed: {e}")
        return False
    except Exception as e:
        print(f"  ✗ Unexpected error during build: {e}")
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

def filter_build_warnings(warning_file):
    """Filter and categorize build warnings to reduce noise"""
    if not warning_file.exists():
        return
    
    try:
        with open(warning_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Common warnings that are safe to ignore
        ignorable_patterns = [
            # Platform-specific modules (Unix/Linux)
            "missing module named pwd",
            "missing module named grp",
            "missing module named posix",
            "missing module named resource",
            "missing module named fcntl",
            "missing module named termios",
            "missing module named readline",
            "missing module named _scproxy",
            "missing module named vms_lib",
            "missing module named java",
            
            # Python 3.14+ compatibility warnings (harmless)
            "missing module named 'collections.abc'",
            "missing module named _frozen_importlib_external",
            "excluded module named _frozen_importlib",
            "missing module named _posixsubprocess",
            "missing module named _posixshmem",
            "missing module named multiprocessing.set_start_method",
            "missing module named multiprocessing.get_start_method",
            "missing module named multiprocessing.AuthenticationError",
            "missing module named multiprocessing.get_context",
            "missing module named multiprocessing.TimeoutError",
            "missing module named multiprocessing.BufferTooShort",
            "missing module named multiprocessing.Pipe",
            "missing module named multiprocessing.Value",
            "missing module named _typeshed",
            "missing module named 'java.lang'",
            "missing module named usercustomize",
            "missing module named sitecustomize",
            "missing module named _manylinux",
            "missing module named setuptools._vendor.backports.zstd",
            "missing module named trove_classifiers",
            
            # Optional dependencies
            "missing module named numpy",
            "missing module named pandas",
            "missing module named cv2",
            "missing module named AppKit",
            "missing module named Foundation",
            "missing module named PyQt5",
            "missing module named Xlib",
            "missing module named Quartz",
            "missing module named Tkinter",
            "missing module named rubicon",
            
            # Security/crypto optional modules
            "missing module named cryptography",
            "missing module named brotli",
            "missing module named simplejson",
            "missing module named chardet",
            "missing module named olefile",
            "missing module named defusedxml",
            
            # Async/optional libraries
            "missing module named exceptiongroup",
            "missing module named trio",
            "missing module named uvloop",
            "missing module named sniffio",
            
            # Development/validation tools
            "missing module named email_validator",
            "missing module named toml",
            "missing module named hypothesis",
            "missing module named rich",
            "missing module named pytz",
            
            # Web server optional modules
            "missing module named orjson",
            "missing module named ujson",
            "missing module named gunicorn",
            "missing module named wsproto",
            "missing module named a2wsgi",
            "missing module named watchdog",
            
            # PyInstaller/runtime specific
            "missing module named pyimod02_importers",
            "missing module named ctypes._FuncPointer",
            "missing module named ctypes._CDataType",
            "missing module named ctypes._CArgObject",
            "missing module named pkg_resources",
            "missing module named ctypes._CData",
            "missing module named 'numpy.ctypeslib'",
            "excluded module named numpy",
            "missing module named 'win32com.gen_py'",
            "missing module named 'IPython.core'",
            
            # Warning file header text (to completely hide the warning file content)
            "This file lists modules PyInstaller was not able to find",
            "necessarily mean these modules are required for running your program",
            "Python's standard library and 3rd-party Python packages often conditionally",
            "import optional modules, some of which may be available only on certain",
            "platforms.",
            "Types of import:",
            "* top-level: imported at the top-level - look at these first",
            "* conditional: imported within an if-statement",
            "* delayed: imported within a function",
            "* optional: imported within a try-except-statement",
            "IMPORTANT: Do NOT post this list to the issue-tracker. Use it as",
            "a basis for",
            "tracking down the missing module yourself. Thanks!",
        ]
        
        lines = content.split('\n')
        filtered_warnings: List[str] = []
        ignored_count: int = 0
        
        for raw_line in lines:
            stripped: str = raw_line.strip()
            if not stripped:
                continue
                
            # Check if line matches any ignorable pattern
            if any(pattern in stripped for pattern in ignorable_patterns):
                ignored_count = sum([ignored_count, 1])
                continue
                
            # Skip warning file header/footer text
            if (stripped.startswith('This file lists modules') or 
                stripped.startswith('Types of import:') or
                stripped.startswith('IMPORTANT: Do NOT post') or
                stripped.startswith('tracking down the missing module yourself') or
                stripped.startswith('* top-level:') or
                stripped.startswith('* conditional:') or
                stripped.startswith('* delayed:') or
                stripped.startswith('* optional:') or
                'necessarily mean these modules are required' in stripped or
                'Python\'s standard library' in stripped or
                '3rd-party Python packages' in stripped):
                continue
                
            # Only add non-empty, non-ignorable lines
            filtered_warnings.append(stripped)
        
        if filtered_warnings:
            print("\n⚠️  Important build warnings:")
            top_warnings: List[str] = list(itertools.islice(filtered_warnings, 10))  # Show only first 10
            for warning in top_warnings:
                print(f"  {warning}")
            if len(filtered_warnings) > 10:
                print(f"  ... and {len(filtered_warnings) - 10} more warnings")
        elif ignored_count > 0:
            # Only show ignored count if there are no important warnings
            print(f"\n✅ Build completed with no critical warnings")
            print(f"ℹ️  Ignored {ignored_count} common platform-specific warnings")
        else:
            print("\n✅ Build completed successfully with no warnings")
            
    except Exception as e:
        print(f"  Could not analyze warnings: {e}")

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
    
    # Analyze build warnings
    warning_file = BACKEND_DIR / 'build' / 'JARVIS_Backend' / 'warn-JARVIS_Backend.txt'
    filter_build_warnings(warning_file)
    
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
