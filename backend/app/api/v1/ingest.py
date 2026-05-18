from __future__ import annotations

import hmac
import json
from datetime import date, datetime, time, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.core.config import settings
from app.models.opportunity import Opportunity

router = APIRouter(prefix="/ingest", tags=["ingest"])


class LocationPayload(BaseModel):
    city: str | None = None
    province: str | None = None
    country: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class SalaryPayload(BaseModel):
    min: int | None = None
    max: int | None = None
    currency: str | None = None


class ContactPayload(BaseModel):
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    application_url: str | None = None
    career_page: str | None = None  # company careers/about page (not the apply link)


class IngestOpportunityPayload(BaseModel):
    model_config = ConfigDict(extra="ignore")

    type: str = Field(..., min_length=1, max_length=100)
    title: str = Field(..., min_length=1, max_length=255)
    slug: str | None = Field(default=None, max_length=500)
    description: str = Field(..., min_length=1)
    requirements: list[str] = Field(default_factory=list)
    location: LocationPayload = Field(default_factory=LocationPayload)
    salary: SalaryPayload = Field(default_factory=SalaryPayload)
    source_url: str = Field(..., min_length=1)
    source_platform: str = Field(..., min_length=1, max_length=50)
    trust_score: float | None = Field(default=None, ge=0.0, le=1.0)
    status: str = Field(..., pattern=r"^(active|expired|pending|quarantine)$")
    contact: ContactPayload = Field(default_factory=ContactPayload)
    canonical_link: str | None = None
    source_links: list[str] = Field(default_factory=list)
    is_direct_company_link: bool = False
    link_quality: str | None = None
    ai_confidence_score: float | None = Field(default=None, ge=0.0, le=1.0)
    application_deadline: str | date | datetime | None = None
    extra_metadata: dict[str, Any] = Field(default_factory=dict)

    # Rich AI-extracted fields
    benefits: list[str] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    red_flags: list[str] = Field(default_factory=list)
    scam_score: float = Field(default=0.0, ge=0.0, le=1.0)
    duration: str | None = None
    start_date: str | date | None = None
    qualification_requirements: dict[str, Any] | None = None
    experience_requirements: dict[str, Any] | None = None
    skills_structured: list[dict[str, Any]] = Field(default_factory=list)
    knowledge_requirements: dict[str, Any] | None = None
    conditions_of_employment: list[str] = Field(default_factory=list)


class IngestOpportunityResult(BaseModel):
    id: int | None = None
    status: str


def require_internal_secret(
    x_internal_secret: str | None = Header(default=None, alias="X-Internal-Secret"),
) -> None:
    if not x_internal_secret or not hmac.compare_digest(
        x_internal_secret,
        settings.INTERNAL_API_SECRET,
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid internal secret",
        )


def _parse_datetime(value: str | date | datetime | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, date):
        parsed = datetime.combine(value, time.min)
    else:
        normalized = value.strip()
        if not normalized:
            return None
        if normalized.endswith("Z"):
            normalized = f"{normalized[:-1]}+00:00"
        candidates = [normalized]
        if " " in normalized and "T" not in normalized:
            candidates.append(normalized.replace(" ", "T", 1))
        parsed = None
        for candidate in candidates:
            try:
                parsed = datetime.fromisoformat(candidate)
                break
            except ValueError:
                continue
        if parsed is None:
            for fmt in ("%Y-%m-%d", "%d %B %Y", "%d %b %Y"):
                try:
                    parsed = datetime.strptime(normalized, fmt)
                    break
                except ValueError:
                    continue
        if parsed is None:
            return None
    if parsed.tzinfo is not None:
        return parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


def _parse_date(value: str | date | datetime | None) -> date | None:
    if value is None:
        return None
    if isinstance(value, date) and not isinstance(value, datetime):
        return value
    parsed = _parse_datetime(value)
    return parsed.date() if parsed else None


def _format_location(payload: LocationPayload) -> str | None:
    parts = [payload.city, payload.province, payload.country]
    cleaned = [part.strip() for part in parts if part and part.strip()]
    return ", ".join(cleaned) if cleaned else None


def _infer_category(opportunity_type: str) -> str:
    lowered = opportunity_type.lower()
    training_tokens = {
        "learnership",
        "internship",
        "bursary",
        "training",
        "skills_program",
        "skills-program",
    }
    return "training_skills_programs" if lowered in training_tokens else "jobs"


def _normalize_remote_type(value: Any) -> str | None:
    if not value or not isinstance(value, str):
        return None
    lowered = value.strip().lower()
    if "hybrid" in lowered:
        return "hybrid"
    if "remote" in lowered:
        return "remote"
    if lowered in {"onsite", "on-site", "on site", "office"}:
        return "onsite"
    if "flex" in lowered:
        return "flexible"
    return None


def _format_salary_range(payload: SalaryPayload, salary_string: Any) -> str | None:
    if isinstance(salary_string, str) and salary_string.strip():
        return salary_string.strip()
    if payload.min is None and payload.max is None:
        return None
    if payload.min is not None and payload.max is not None:
        return f"R{payload.min:,}-R{payload.max:,}"
    if payload.min is not None:
        return f"From R{payload.min:,}"
    return f"Up to R{payload.max:,}"


