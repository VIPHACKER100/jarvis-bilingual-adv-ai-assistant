#!/usr/bin/env python3
"""
JARVIS Entry Point for PyInstaller
This is the main entry point for the packaged executable
"""

import sys
from pathlib import Path

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass  # Fallback if reconfigure fails

# Add the backend directory to Python path
if getattr(sys, "frozen", False):
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
    import traceback
    from datetime import datetime

    import uvicorn
    from config import BACKEND_PORT, DATA_DIR, LOGS_DIR, VERSION
    from main import app
except Exception as e:
    # Emergency fallback for import errors
    import sys
    from datetime import datetime
    from pathlib import Path

    # Path resolution for emergency logging
    if getattr(sys, "frozen", False):
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
            print(text.encode("ascii", "replace").decode("ascii"))

    try:
        safe_print("=" * 60)
        safe_print(f"JARVIS AI Assistant v{VERSION}")
        safe_print("Diagnostic Analytics & Async Architecture")
        safe_print("Developed by VIPHACKER100")
        safe_print("=" * 60)
        safe_print("\nStarting JARVIS Backend Server...")
        safe_print(f"Data Directory: {DATA_DIR}")
        safe_print(f"Log Directory: {LOGS_DIR}")
        safe_print(f"Server available at: http://localhost:{BACKEND_PORT}")
        safe_print("\nPress Ctrl+C to stop in this window\n")

        uvicorn.run(app, host="127.0.0.1", port=BACKEND_PORT, log_level="info")
    except Exception as e:
        with open(LOGS_DIR / "crash.log", "a", encoding="utf-8") as f:
            f.write(f"\n[{datetime.now()}] UNHANDLED RUNTIME CRASH:\n{str(e)}\n")
            f.write(traceback.format_exc())
        safe_print("\n[CRITICAL ERROR] JARVIS has crashed. See logs/crash.log for details.")
        sys.exit(1)
