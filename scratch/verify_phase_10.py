import sys
import os
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(r"c:\Users\vipha\Downloads\jarvis-bilingual-adv-ai-assistant")
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from modules.memory import memory_manager
from modules.llm import llm_module

async def test_performance_optimizations():
    print("--- Testing Context Pruning ---")
    deleted = memory_manager.prune_conversations(limit=5)
    print(f"Pruned {deleted} entries.")
    
    print("\n--- Testing System Cache ---")
    from modules.system import system_module
    status1 = await system_module.get_system_status()
    print(f"Status 1 Response Time: {status1.response_time}s")
    
    import asyncio
    await asyncio.sleep(0.5)
    
    status2 = await system_module.get_system_status()
    print(f"Status 2 (Cached) Response Time: {status2.response_time}s")
    
    if status1 == status2:
        print("Success: System status was correctly cached.")
    else:
        print("Warning: System status was not cached or changed rapidly.")

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_performance_optimizations())
