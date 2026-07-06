import json
from pathlib import Path

from .defaults import *
from .environment import *

# Load command data from JSON instead of Python dicts
_commands_path = Path(__file__).parent / "commands.json"
_commands_data = {}
if _commands_path.exists():
    with open(_commands_path, "r", encoding="utf-8") as _f:
        _commands_data = json.load(_f)

DANGEROUS_COMMANDS: set = set(_commands_data.get("dangerous_commands", []))
HINDI_COMMANDS: dict = _commands_data.get("hindi_commands", {})
RESPONSES: dict = _commands_data.get("responses", {})
