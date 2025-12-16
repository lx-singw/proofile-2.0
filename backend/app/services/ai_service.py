import os
import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

async def refine_resume_with_ai(text: str, action: str) -> dict:
    if not OPENAI_API_KEY:
        raise RuntimeError("OpenAI API key not set")
    prompt = f"You are a resume expert. {action} the following resume:\n{text}"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are a resume improvement assistant."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1024,
        "temperature": 0.7
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(OPENAI_API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result

async def generate_resume_content(user_data: dict, target_role: str = None, job_description: str = None, tone: str = "Professional", style: str = "Modern") -> dict:
    """
    Generate a full resume based on user data and target role.
    """
    if not OPENAI_API_KEY:
        # Mock response for development without API key
        return {
            "basics": {
                "name": user_data.get("profile", {}).get("full_name", "User"),
                "email": user_data.get("profile", {}).get("email", ""),
                "label": target_role or "Professional",
                "summary": f"Generated summary for {target_role or 'Professional'} role. {tone} tone."
            },
            "work": [
                {
                    "company": "Example Corp",
                    "position": "Senior Role",
                    "startDate": "2020-01-01",
                    "endDate": "Present",
                    "summary": "Led key initiatives.",
                    "highlights": ["Achieved X", "Managed Y"]
                }
            ],
            "education": [],
            "skills": [{"name": "Skill 1", "level": "Expert"}]
        }

    prompt = f"""
    You are an expert resume writer. Create a {tone} resume for a {target_role or 'professional'} role.
    
    User Data:
    {user_data}
    
    Job Description (if any):
    {job_description}
    
    Output JSON format compatible with JSON Resume schema.
    """
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are a professional resume writer. Output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 2048,
        "temperature": 0.7
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(OPENAI_API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        # Parse JSON from content (handle potential markdown blocks)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        return json.loads(content)

async def rewrite_content(text: str, enhancement_type: str, context: str = None) -> dict:
    """
    Rewrite resume content based on the specified enhancement type.
    Types: 'professional', 'concise', 'action-oriented', 'grammar-fix'
    """
    if not OPENAI_API_KEY:
        # Mock response
        enhancements = {
            "professional": "Demonstrated leadership by spearheading key initiatives...",
            "concise": "Led key initiatives achieving X and Y.",
            "action-oriented": "Spearheaded strategic initiatives driving X results...",
            "grammar-fix": text  # Assume it's fixed
        }
        return {
            "original": text,
            "enhanced": enhancements.get(enhancement_type, f"Enhanced: {text}"),
            "improvements": ["Improved clarity", "Stronger action verbs", "Better flow"]
        }

    prompt = f"""
    Rewrite the following resume content to be more {enhancement_type}.
    
    Original Content:
    "{text}"
    
    Context (if any):
    {context or "N/A"}
    
    Output JSON with keys: 'original', 'enhanced', 'improvements' (list of strings).
    """
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are an expert resume editor. Output valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 500,
        "temperature": 0.5
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(OPENAI_API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        import json
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        return json.loads(content)

async def parse_resume_to_json(text: str) -> dict:
    """
    Parse resume text into a structured JSON compatible with the profile data model.
    """
    if not OPENAI_API_KEY:
        # Mock response for development
        return {
            "headline": "Experienced Professional",
            "summary": "Detected from resume text (Mock)",
            "experience": [
                {
                    "company": "Uploaded Company",
                    "title": "Uploaded Job",
                    "start_date": "2020-01-01",
                    "end_date": "Present",
                    "description": "Extracted from resume."
                }
            ],
            "education": [
                {
                    "school": "Uploaded University",
                    "degree": "BSc Computer Science",
                    "start_date": "2016-01-01",
                    "end_date": "2020-01-01"
                }
            ],
            "skills": ["Extracted Skill 1", "Extracted Skill 2"]
        }

    prompt = f"""
    You are a data extraction expert. Extract profile data from the following resume text into a JSON object.
    
    Resume Text:
    {text[:4000]}  # Limit context window
    
    Output JSON format:
    {{
        "headline": "Current Role or Professional Headline",
        "summary": "Brief professional summary",
        "experience": [
            {{
                "company": "Company Name",
                "title": "Job Title",
                "location": "City, Country",
                "start_date": "YYYY-MM",
                "end_date": "YYYY-MM or Present",
                "description": "Key responsibilities and achievements"
            }}
        ],
        "education": [
            {{
                "school": "Institution Name",
                "degree": "Degree (e.g. BSc Computer Science)",
                "field_of_study": "Field",
                "start_date": "YYYY-MM",
                "end_date": "YYYY-MM"
            }}
        ],
        "skills": ["Skill 1", "Skill 2"]
    }}
    """
    
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "gpt-4",
        "messages": [
            {"role": "system", "content": "You are a data extraction assistant. Output only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1500,
        "temperature": 0.3
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(OPENAI_API_URL, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        import json
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        return json.loads(content)
