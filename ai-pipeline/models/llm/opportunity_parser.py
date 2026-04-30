import json
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional

class ExtractedOpportunity(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    currency: str = "ZAR"
    skills_required: List[str] = Field(default_factory=list)
    experience_level: Optional[str] = None  # Intern, Junior, Mid, Senior, Lead, Executive
    application_deadline: Optional[str] = None  # YYYY-MM-DD
    is_expired: bool = False
    scam_score: float = 0.0  # 0.0 to 1.0
    red_flags: List[str] = Field(default_factory=list)
    tags: List[str] = Field(default_factory=list)
    cleaned_description: str = ""
    
    # Contact Information
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_website: Optional[str] = None
    
    # Application Details
    application_url: Optional[str] = None  # Direct link to apply
    required_documents: List[str] = Field(default_factory=list)  # CV, Cover Letter, ID, etc.
    
    # Opportunity Characteristics
    work_arrangement: Optional[str] = None  # remote, hybrid, onsite
    duration: Optional[str] = None  # "12 months", "Permanent", etc.
    start_date: Optional[str] = None  # YYYY-MM-DD
    benefits: List[str] = Field(default_factory=list)  # Medical aid, pension, etc.
    
    # Structured Requirements (Phase 1 Enhancement)
    qualification_requirements: Optional[dict] = None  # {minimum: {...}, ideal: {...}}
    experience_requirements: Optional[dict] = None  # {minimum: {...}, ideal: {...}}
    skills: List[dict] = Field(default_factory=list)  # [{name: "...", level: "required/preferred"}]
    knowledge_requirements: Optional[dict] = None  # {minimum: [...], ideal: [...]}
    conditions_of_employment: List[str] = Field(default_factory=list)

    @field_validator(
        'skills_required', 'red_flags', 'tags', 'required_documents',
        'benefits', 'skills', 'conditions_of_employment',
        mode='before',
    )
    @classmethod
    def none_to_list(cls, v):
        return v if v is not None else []

    @field_validator('currency', mode='before')
    @classmethod
    def none_currency_to_zar(cls, v):
        return v if v is not None else 'ZAR'


from .groq_client import GroqLLMClient

class LLMExtractor:
    """
    Uses LLM (Groq) to extract structured data from raw job descriptions.
    """
    def __init__(self, api_key: str = None):
        self.api_key = api_key
        self.client = GroqLLMClient(api_key=api_key)

    async def extract(self, raw_text: str) -> ExtractedOpportunity:
        """
        Call LLM to parse text into structured EctractedOpportunity.
        """
        if not raw_text:
            return ExtractedOpportunity(title="Unknown")
            
        data = await self.client.parse_opportunity(raw_text)
        if not data:
            return ExtractedOpportunity(title="Failed to parse")
            
        return ExtractedOpportunity(**data)
