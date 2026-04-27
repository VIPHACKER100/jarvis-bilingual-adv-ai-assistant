print("Script started...")
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("backend/.env")

def test_direct_nvidia():
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        print("NVIDIA_API_KEY not set")
        return

    print(f"Using API Key: {api_key[:10]}...")
    print("Initializing client...")
    client = OpenAI(
      base_url = "https://integrate.api.nvidia.com/v1",
      api_key = api_key
    )

    print("Calling client.chat.completions.create (streaming)...")
    try:
        completion = client.chat.completions.create(
          model="deepseek-ai/deepseek-v4-pro",
          messages=[{"role":"user","content":"Hi, please say 'Hello World'"}],
          temperature=1,
          top_p=0.95,
          max_tokens=100,
          extra_body={"chat_template_kwargs":{"thinking":True}},
          stream=True
        )

        print("Waiting for first chunk...", flush=True)
        import time
        start = time.time()
        for chunk in completion:
            if time.time() - start > 5:
                print(".", end="", flush=True)
                start = time.time()
            if chunk.choices and chunk.choices[0].delta.content:
                print(f"\n[{chunk.choices[0].delta.content}]", end="", flush=True)
        print("\nDirect test finished successfully!")
    except Exception as e:
        print(f"\nDirect test failed: {e}")

if __name__ == "__main__":
    test_direct_nvidia()
