import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

async def verify_modules():
    print("--- JARVIS Module Health Verification ---")
    
    modules_to_test = [
        "input_control", "llm", "media", "desktop", 
        "automation", "file_manager", "bilingual_parser",
        "context", "memory", "security", "system", 
        "whatsapp", "window_manager"
    ]
    
    results = {}
    
    for mod_name in modules_to_test:
        try:
            # Import module
            exec(f"from modules.{mod_name} import *")
            print(f"✅ {mod_name:18} : Imported")
            results[mod_name] = "OK"
        except Exception as e:
            print(f"❌ {mod_name:18} : Import Failed - {e}")
            results[mod_name] = f"ERROR: {e}"

    print("\n--- Testing Core Functionality ---")
    
    # Test Input Control
    try:
        from modules.input_control import input_controller
        pos = await input_controller.get_cursor_position()
        if pos.get("success"):
            print(f"✅ Input Control     : Cursor at {pos['position']}")
        else:
            print(f"❌ Input Control     : Failed - {pos.get('error')}")
    except Exception as e:
        print(f"❌ Input Control     : Exception - {e}")

    # Test Window Manager
    try:
        from modules.window_manager import window_manager
        win_list = await window_manager.get_window_list()
        if win_list.get("success"):
            print(f"✅ Window Manager    : Found {win_list.get('count')} windows")
        else:
            print(f"❌ Window Manager    : Failed - {win_list.get('error')}")
    except Exception as e:
        print(f"❌ Window Manager    : Exception - {e}")

    # Test System Module
    try:
        from modules.system import system_module
        status = await system_module.get_system_status()
        print(f"✅ System Module     : CPU {status.cpu.percent}%")
    except Exception as e:
        print(f"❌ System Module     : Exception - {e}")

    print("\nVerification Complete.")

if __name__ == "__main__":
    asyncio.run(verify_modules())