def _resolve_company_name(payload: IngestOpportunityPayload) -> str:
    metadata = payload.extra_metadata
    for key in ("company", "company_name", "employer", "organisation", "organization"):
        value = metadata.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    if payload.contact.website:
        host = payload.contact.website.split("//")[-1].split("/")[0].strip()
        if host:
            return host.replace("www.", "")
    return payload.source_platform.replace("-", " ").title()


@router.post(
    "/opportunity",
    response_model=IngestOpportunityResult,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_internal_secret)],
)
async def ingest_opportunity(
    payload: IngestOpportunityPayload,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> IngestOpportunityResult:
    existing = await db.execute(
        select(Opportunity.id).where(Opportunity.source_url == payload.source_url)
    )
    if existing.scalar_one_or_none() is not None:
        response.status_code = status.HTTP_200_OK
        return IngestOpportunityResult(status="duplicate")

    deadline_date = _parse_date(payload.application_deadline)
    expires_at = (
        datetime.combine(deadline_date, time.max)
        if deadline_date is not None
        else None
    )
    published_at = _parse_datetime(payload.extra_metadata.get("published_date"))
    if published_at is None:
        published_at = datetime.now(timezone.utc).replace(tzinfo=None)

    salary_range = _format_salary_range(payload.salary, payload.extra_metadata.get("salary_string"))
    requirements_json = json.dumps(payload.requirements) if payload.requirements else None
    remote_type = _normalize_remote_type(
        payload.extra_metadata.get("work_arrangement") or payload.duration
    )
    start_date = _parse_date(payload.start_date)

    # Merge rich fields: top-level payload fields take priority, fall back to extra_metadata
    def _json_or_none(value: Any) -> str | None:
        if not value:
            return None
        return json.dumps(value) if not isinstance(value, str) else value

    benefits = payload.benefits or payload.extra_metadata.get("benefits") or []
    required_documents = payload.required_documents or payload.extra_metadata.get("required_documents") or []
    tags = payload.tags or payload.extra_metadata.get("tags") or []
    red_flags = payload.red_flags or payload.extra_metadata.get("red_flags") or []
    scam_score = payload.scam_score or payload.extra_metadata.get("scam_score") or 0.0
    duration = payload.duration or payload.extra_metadata.get("duration")
    qual_req = payload.qualification_requirements or payload.extra_metadata.get("qualification_requirements")
    exp_req = payload.experience_requirements or payload.extra_metadata.get("experience_requirements")
    skills_struct = payload.skills_structured or payload.extra_metadata.get("skills") or []
    knowledge_req = payload.knowledge_requirements or payload.extra_metadata.get("knowledge_requirements")
    conditions = payload.conditions_of_employment or payload.extra_metadata.get("conditions_of_employment") or []
    contact_website = payload.contact.career_page or payload.contact.website or payload.extra_metadata.get("contact_website")

    opportunity = Opportunity(
        title=payload.title,
        slug=payload.slug,
        description=payload.description,
        company_name=_resolve_company_name(payload),
        location=_format_location(payload.location),
        opportunity_type=payload.type,
        category=_infer_category(payload.type),
        required_skills=requirements_json,
        experience_level=payload.extra_metadata.get("experience_level"),
        industry=payload.extra_metadata.get("sector") or payload.extra_metadata.get("category"),
        salary_range=salary_range,
        source=payload.source_platform,
        source_id=payload.extra_metadata.get("dedup_key") or payload.canonical_link,
        source_url=payload.source_url,
        source_platform=payload.source_platform,
        remote_type=remote_type,
        salary_min=payload.salary.min,
        salary_max=payload.salary.max,
        salary_visible=bool(salary_range or payload.salary.min is not None or payload.salary.max is not None),
        quality_score=payload.ai_confidence_score or 0.5,
        trust_score=payload.trust_score,
        engagement_rate=0.0,
        ai_status=payload.status,
        ai_confidence_score=payload.ai_confidence_score,
        posted_at=published_at,
        expires_at=expires_at,
        application_deadline_date=deadline_date,
        contact_email=payload.contact.email,
        contact_phone=payload.contact.phone,
        application_url=payload.contact.application_url or payload.canonical_link,
        is_direct=payload.is_direct_company_link,
        employer_id=None,
        # Rich AI-extracted fields
        benefits=_json_or_none(benefits),
        required_documents=_json_or_none(required_documents),
        tags=_json_or_none(tags),
        red_flags=_json_or_none(red_flags),
        scam_score=float(scam_score),
        duration=duration,
        start_date=start_date,
        qualification_requirements=_json_or_none(qual_req),
        experience_requirements=_json_or_none(exp_req),
        skills_structured=_json_or_none(skills_struct),
        knowledge_requirements=_json_or_none(knowledge_req),
        conditions_of_employment=_json_or_none(conditions),
        contact_website=contact_website,
    )
    db.add(opportunity)
    await db.commit()
    await db.refresh(opportunity)

    return IngestOpportunityResult(id=opportunity.id, status="created")