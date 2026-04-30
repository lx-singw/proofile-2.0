from groq import Groq
import os
import json
from .prompt_templates import OPPORTUNITY_PARSER_PROMPT

class GroqLLMClient:
    """
    Client for interacting with Groq API for structured extraction.
    Uses Llama 3.3 70B model for fast inference.
    """
    def __init__(self, api_key: str = None):
        api_key = api_key or os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.1-8b-instant"

    async def parse_opportunity(self, text: str):
        """
        Parses raw text into structured JSON using Groq.
        """
        try:
            print(f"DEBUG: Requesting Groq with model: {self.model}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": OPPORTUNITY_PARSER_PROMPT
                    },
                    {
                        "role": "user", 
                        "content": f"Parse the following job posting and return JSON:\n\n{text}"
                    }
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
        except json.JSONDecodeError:
            return None
        except Exception as e:
            print(f"Groq API error: {e}")
            return None
