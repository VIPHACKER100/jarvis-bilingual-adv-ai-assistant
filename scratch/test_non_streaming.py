import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("backend/.env")

def test_non_streaming_nvidia():
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        print("NVIDIA_API_KEY not set")
        return

    client = OpenAI(
      base_url = "https://integrate.api.nvidia.com/v1",
      api_key = api_key
    )

    print("Sending NON-STREAMING request to NVIDIA deepseek-ai/deepseek-v4-pro...")
    try:
        completion = client.chat.completions.create(
          model="deepseek-ai/deepseek-v4-pro",
          messages=[{"role":"user","content":"Hi, please say 'Hello World'"}],
          temperature=1,
          top_p=0.95,
          max_tokens=100,
          extra_body={"chat_template_kwargs":{"thinking":False}},
          stream=False,
          timeout=30.0
        )

        print(f"Response: {completion.choices[0].message.content}")
        print("Non-streaming test finished successfully!")
    except Exception as e:
        print(f"Non-streaming test failed: {e}")

if __name__ == "__main__":
    test_non_streaming_nvidia()
