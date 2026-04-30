import google.generativeai as genai
import os

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

print("Available models:")
for m in genai.list_models():
    print(f"  {m.name} - {m.supported_generation_methods}")
