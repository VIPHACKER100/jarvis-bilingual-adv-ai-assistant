#!/usr/bin/env python3
"""
JARVIS Build Script
Creates standalone executable for Windows
"""

import os
import sys
import shutil
import subprocess
import zipfile
from pathlib import Path
import itertools
import json
from datetime import datetime
import time

class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log(msg, end='\n'):
    """Print message with real-time date/timestamp and ANSI colors"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # Auto-colorize standard tags
    colored_msg = msg
    if '[ZIP]' in msg or '[CLEAN]' in msg or '[RELEASE]' in msg:
        colored_msg = colored_msg.replace('[', f'{Colors.HEADER}[').replace(']', f']{Colors.ENDC}')
    if '[OK]' in msg:
        colored_msg = colored_msg.replace('[OK]', f'{Colors.OKGREEN}[OK]{Colors.ENDC}')
    if '[FAIL]' in msg:
        colored_msg = colored_msg.replace('[FAIL]', f'{Colors.FAIL}[FAIL]{Colors.ENDC}')
    if '[BACKEND]' in msg:
        colored_msg = colored_msg.replace('[BACKEND]', f'{Colors.OKBLUE}[BACKEND]{Colors.ENDC}')
    if '[FRONTEND]' in msg:
        colored_msg = colored_msg.replace('[FRONTEND]', f'{Colors.OKCYAN}[FRONTEND]{Colors.ENDC}')
    if 'WARNING' in msg:
        colored_msg = colored_msg.replace('WARNING', f'{Colors.WARNING}WARNING{Colors.ENDC}')
        
    sys.stdout.write(f"{Colors.BOLD}[{timestamp}]{Colors.ENDC} {colored_msg}{end}")
    sys.stdout.flush()

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent

def get_version():
    try:
        pkg_json = PROJECT_ROOT / 'package.json'
        if pkg_json.exists():
            with open(pkg_json, 'r', encoding='utf-8') as f:
                return json.load(f).get('version', '3.9.0')
    except Exception:
        pass
    return '3.9.0'

VERSION = get_version()

BACKEND_DIR = PROJECT_ROOT / 'backend'
FRONTEND_DIR = PROJECT_ROOT / 'src'
DIST_DIR = PROJECT_ROOT / 'dist'
BUILD_DIR = PROJECT_ROOT / 'build'
RELEASE_DIR = PROJECT_ROOT / 'release'

def clean_build_dirs():
    """Clean previous build artifacts"""
    log("[CLEAN] Cleaning build directories...")
    
    dirs_to_clean = [BUILD_DIR, DIST_DIR, RELEASE_DIR]
    for dir_path in dirs_to_clean:
        if dir_path.exists():
            shutil.rmtree(dir_path, ignore_errors=True)
            log(f"  [OK] Removed {dir_path}")

def build_backend():
    """Build backend executable with PyInstaller"""
    log("\n[BACKEND] Building JARVIS Backend...")
    
    orig_cwd = os.getcwd()
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
        # Use Popen to capture output in real-time and display a progress bar
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        
        start_time_local = time.time()
        spinner = itertools.cycle(['-', '\\', '|', '/'])
        
        for line in iter(process.stdout.readline, ''):
            elapsed = time.time() - start_time_local
            if int(elapsed) % 2 == 0:
                timestamp = datetime.now().strftime('%H:%M:%S')
                sys.stdout.write(f"\r[{timestamp}] [BACKEND] Compiling... {next(spinner)} ({elapsed:.0f}s)")
                sys.stdout.flush()
                
        process.stdout.close()
        return_code = process.wait()
        
        print() # New line after progress bar
        if return_code == 0:
            log(f"  [OK] Backend executable built successfully")
            return True
        else:
            log(f"  [FAIL] Backend build failed with return code {return_code}")
            return False
    except Exception as e:
        log(f"  [FAIL] Unexpected error during build: {e}")
        return False
    finally:
        os.chdir(orig_cwd)

def build_frontend():
    """Build frontend with Vite"""
    log("\n[FRONTEND] Building JARVIS Frontend...")
    
    # Build frontend
    try:
        subprocess.run(['npm', 'run', 'build'], check=True, cwd=PROJECT_ROOT)
        log("  [OK] Frontend built successfully")
        return True
    except subprocess.CalledProcessError as e:
        log(f"  [FAIL] Frontend build failed: {e}")
        return False
    except FileNotFoundError:
        log("  [FAIL] npm not found. Please install Node.js")
        return False

def create_release_package():
    """Create final release package"""
    log("\n[RELEASE] Creating release package...")
    
    RELEASE_DIR.mkdir(exist_ok=True)
    
    # Copy backend executable
    backend_dist = BACKEND_DIR / 'dist' / 'JARVIS_Backend'
    if backend_dist.exists():
        shutil.copytree(backend_dist, RELEASE_DIR / 'backend', dirs_exist_ok=True)
        log("  [OK] Copied backend executable")
    
    # Frontend is bundled inside backend executable, no need to copy separately    
    # Create launcher script
    create_launcher_script()
    
    # Create README
    create_release_readme()
    
    # Create .env template
    create_env_template()
    
    print(f"\n[DIR] Release package created in: {RELEASE_DIR}")

def create_launcher_script():
    """Create Windows launcher batch file"""
    launcher_content = f'''@echo off
chcp 65001 >nul
title JARVIS AI Assistant
taskkill /F /IM JARVIS_Backend.exe 2>nul
echo.
echo ╔═══════════════════════════════════════╗
echo ║     JARVIS AI Assistant v{VERSION:<13}║
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
    
    log("  [OK] Created launcher script (START_JARVIS.bat)")

def create_release_readme():
    """Create release README"""
    readme_content = f'''# JARVIS AI Assistant v{VERSION}
> By VIPHACKER100 (Aryan Ahirwar)

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
- **Vision**: Capture text / analyze screen via "Read screen" or "Analyze screen"
- **Memory**: Click 🧠 button to view facts and conversation history
- **Automation**: Click ⚡ button for scheduled tasks and macros
- **Mobile Sync**: Visit settings to Pair Device via QR Code
- **Security**: Neural Security Matrix auto-monitors processes & network
- **Persistence**: All settings, memories, and logs are saved in the `data/` and `logs/` folders.

## 🗣️ Example Commands

**System:**
- "What time is it?" / "Samay kya hai?"
- "Volume up" / "Aawaz badhao"
- "System status" / "System kaisa chal raha hai?"

**Applications:**
- "Open Chrome" / "Chrome kholo"
- "Close Notepad" / "Notepad band karo"

**Files & Screen:**
- "Open Downloads" / "Downloads kholo"
- "Take screenshot" / "Screenshot lo"
- "What is on my screen?" / "Screen par kya hai?"

**WhatsApp:**
- "Send message to Mom: Hello" / "Mom ko message bhejo: Hello"
- "Draft a reply" / "Uttar likho" (uses screen OCR to draft)

**Security:**
- "Process guardian" — View running processes
- "Network scan" — Show active connections

## 📁 Files

- `backend/` - JARVIS backend server
- `data/` - Persistent database and memory storage
- `logs/` - System logs and crash reports
- `START_JARVIS.bat` - Launch JARVIS
- `config.env` - Configuration settings

## 🆘 Support

- Website: https://aryanahirwar.in
- GitHub: https://github.com/VIPHACKER100
- Email: viphacker.100.org@gmail.com

---
Made with ❤️ by VIPHACKER100 (Aryan Ahirwar) — JARVIS v{VERSION}
'''
    
    readme_path = RELEASE_DIR / 'README.txt'
    with open(readme_path, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    log("  [OK] Created README.txt")

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

# LLM Configuration (Options: nvidia, openrouter, openai, ollama)
LLM_PROVIDER=nvidia
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
NVIDIA_API_KEY=
OPENROUTER_API_KEY=
'''
    
    env_path = RELEASE_DIR / 'config.env'
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(env_content)
    
    log("  [OK] Created config.env template")

def zip_release_package():
    """Create a zip archive of the release folder"""
    zip_filename = f"JARVIS_v{VERSION}.zip"
    zip_path = PROJECT_ROOT / zip_filename
    
    log(f"\n[ZIP] Zipping release package into {zip_filename}...")
    
    try:
        # Remove old zip if exists
        if zip_path.exists():
            zip_path.unlink()
            
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(RELEASE_DIR):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(RELEASE_DIR)
                    zipf.write(file_path, arcname)
        
        log(f"  [OK] Created {zip_filename}")
        return True
    except Exception as e:
        log(f"  [FAIL] Failed to create zip: {e}")
        return False

def filter_build_warnings(warning_file):
    """Filter and categorize build warnings to reduce noise"""
    if not warning_file.exists():
        log("[WARNING] PyInstaller warning file not found at expected path")
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
            "missing module named 'win32com.gen_py'",
            "missing module named 'IPython.core'",
            
            # New noisy warnings detected in v2.1
            "missing module named 'org.python'",
            "missing module named org",
            "missing module named asyncio.DefaultEventLoopPolicy",
            "missing module named pyparsing.Word",
            "missing module named railroad",
            "missing module named 'pkg_resources.extern.pyparsing'",
            "missing module named 'pkg_resources.extern.importlib_resources'",
            "missing module named 'pkg_resources.extern.more_itertools'",
            "missing module named 'com.sun'",
            "missing module named com",
            
            # Common library-specific noise
            "missing module named _winreg",
            "missing module named 'pkg_resources.extern.jaraco'",
            "missing module named 'rich.",
            "missing module named pygments.",
            "missing module named ctags",
            
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
        filtered_warnings: list[str] = []
        ignored_count: int = 0
        
        for raw_line in lines:
            stripped: str = raw_line.strip()
            if not stripped:
                continue
                
            # Check if line matches any ignorable pattern
            if any(pattern in stripped for pattern in ignorable_patterns):
                ignored_count += 1
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
            log("\nWARNING: Important build warnings:")
            top_warnings: list[str] = list(itertools.islice(filtered_warnings, 10))  # Show only first 10
            for warning in top_warnings:
                log(f"  {warning}")
            if len(filtered_warnings) > 10:
                log(f"  ... and {len(filtered_warnings) - 10} more warnings")
        elif ignored_count > 0:
            # Only show ignored count if there are no important warnings
            log(f"\n[OK] Build completed with no critical warnings")
            log(f"[INFO] Ignored {ignored_count} common platform-specific warnings")
        else:
            log("\n[OK] Build completed successfully with no warnings")
            
    except Exception as e:
        log(f"  Could not analyze warnings: {e}")

def main():
    """Main build process"""
    start_time = time.time()
    
    print("=" * 60)
    log(f"{Colors.BOLD}JARVIS AI Assistant v{VERSION} - Build Script{Colors.ENDC}")
    log("Made by VIPHACKER100")
    print("=" * 60)
    
    # Clean previous builds
    clean_build_dirs()
    
    # Build frontend first
    if not build_frontend():
        log("\n[FAIL] Build failed!")
        sys.exit(1)
    
    # Build backend (which bundles the frontend)
    if not build_backend():
        log("\n[FAIL] Build failed!")
        sys.exit(1)
    
    # Analyze build warnings
    warning_file = BACKEND_DIR / 'build' / 'JARVIS_Backend' / 'warn-JARVIS_Backend.txt'
    filter_build_warnings(warning_file)
    
    # Create release package
    create_release_package()
    
    # Zip release package
    zip_release_package()
    
    elapsed_time = time.time() - start_time
    minutes, seconds = divmod(int(elapsed_time), 60)
    
    print("\n" + "=" * 60)
    log(f"[OK] Build completed successfully in {minutes}m {seconds}s!")
    log(f"[DIR] Release package: {RELEASE_DIR}")
    log(f"[ZIP] Distribution Zip: {PROJECT_ROOT / f'JARVIS_v{VERSION}.zip'}")
    print("=" * 60)
    log("\nTo distribute:")
    log(f"1. Share JARVIS_v{VERSION}.zip")
    log("2. Users just unzip and run START_JARVIS.bat")

if __name__ == '__main__':
    main()
