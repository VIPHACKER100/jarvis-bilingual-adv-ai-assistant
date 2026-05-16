"""
JARVIS Project Audit — parser, dispatch coverage, module imports, pytest summary.
Run: python scripts/audit_project.py
"""
from __future__ import annotations

import asyncio
import importlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
ROOT = BACKEND.parent
sys.path.insert(0, str(BACKEND))


def run_pytest() -> dict:
    """Run fast unit tests only. Full suite: python -m pytest tests/ -q"""
    cmd = [
        sys.executable, "-m", "pytest",
        "tests/test_bilingual_parser.py",
        "tests/test_config.py",
        "-q", "--tb=no", "-ra",
        "--import-mode=importlib",
    ]
    try:
        proc = subprocess.run(
            cmd,
            cwd=BACKEND,
            capture_output=True,
            text=True,
            timeout=60,
        )
    except subprocess.TimeoutExpired as e:
        partial = (e.stdout or "") + (e.stderr or "")
        return {
            "exit_code": -1,
            "timed_out": True,
            "note": "Pytest timed out. Run full suite manually: python -m pytest tests/ -q",
            "stdout_tail": "\n".join(partial.splitlines()[-10:]),
            "passed": 0,
            "failed": 0,
            "skipped": 0,
        }
    out = proc.stdout + proc.stderr
    passed = failed = skipped = 0
    import re
    m = re.search(r"(\d+) passed", out)
    if m:
        passed = int(m.group(1))
    m = re.search(r"(\d+) failed", out)
    if m:
        failed = int(m.group(1))
    m = re.search(r"(\d+) skipped", out)
    if m:
        skipped = int(m.group(1))
    return {
        "exit_code": proc.returncode,
        "timed_out": False,
        "stdout_tail": "\n".join(out.splitlines()[-15:]),
        "passed": passed,
        "failed": failed,
        "skipped": skipped,
    }


def audit_parser() -> list[dict]:
    from config.commands import HINDI_COMMANDS
    from modules.bilingual_parser import BilingualParser

    parser = BilingualParser()
    handler_src = (BACKEND / "handlers" / "command_handler.py").read_text(encoding="utf-8")
    rows = []

    for key, phrases in HINDI_COMMANDS.items():
        sample_en = next((p for p in phrases if p.isascii() and len(p) > 3), phrases[0] if phrases else key)
        sample_hi = next((p for p in phrases if not p.isascii()), None)
        for label, sample in [("en_sample", sample_en), ("hi_sample", sample_hi)]:
            if not sample:
                continue
            cmd_key, lang, params = parser.parse_command(sample)
            parsed_ok = cmd_key == key
            in_dispatch = (
                f'"{key}"' in handler_src
                or f"'{key}'" in handler_src
                or f"command_key == '{key}'" in handler_src
                or f"command_key in ['{key}'" in handler_src
                or f"'{key}'" in handler_src
            )
            rows.append({
                "command_key": key,
                "sample": sample,
                "sample_type": label,
                "parsed_key": cmd_key,
                "parsed_ok": parsed_ok,
                "language": lang,
                "has_params": params is not None,
                "in_dispatch": in_dispatch,
                "status": _status(parsed_ok, in_dispatch),
            })
            break  # one sample per key is enough for matrix
    return rows


def _status(parsed_ok: bool, in_dispatch: bool) -> str:
    if parsed_ok and in_dispatch:
        return "OK"
    if parsed_ok and not in_dispatch:
        return "PARSE_OK_NO_DISPATCH"
    if not parsed_ok and in_dispatch:
        return "PARSE_MISMATCH"
    return "FAIL"


def audit_module_imports() -> list[dict]:
    modules_dir = BACKEND / "modules"
    rows = []
    for path in sorted(modules_dir.glob("*.py")):
        if path.name.startswith("_"):
            continue
        mod_name = f"modules.{path.stem}"
        try:
            importlib.import_module(mod_name)
            rows.append({"module": mod_name, "import_ok": True, "error": None})
        except Exception as e:
            rows.append({"module": mod_name, "import_ok": False, "error": str(e)[:200]})
    return rows


def audit_tesseract() -> dict:
    try:
        from modules.media import MediaProcessor
        m = MediaProcessor()
        return {"tesseract_ready": m._tesseract_ready}
    except Exception as e:
        return {"tesseract_ready": False, "error": str(e)}


def audit_env() -> dict:
    import os
    keys = [
        "OPENROUTER_API_KEY",
        "NVIDIA_API_KEY",
        "OPENAI_API_KEY",
        "JARVIS_API_KEY",
    ]
    return {k: bool(os.getenv(k)) for k in keys}


async def smoke_dispatch() -> list[dict]:
    """Safe read-only command smoke tests (no shutdown/restart)."""
    from handlers.command_handler import dispatch_command

    tests = [
        ("time", None, "en", "what time is it"),
        ("date", None, "en", "what date is it"),
        ("battery", None, "en", "check battery"),
        ("system_status", None, "en", "system status"),
        ("open_downloads", None, "en", "open downloads"),
        ("take_screenshot", None, "en", "take screenshot"),
        ("get_clipboard", None, "en", "get clipboard"),
        ("list_memories", None, "en", "list memories"),
    ]
    rows = []
    for key, params, lang, raw in tests:
        try:
            result = await dispatch_command(key, params, lang, raw, None, "audit")
            rows.append({
                "command_key": key,
                "success": result.get("success"),
                "action_type": result.get("action_type"),
                "error": result.get("error"),
            })
        except Exception as e:
            rows.append({
                "command_key": key,
                "success": False,
                "action_type": "EXCEPTION",
                "error": str(e)[:300],
            })
    return rows


def main() -> None:
    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "platform": sys.platform,
        "python": sys.version.split()[0],
    }
    print("Auditing parser...")
    report["parser_matrix"] = audit_parser()
    print("Auditing module imports...")
    report["module_imports"] = audit_module_imports()
    print("Checking tesseract & env...")
    report["tesseract"] = audit_tesseract()
    report["env_keys"] = audit_env()
    print("Smoke dispatch (optional)...")
    try:
        report["smoke_dispatch"] = asyncio.run(
            asyncio.wait_for(smoke_dispatch(), timeout=30)
        )
    except Exception as e:
        report["smoke_dispatch"] = {"skipped": True, "error": str(e)[:200]}

    print("Running fast pytest (parser + config)...")
    report["pytest"] = run_pytest()

    out_path = ROOT / "docs" / "reports" / "audit_raw.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {out_path}")

    # Summary stats
    matrix = report["parser_matrix"]
    ok = sum(1 for r in matrix if r["status"] == "OK")
    print(f"Parser+Dispatch OK: {ok}/{len(matrix)}")
    print(f"Pytest: {report['pytest']}")


if __name__ == "__main__":
    main()
