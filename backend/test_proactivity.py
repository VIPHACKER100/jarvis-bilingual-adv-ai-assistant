import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from modules.context import context_manager
from modules.window_manager import window_manager
from handlers.command_handler import handle_command

async def test_proactivity():
    print("Testing Proactive Intelligence...")
    
    # 1. Test Active Window Suggestion
    # We can't easily mock the foreground window in a script without win32gui,
    # but we can test the logic if we mock window_manager.get_active_window
    
    async def mock_get_active_window():
        return {
            'title': 'YouTube - Iron Man - Google Chrome',
            'process_name': 'chrome.exe',
            'pid': 1234
        }
    
    original_method = window_manager.get_active_window
    window_manager.get_active_window = mock_get_active_window
    
    print("\n[Scenario: YouTube open in Chrome]")
    suggestion = await context_manager.get_proactive_suggestions()
    print(f"Suggestion: {suggestion}")
    
    if "YouTube" in suggestion or "videos" in suggestion:
        print("✓ PASS: Correct YouTube suggestion")
    else:
        print("✗ FAIL: Unexpected suggestion")
        
    # 2. Test Command Result Inclusion
    print("\n[Testing Command Result Inclusion]")
    result = await handle_command(None, "time")
    print(f"Command: time")
    print(f"Response: {result.get('response')}")
    print(f"Suggestion: {result.get('suggestion')}")
    
    if result.get('suggestion'):
        print("✓ PASS: Suggestion included in command result")
    else:
        print("✗ FAIL: Suggestion missing")

    # Restore
    window_manager.get_active_window = original_method
    print("\nProactive Intelligence tests completed.")

if __name__ == "__main__":
    asyncio.run(test_proactivity())
