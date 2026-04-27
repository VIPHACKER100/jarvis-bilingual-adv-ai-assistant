import os
import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from modules.llm import llm_module
from dotenv import load_dotenv

load_dotenv()

async def test_nvidia():
    print(f"Provider: {llm_module.provider}")
    print(f"NVIDIA API KEY: {'Set' if os.getenv('NVIDIA_API_KEY') else 'Not Set'}")
    
    if not os.getenv('NVIDIA_API_KEY'):
        print("Error: NVIDIA_API_KEY not found in environment or .env")
        return

    print("Testing NVIDIA DeepSeek v4 Pro...")
    response = await llm_module.get_response("Hello, who are you?", language='en')
    
    if response:
        print("\n--- Response ---")
        print(response)
        print("----------------\n")
        print("Test Successful!")
    else:
        print("Test Failed: No response received.")

if __name__ == "__main__":
    asyncio.run(test_nvidia())
