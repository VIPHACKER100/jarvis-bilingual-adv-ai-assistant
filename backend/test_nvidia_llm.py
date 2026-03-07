import asyncio
import os
import sys
from pathlib import Path

# Add the backend directory to the sys.path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from modules.llm import llm_module

async def test_all_providers():
    print("--- JARVIS LLM API Multi-Provider Test ---")
    
    providers = ["nvidia", "openrouter"]
    test_queries = [
        "Hello JARVIS, who are you?",
        "नमस्ते जार्विस, आप कैसे हैं?"
    ]
    
    for provider in providers:
        print(f"\n{'='*20}")
        print(f"Testing Provider: {provider.upper()}")
        print(f"{'='*20}")
        
        # Temporarily set provider
        llm_module.provider = provider
        
        key = os.getenv("NVIDIA_API_KEY" if provider == "nvidia" else "OPENROUTER_API_KEY")
        if not key:
            print(f"SKIPPING: No API key found for {provider}")
            continue
            
        for query in test_queries:
            print(f"\nUser: {query}")
            lang = 'hi' if any('\u0900' <= c <= '\u097f' for c in query) else 'en'
            try:
                # Use a shorter timeout for testing if needed, or stick to the module's 120s
                response = await llm_module.get_response(query, language=lang)
                print(f"JARVIS ({provider}): {response}")
            except Exception as e:
                print(f"Error for {provider}: {e}")

if __name__ == "__main__":
    asyncio.run(test_all_providers())
