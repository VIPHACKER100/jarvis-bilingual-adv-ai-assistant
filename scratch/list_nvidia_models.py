import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv("backend/.env")

def list_nvidia_models():
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key:
        print("NVIDIA_API_KEY not set")
        return

    client = OpenAI(
      base_url = "https://integrate.api.nvidia.com/v1",
      api_key = api_key
    )

    print("Fetching available models from NVIDIA...")
    try:
        models = client.models.list()
        for model in models:
            print(f"- {model.id}")
    except Exception as e:
        print(f"Failed to list models: {e}")

if __name__ == "__main__":
    list_nvidia_models()
