
import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

key = os.getenv("OPENAI_API_KEY")
print(f"Testing OpenAI Key: {key[:10]}...")

client = OpenAI(api_key=key)

try:
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Hello, are you active?"}],
        max_tokens=10
    )
    print("SUCCESS!")
    print(f"Response: {response.choices[0].message.content}")
except Exception as e:
    print(f"FAILED: {e}")
