"""
AI Service — OpenAI-powered career intelligence for Proofile.

Enhancements over original:
- Shared persistent AsyncClient (connection reuse, keep-alive)
- Automatic retry with exponential backoff on transient errors (429, 5xx)
- Centralised JSON extraction from markdown-fenced LLM responses
- Input sanitisation and context-window-aware truncation
- Usage/token tracking returned alongside content
- Streaming generator support for real-time bullet optimisation
- New capabilities: skill gap analysis, interview question generation,
  profile completeness scoring, ATS keyword optimisation
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
import time
from typing import Any, AsyncGenerator

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_STREAM_URL = OPENAI_API_URL  # same endpoint, stream=True param differs

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.0  # seconds — doubles on each retry
_RETRYABLE_STATUS = {429, 500, 502, 503, 504}

# Per-function context limits (chars) to stay within model token budgets
_RESUME_TEXT_LIMIT = 6_000   # ~1500 tokens
_USER_DATA_LIMIT = 4_000
_JOB_DESC_LIMIT = 2_000

# ---------------------------------------------------------------------------
# Shared async HTTP client — reuse connections across requests
# ---------------------------------------------------------------------------

_http_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    """Return the module-level shared AsyncClient, creating it if needed."""
    global _http_client
    if _http_client is None or _http_client.is_closed:
        _http_client = httpx.AsyncClient(
            timeout=httpx.Timeout(connect=5.0, read=60.0, write=10.0, pool=5.0),
            limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        )
    return _http_client


async def close_client() -> None:
    """Cleanly close the shared client (call on app shutdown)."""
    global _http_client
    if _http_client and not _http_client.is_closed:
        await _http_client.aclose()
        _http_client = None


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _headers() -> dict[str, str]:
    if not settings.OPENAI_API_KEY:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured. Set it in your .env file."
        )
    return {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }


def _model(override: str | None = None) -> str:
    return override or settings.OPENAI_MODEL or "gpt-4o-mini"


def _truncate(text: str, limit: int) -> str:
    """Hard-truncate text to `limit` chars with a visible marker."""
    if len(text) <= limit:
        return text
    return text[:limit] + "\n[...truncated for context window]"


def _extract_json(raw: str) -> Any:
    """
    Extract and parse JSON from an LLM response that may be wrapped in
    a markdown code fence (```json ... ```) or returned as plain JSON.
    Raises json.JSONDecodeError if parsing fails.
    """
    # Strip markdown fences
    fenced = re.search(r"```(?:json)?\s*([\s\S]+?)```", raw, re.IGNORECASE)
    if fenced:
        raw = fenced.group(1).strip()
    return json.loads(raw.strip())


async def _chat(
    messages: list[dict],
    *,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
    response_format: dict | None = None,
) -> tuple[str, dict]:
    """
    Send a chat completion request with automatic retry on transient errors.

    Returns:
        (content: str, usage: dict) — usage contains prompt_tokens,
        completion_tokens, total_tokens from the API response.
    """
    payload: dict[str, Any] = {
        "model": _model(model),
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if response_format:
        payload["response_format"] = response_format

    client = _get_client()
    delay = _RETRY_BASE_DELAY

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            response = await client.post(
                OPENAI_API_URL, headers=_headers(), json=payload
            )
            if response.status_code in _RETRYABLE_STATUS and attempt < _MAX_RETRIES:
                logger.warning(
                    "OpenAI returned %s on attempt %d/%d — retrying in %.1fs",
                    response.status_code, attempt, _MAX_RETRIES, delay,
                )
                await asyncio.sleep(delay)
                delay *= 2
                continue
            response.raise_for_status()
            data = response.json()
            content: str = data["choices"][0]["message"]["content"] or ""
            usage: dict = data.get("usage", {})
            logger.debug(
                "OpenAI usage: prompt=%s completion=%s total=%s",
                usage.get("prompt_tokens"),
                usage.get("completion_tokens"),
                usage.get("total_tokens"),
            )
            return content, usage
        except httpx.TimeoutException as exc:
            if attempt == _MAX_RETRIES:
                raise RuntimeError("OpenAI request timed out after retries") from exc
            logger.warning("Timeout on attempt %d — retrying", attempt)
            await asyncio.sleep(delay)
            delay *= 2

    raise RuntimeError("OpenAI request failed after all retries")


async def _stream_chat(
    messages: list[dict],
    *,
    model: str | None = None,
    max_tokens: int = 1024,
    temperature: float = 0.7,
) -> AsyncGenerator[str, None]:
    """
    Yield text delta chunks from a streaming chat completion request.
    """
    payload: dict[str, Any] = {
        "model": _model(model),
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }
    client = _get_client()
    async with client.stream(
        "POST", OPENAI_API_URL, headers=_headers(), json=payload
    ) as response:
        response.raise_for_status()
        async for line in response.aiter_lines():
            if not line.startswith("data: "):
                continue
            raw = line[6:].strip()
            if raw == "[DONE]":
                break
            try:
                chunk = json.loads(raw)
                delta = chunk["choices"][0]["delta"].get("content", "")
                if delta:
                    yield delta
            except (json.JSONDecodeError, KeyError):
                continue


def _no_key_error() -> RuntimeError:
    return RuntimeError(
        "OPENAI_API_KEY is not set. Add it to your .env to enable AI features."
    )


# ---------------------------------------------------------------------------
# Public functions
# ---------------------------------------------------------------------------

async def refine_resume_with_ai(text: str, action: str) -> dict:
    """
    Apply a specific refinement action to resume text.

    Args:
        text:   Raw resume text.
        action: Instruction (e.g. "make this more concise").

    Returns:
        Full OpenAI response dict (choices, usage, model, …).
    """
    if not settings.OPENAI_API_KEY:
        raise _no_key_error()

    content, usage = await _chat(
        messages=[
            {"role": "system", "content": "You are a resume improvement assistant."},
            {
                "role": "user",
                "content": (
                    f"Task: {action}\n\nResume:\n{_truncate(text, _RESUME_TEXT_LIMIT)}"
                ),
            },
        ],
        max_tokens=1024,
        temperature=0.7,
    )
    return {"content": content, "usage": usage}


async def optimize_bullet_streaming(text: str, context: str = "") -> AsyncGenerator[str, None]:
    """
    Stream token-by-token improvements for a single resume bullet.
    Yields string chunks as they arrive from OpenAI.
    """
    if not settings.OPENAI_API_KEY:
        yield f"Improved: {text}"
        return

    async for chunk in _stream_chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert resume writer. Rewrite the bullet point provided "
                    "to be more impactful. Use strong action verbs and quantify where "
                    "possible. Return ONLY the improved bullet, no explanation."
                ),
            },
            {
                "role": "user",
                "content": f"Context: {context}\n\nBullet: {text}",
            },
        ],
        max_tokens=200,
        temperature=0.6,
    ):
        yield chunk


async def generate_resume_content(
    user_data: dict,
    target_role: str | None = None,
    job_description: str | None = None,
    tone: str = "Professional",
    style: str = "Modern",
) -> dict:
    """
    Generate a complete resume in JSON Resume schema format.

    Returns dict with keys: basics, work, education, skills (+ usage).
    """
    if not settings.OPENAI_API_KEY:
        return {
            "basics": {
                "name": user_data.get("profile", {}).get("full_name", "User"),
                "email": user_data.get("profile", {}).get("email", ""),
                "label": target_role or "Professional",
                "summary": (
                    f"Generated summary for {target_role or 'Professional'} role."
                    f" {tone} tone."
                ),
            },
            "work": [
                {
                    "company": "Example Corp",
                    "position": "Senior Role",
                    "startDate": "2020-01-01",
                    "endDate": "Present",
                    "summary": "Led key initiatives.",
                    "highlights": ["Achieved X", "Managed Y"],
                }
            ],
            "education": [],
            "skills": [{"name": "Skill 1", "level": "Expert"}],
            "_mock": True,
        }

    user_content = (
        f"Tone: {tone}\nStyle: {style}\nTarget role: {target_role or 'Not specified'}\n\n"
        f"User data:\n{_truncate(json.dumps(user_data, default=str), _USER_DATA_LIMIT)}\n\n"
        f"Job description:\n{_truncate(job_description or 'Not provided', _JOB_DESC_LIMIT)}\n\n"
        "Output JSON compatible with the JSON Resume schema. No markdown, pure JSON only."
    )

    raw, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": "You are a professional resume writer. Output only valid JSON.",
            },
            {"role": "user", "content": user_content},
        ],
        max_tokens=2048,
        temperature=0.7,
    )
    result = _extract_json(raw)
    result["_usage"] = usage
    return result


async def rewrite_content(
    text: str,
    enhancement_type: str,
    context: str | None = None,
) -> dict:
    """
    Rewrite resume content using a specified enhancement style.

    Args:
        text:             The original resume text/bullet.
        enhancement_type: One of 'professional', 'concise', 'action-oriented',
                          'grammar-fix', 'quantified'.
        context:          Optional extra context (e.g. job title).

    Returns:
        {"original": str, "enhanced": str, "improvements": list[str], "_usage": dict}
    """
    _VALID_TYPES = {"professional", "concise", "action-oriented", "grammar-fix", "quantified"}
    if enhancement_type not in _VALID_TYPES:
        enhancement_type = "professional"

    if not settings.OPENAI_API_KEY:
        _mocks = {
            "professional": "Demonstrated strategic leadership by spearheading key initiatives...",
            "concise": "Led key initiatives achieving X and Y.",
            "action-oriented": "Spearheaded strategic initiatives driving measurable results...",
            "grammar-fix": text,
            "quantified": "Increased team efficiency by 35% by redesigning the onboarding process.",
        }
        return {
            "original": text,
            "enhanced": _mocks.get(enhancement_type, f"Enhanced: {text}"),
            "improvements": ["Stronger action verbs", "Improved clarity", "Better flow"],
            "_mock": True,
        }

    raw, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": "You are an expert resume editor. Output valid JSON only.",
            },
            {
                "role": "user",
                "content": (
                    f"Rewrite the content below to be more {enhancement_type}.\n\n"
                    f"Original:\n{_truncate(text, 2000)}\n\n"
                    f"Context: {context or 'N/A'}\n\n"
                    "Output JSON with keys: 'original', 'enhanced', 'improvements' (list of strings)."
                ),
            },
        ],
        max_tokens=600,
        temperature=0.5,
    )
    result = _extract_json(raw)
    result["_usage"] = usage
    return result


async def parse_resume_to_json(text: str) -> dict:
    """
    Parse raw resume text into a structured profile dict.

    Returns dict with keys: headline, summary, experience, education, skills.
    """
    if not settings.OPENAI_API_KEY:
        return {
            "headline": "Experienced Professional",
            "summary": "Detected from resume text (Mock)",
            "experience": [
                {
                    "company": "Uploaded Company",
                    "title": "Uploaded Job",
                    "start_date": "2020-01-01",
                    "end_date": "Present",
                    "description": "Extracted from resume.",
                }
            ],
            "education": [
                {
                    "school": "Uploaded University",
                    "degree": "BSc Computer Science",
                    "start_date": "2016-01-01",
                    "end_date": "2020-01-01",
                }
            ],
            "skills": ["Extracted Skill 1", "Extracted Skill 2"],
            "_mock": True,
        }

    schema_hint = (
        '{"headline":"...", "summary":"...", "experience":[{"company":"...", '
        '"title":"...", "location":"...", "start_date":"YYYY-MM", '
        '"end_date":"YYYY-MM or Present", "description":"..."}], '
        '"education":[{"school":"...", "degree":"...", "field_of_study":"...", '
        '"start_date":"YYYY-MM", "end_date":"YYYY-MM"}], "skills":["..."]}'
    )

    raw, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": "You are a data extraction assistant. Output only valid JSON.",
            },
            {
                "role": "user",
                "content": (
                    "Extract profile data from the following resume text.\n\n"
                    f"Resume:\n{_truncate(text, _RESUME_TEXT_LIMIT)}\n\n"
                    f"Output this exact JSON shape:\n{schema_hint}"
                ),
            },
        ],
        max_tokens=1500,
        temperature=0.2,
    )
    result = _extract_json(raw)
    result["_usage"] = usage
    return result


async def generate_cover_letter(
    user_data: dict,
    job_data: dict,
    tone: str = "Professional",
) -> dict:
    """
    Generate a tailored cover letter.

    Returns:
        {"letter": str, "_usage": dict}
    """
    if not settings.OPENAI_API_KEY:
        title = job_data.get("title", "position")
        company = job_data.get("company", "your company")
        headline = user_data.get("profile", {}).get("headline", "my field")
        return {
            "letter": (
                f"Dear Hiring Manager,\n\nI am excited to apply for the {title} role "
                f"at {company}. My background in {headline} makes me a strong fit..."
            ),
            "_mock": True,
        }

    user_content = (
        f"Tone: {tone}\n\n"
        f"User profile:\n{_truncate(json.dumps(user_data, default=str), _USER_DATA_LIMIT)}\n\n"
        f"Job details:\n{_truncate(json.dumps(job_data, default=str), _JOB_DESC_LIMIT)}\n\n"
        "Requirements:\n"
        "- Reference specific matching skills from the profile.\n"
        "- Mention the company name.\n"
        "- Keep it under 300 words.\n"
        "- Output ONLY the letter text, no JSON."
    )

    letter, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": "You are a professional cover letter writer.",
            },
            {"role": "user", "content": user_content},
        ],
        max_tokens=1000,
        temperature=0.7,
    )
    return {"letter": letter.strip(), "_usage": usage}


async def generate_congrats_message(
    sender_name: str,
    recipient_name: str,
    milestone_type: str,
) -> dict:
    """
    Generate a short professional congratulatory message.

    Returns:
        {"message": str, "_usage": dict}
    """
    if not settings.OPENAI_API_KEY:
        return {
            "message": (
                f"Congrats, {recipient_name}! Great to see your {milestone_type} "
                f"milestone. - {sender_name}"
            ),
            "_mock": True,
        }

    msg, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": "You are a professional networker. Be warm but concise.",
            },
            {
                "role": "user",
                "content": (
                    f"Write a congratulatory message from {sender_name} to "
                    f"{recipient_name} regarding their {milestone_type}.\n"
                    "Requirements: professional yet warm, max 2 sentences, "
                    "output ONLY the message text."
                ),
            },
        ],
        max_tokens=200,
        temperature=0.8,
    )
    return {"message": msg.strip(), "_usage": usage}


# ---------------------------------------------------------------------------
# NEW: Skill Gap Analysis
# ---------------------------------------------------------------------------

async def analyse_skill_gap(
    user_skills: list[str],
    job_description: str,
    target_role: str | None = None,
) -> dict:
    """
    Compare user skills against a job description to identify gaps and priorities.

    Returns:
        {
          "matched_skills": list[str],
          "missing_skills": list[str],
          "recommended_courses": list[str],
          "gap_score": int,          # 0–100: 100 = perfect match
          "summary": str,
          "_usage": dict
        }
    """
    if not settings.OPENAI_API_KEY:
        return {
            "matched_skills": user_skills[:3],
            "missing_skills": ["Docker", "System Design", "Go"],
            "recommended_courses": [
                "Docker Mastery — Udemy",
                "System Design Interview — Educative",
            ],
            "gap_score": 65,
            "summary": "Mock skill gap analysis — configure OPENAI_API_KEY for real results.",
            "_mock": True,
        }

    raw, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a career advisor specialising in skill gap analysis. "
                    "Output only valid JSON."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Target role: {target_role or 'Not specified'}\n\n"
                    f"Candidate skills: {json.dumps(user_skills)}\n\n"
                    f"Job description:\n{_truncate(job_description, _JOB_DESC_LIMIT)}\n\n"
                    "Analyse the skill gap and output JSON with keys: "
                    "matched_skills (list), missing_skills (list), "
                    "recommended_courses (list of strings with resource names), "
                    "gap_score (int 0-100 where 100 = perfect match), "
                    "summary (one paragraph)."
                ),
            },
        ],
        max_tokens=800,
        temperature=0.3,
    )
    result = _extract_json(raw)
    result["_usage"] = usage
    return result


# ---------------------------------------------------------------------------
# NEW: Interview Question Generator
# ---------------------------------------------------------------------------

async def generate_interview_questions(
    job_description: str,
    user_profile: dict,
    question_types: list[str] | None = None,
    count: int = 10,
) -> dict:
    """
    Generate tailored interview questions for a specific role and candidate.

    Args:
        job_description: The job posting text.
        user_profile:    Candidate's profile data.
        question_types:  e.g. ['behavioural', 'technical', 'situational']
        count:           How many questions to generate (max 20).

    Returns:
        {
          "questions": [
            {
              "question": str,
              "type": str,
              "difficulty": "easy"|"medium"|"hard",
              "tip": str       # what a good answer covers
            }
          ],
          "_usage": dict
        }
    """
    count = min(count, 20)
    types = question_types or ["behavioural", "technical", "situational"]

    if not settings.OPENAI_API_KEY:
        return {
            "questions": [
                {
                    "question": "Tell me about a challenging project you led.",
                    "type": "behavioural",
                    "difficulty": "medium",
                    "tip": "Use the STAR method (Situation, Task, Action, Result).",
                }
            ],
            "_mock": True,
        }

    raw, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a senior technical recruiter. Generate realistic "
                    "interview questions. Output only valid JSON."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Question types: {types}\n"
                    f"Count: {count}\n\n"
                    f"Job description:\n{_truncate(job_description, _JOB_DESC_LIMIT)}\n\n"
                    f"Candidate profile:\n"
                    f"{_truncate(json.dumps(user_profile, default=str), _USER_DATA_LIMIT)}\n\n"
                    "Output JSON with key 'questions' containing a list of objects, each with: "
                    "question (str), type (str), difficulty (easy/medium/hard), tip (str)."
                ),
            },
        ],
        max_tokens=1500,
        temperature=0.6,
    )
    result = _extract_json(raw)
    result["_usage"] = usage
    return result


# ---------------------------------------------------------------------------
# NEW: Profile Completeness Scorer
# ---------------------------------------------------------------------------

async def score_profile_completeness(profile: dict) -> dict:
    """
    Score a user profile on completeness and quality.

    Returns:
        {
          "overall_score": int,         # 0–100
          "section_scores": {
              "headline": int,
              "summary": int,
              "experience": int,
              "education": int,
              "skills": int,
              "photo": int,
              "contact": int,
          },
          "top_recommendations": list[str],
          "ats_friendly": bool,
          "_usage": dict
        }
    """
    if not settings.OPENAI_API_KEY:
        return {
            "overall_score": 62,
            "section_scores": {
                "headline": 80,
                "summary": 40,
                "experience": 75,
                "education": 90,
                "skills": 60,
                "photo": 0,
                "contact": 70,
            },
            "top_recommendations": [
                "Add a professional photo to increase views by 40%.",
                "Expand your summary to at least 150 words.",
                "Add quantified achievements to your experience bullets.",
            ],
            "ats_friendly": False,
            "_mock": True,
        }

    raw, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a professional profile reviewer with expertise in "
                    "ATS optimisation. Output only valid JSON."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Profile data:\n"
                    f"{_truncate(json.dumps(profile, default=str), _USER_DATA_LIMIT)}\n\n"
                    "Score this profile and output JSON with keys: "
                    "overall_score (int 0-100), "
                    "section_scores (object with headline, summary, experience, "
                    "education, skills, photo, contact — each int 0-100), "
                    "top_recommendations (list of max 5 actionable strings), "
                    "ats_friendly (bool)."
                ),
            },
        ],
        max_tokens=600,
        temperature=0.2,
    )
    result = _extract_json(raw)
    result["_usage"] = usage
    return result


# ---------------------------------------------------------------------------
# NEW: ATS Keyword Optimiser
# ---------------------------------------------------------------------------

async def optimise_for_ats(
    resume_text: str,
    job_description: str,
) -> dict:
    """
    Suggest keyword insertions to improve ATS match rate for a specific job.

    Returns:
        {
          "missing_keywords": list[str],
          "keyword_density": dict[str, int],  # keyword → count in resume
          "suggested_edits": list[{"section": str, "suggestion": str}],
          "estimated_ats_score": int,         # 0–100 before edits
          "_usage": dict
        }
    """
    if not settings.OPENAI_API_KEY:
        return {
            "missing_keywords": ["agile", "CI/CD", "stakeholder management"],
            "keyword_density": {"Python": 3, "SQL": 1},
            "suggested_edits": [
                {
                    "section": "summary",
                    "suggestion": "Mention agile/scrum methodology.",
                }
            ],
            "estimated_ats_score": 58,
            "_mock": True,
        }

    raw, usage = await _chat(
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an ATS optimisation specialist. "
                    "Output only valid JSON."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Resume:\n{_truncate(resume_text, _RESUME_TEXT_LIMIT)}\n\n"
                    f"Job description:\n{_truncate(job_description, _JOB_DESC_LIMIT)}\n\n"
                    "Analyse keyword match and output JSON with keys: "
                    "missing_keywords (list of strings), "
                    "keyword_density (object mapping keyword to count in resume), "
                    "suggested_edits (list of objects with 'section' and 'suggestion'), "
                    "estimated_ats_score (int 0-100)."
                ),
            },
        ],
        max_tokens=800,
        temperature=0.3,
    )
    result = _extract_json(raw)
    result["_usage"] = usage
    return result
