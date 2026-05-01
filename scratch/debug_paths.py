import os
from pathlib import Path
from typing import Optional

def _find_frontend_dir() -> Optional[Path]:
    candidates = [
        Path(__file__).resolve().parent.parent / "dist",
        Path(__file__).resolve().parent.parent / "frontend",
        Path.cwd() / "dist",
        Path.cwd() / "frontend"
    ]
    print(f"DEBUG: Current __file__: {__file__}")
    print(f"DEBUG: Current CWD: {os.getcwd()}")
    for c in candidates:
        print(f"DEBUG: Checking candidate: {c}")
        exists = c.exists()
        has_index = (c / "index.html").exists() if exists else False
        print(f"DEBUG: Exists: {exists}, Has index.html: {has_index}")
        if exists and has_index:
            return c
    return None

found = _find_frontend_dir()
print(f"DEBUG: Found frontend dir: {found}")
