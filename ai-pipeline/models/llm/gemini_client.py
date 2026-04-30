import google.generativeai as genai
import os
import json
from .prompt_templates import OPPORTUNITY_PARSER_PROMPT

class GeminiLLMClient:
    """
    Client for interacting with Google's Gemini API for structured extraction.
    """
    def __init__(self, api_key: str = None):
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('models/gemini-2.0-flash')

    async def parse_opportunity(self, text: str):
        """
        Parses raw text into structured JSON using Gemini.
        """
        response = await self.model.generate_content_async(
            f"{OPPORTUNITY_PARSER_PROMPT}\n\nRAW TEXT:\n{text}",
            generation_config={"response_mime_type": "application/json"}
        )
        
        try:
            return json.loads(response.text)
        except json.JSONDecodeError:
            return None
