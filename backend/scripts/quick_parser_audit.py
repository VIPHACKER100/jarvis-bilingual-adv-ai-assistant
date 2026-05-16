import json, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from config.commands import HINDI_COMMANDS
from modules.bilingual_parser import BilingualParser

p = BilingualParser()
h = (Path(__file__).resolve().parent.parent / "handlers" / "command_handler.py").read_text(encoding="utf-8")
rows = []
for key, phrases in HINDI_COMMANDS.items():
    sample = next((x for x in phrases if x.isascii() and len(x) > 3), phrases[0])
    ck, lang, params = p.parse_command(sample)
    in_d = f"'{key}'" in h or f'"{key}"' in h
    rows.append({"key": key, "sample": sample, "parsed": ck, "ok": ck == key, "dispatch": in_d})
ok = sum(1 for r in rows if r["ok"] and r["dispatch"])
print("keys", len(rows), "parse_ok", sum(1 for r in rows if r["ok"]), "full_ok", ok)
bad = [r for r in rows if not r["ok"] or not r["dispatch"]]
for r in bad:
    print(r)
out = Path(__file__).resolve().parent.parent.parent / "docs" / "reports" / "parser_quick.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(rows, indent=2), encoding="utf-8")
