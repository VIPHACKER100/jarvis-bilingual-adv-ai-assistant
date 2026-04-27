#!/usr/bin/env python3
"""
JARVIS Entry Point for PyInstaller
This is the main entry point for the packaged executable
"""

import sys
import os
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
            sys.stderr.reconfigure(encoding='utf-8', errors='replace')
        except:
            pass  # Fallback if reconfigure fails

# Add the backend directory to Python path
if getattr(sys, 'frozen', False):
    # Running in PyInstaller bundle
    bundle_dir = Path(sys._MEIPASS)
    # When frozen, we don't want to chdir to the bundle dir as it's volatile
    # but we need it in the path for imports
else:
    # Running in normal Python environment
    bundle_dir = Path(__file__).parent

sys.path.insert(0, str(bundle_dir))

# Import and run main (Import after path adjustment)
try:
    from config import BACKEND_PORT, LOGS_DIR, DATA_DIR
    from main import app
    import uvicorn
    import traceback
    from datetime import datetime
except Exception as e:
    # Emergency fallback for import errors
    import os
    import sys
    from pathlib import Path
    from datetime import datetime
    
    # Path resolution for emergency logging
    if getattr(sys, 'frozen', False):
        p_root = Path(sys.executable).parent.parent
    else:
        p_root = Path(__file__).parent.parent
        
    l_dir = p_root / "logs"
    l_dir.mkdir(parents=True, exist_ok=True)
    with open(l_dir / "crash.log", "a", encoding="utf-8") as f:
        f.write(f"\n[{datetime.now()}] CRITICAL IMPORT ERROR:\n{str(e)}\n")
        import traceback
        f.write(traceback.format_exc())
    sys.exit(1)

if __name__ == "__main__":
    # Safe print with UTF-8 handling
    def safe_print(text):
        try:
            print(text)
        except UnicodeEncodeError:
            print(text.encode('ascii', 'replace').decode('ascii'))
    
    try:
        safe_print("=" * 60)
        safe_print("JARVIS AI Assistant v3.4.1")
        safe_print("Production Hardened Backend")
        safe_print("Made by VIPHACKER100")
        safe_print("=" * 60)
        safe_print(f"\nStarting JARVIS Backend Server...")
        safe_print(f"Data Directory: {DATA_DIR}")
        safe_print(f"Log Directory: {LOGS_DIR}")
        safe_print(f"Server available at: http://localhost:{BACKEND_PORT}")
        safe_print("\nPress Ctrl+C to stop in this window\n")
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=BACKEND_PORT,
            log_level="info"
        )
    except Exception as e:
        with open(LOGS_DIR / "crash.log", "a", encoding="utf-8") as f:
            f.write(f"\n[{datetime.now()}] UNHANDLED RUNTIME CRASH:\n{str(e)}\n")
            f.write(traceback.format_exc())
        safe_print(f"\n[CRITICAL ERROR] JARVIS has crashed. See logs/crash.log for details.")
        sys.exit(1)
