import httpx
import os
import json
import redis.asyncio as aioredis
import asyncio
import logging
import re
from datetime import datetime, timedelta
from models.llm.opportunity_parser import LLMExtractor
from utils.ai_enhancements import (
    EnhancedOpportunityProcessor,
    SalaryParser,
    ExperienceClassifier,
    ScamDetector,
    DeadlineParser,
    LocationParser,
    SkillsExtractor,
    QualityScorer,
    CompanyVerifier,
    ApplicationMethodAnalyzer,
    FuzzyDeduplicator
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Verification configuration
EXPIRY_GRACE_DAYS = int(os.getenv("EXPIRY_GRACE_DAYS", "5"))
STATUS_CONFIDENCE_THRESHOLD = float(os.getenv("STATUS_CONFIDENCE_THRESHOLD", "0.7"))

# Keywords indicating closed/expired status
EXPIRED_KEYWORDS = [
    "applications closed", "vacancy filled", "position filled", "no longer accepting",
    "expired", "closed", "this vacancy has closed", "deadline has passed",
    "applications have closed", "recruitment completed", "position has been filled"
]

# Keywords indicating ongoing/rolling recruitment
ONGOING_KEYWORDS = [
    "until filled", "ongoing", "continuous recruitment", "open until further notice",
    "rolling applications", "no deadline", "positions available immediately"
]

# Keywords indicating urgency (ASAP)
URGENT_KEYWORDS = ["asap", "immediate start", "urgently required", "urgent"]

# Pipeline operational constants
MAX_RETRIES = 3
CONCURRENT_TASKS = 5
MAX_TEXT_LENGTH = 8000  # Truncate raw text to stay within context limits
DUPLICATE_TTL = 604800 # 7 days in seconds

# Redis Keys
QUEUE_NAME = 'raw_opportunities'
DLQ_NAME = 'raw_opportunities:dlq'
SEEN_URLS_KEY = 'cache:seen_urls'
METRICS_PROCESSED = 'stats:opportunities:processed'
METRICS_FAILED = 'stats:opportunities:failed'
METRICS_RETRIED = 'stats:opportunities:retried'
METRICS_SAVED = 'stats:opportunities:saved'
METRICS_DUPLICATES = 'stats:opportunities:duplicates'

class RawDataConsumer:
    """
    Consumes raw data from Redis (pushed by Scrapy), triggers AI processing,
    and sends the final structured result to the Backend API.
    """
    def __init__(self, redis_url: str):
        self.redis = aioredis.from_url(redis_url)
        self.extractor = LLMExtractor(api_key=os.getenv("GROQ_API_KEY"))
        self.backend_url = os.getenv("BACKEND_API_URL", "http://backend:8000/api/v1")
        self.semaphore = asyncio.Semaphore(CONCURRENT_TASKS)

    def _map_to_backend_format(self, raw_item: dict, processed_data) -> dict:
        """
        Transform LLM extracted data + raw spider data into backend-expected format.
        """
        llm_data = processed_data.dict() if hasattr(processed_data, 'dict') else processed_data
        
        # Parse spider raw_data (JSON string) for enhanced metadata
        try:
            spider_raw = json.loads(raw_item.get('raw_data', '{}'))
        except (json.JSONDecodeError, TypeError):
            spider_raw = {}

        # Define description_text - use LLM cleaned version or fallback
        description_text = llm_data.get('cleaned_description') or raw_item.get('description_full', '')

        # Map opportunity type from spider data - preserve specific types
        spider_type = raw_item.get('type', 'job')
        type_mapping = {
            'internship': 'internship',
            'learnership': 'learnership',
            'apprenticeship': 'apprenticeship',
            'bursary': 'bursary', 
            'graduate_program': 'graduate_program',
            'training_program': 'training_program',
            'opportunity': 'job',
            'job': 'job',
        }
        opp_type = type_mapping.get(spider_type, 'job')
        
        # === ENHANCED LOCATION PARSING ===
        loc_str = llm_data.get('location') or raw_item.get('location', '')
        location_result = LocationParser.parse(loc_str)
        location = {
            'city': location_result.city,
            'province': location_result.province,
            'country': location_result.country,
            'latitude': location_result.latitude,
            'longitude': location_result.longitude,
        }
        work_arrangement = location_result.work_arrangement
        
        # === ENHANCED SALARY PARSING ===
        salary_text = raw_item.get('salary') or llm_data.get('salary_text', '') or description_text
        salary_result = SalaryParser.parse(salary_text, llm_data.get('experience_level'))
        salary = {}
        if salary_result.salary_min or salary_result.salary_max:
            salary = {
                'min': salary_result.salary_min,
                'max': salary_result.salary_max,
                'currency': llm_data.get('currency', 'ZAR')
            }
        is_stipend = salary_result.is_stipend
        salary_warnings = salary_result.warnings
        
        # === ENHANCED SCAM DETECTION ===
        company_name = raw_item.get('company') or llm_data.get('company', '')
        scam_analysis = ScamDetector.analyze(
            description_text, 
            llm_data.get('contact_email'),
            company_name
        )
        # Use enhanced scam score if higher than LLM's
        scam_score = max(llm_data.get('scam_score', 0.0), scam_analysis.scam_score)
        trust_score = max(0.3, 1.0 - scam_score)  # Minimum 0.3 trust
        
        # === ENHANCED EXPERIENCE CLASSIFICATION ===
        title = raw_item.get('title') or llm_data.get('title', '')
        experience_result = ExperienceClassifier.classify(description_text, title)
        experience_level = experience_result['level']
        experience_years = {
            'min': experience_result['years_min'],
            'max': experience_result['years_max']
        }
        
        # === ENHANCED SKILLS EXTRACTION ===
        skills_result = SkillsExtractor.extract(description_text)
        extracted_skills = [s['name'] for s in skills_result['skills']]
        soft_skills = skills_result['soft_skills']
        
        # === ENHANCED QUALITY SCORING ===
        quality_input = {
            'title': title,
            'company': company_name,
            'location': location,
            'description': description_text,
            'salary_min': salary.get('min') if salary else None,
            'deadline': llm_data.get('application_deadline'),
            'contact_email': llm_data.get('contact_email'),
            'requirements': llm_data.get('skills_required', []),
            'required_documents': llm_data.get('required_documents', []),
        }
        quality_result = QualityScorer.score(quality_input)
        
        # === ENHANCED COMPANY VERIFICATION ===
        company_info = CompanyVerifier.verify(company_name)
        
        # === ENHANCED APPLICATION METHOD ===
        app_method = ApplicationMethodAnalyzer.analyze(
            description_text,
            llm_data.get('contact_email'),
            llm_data.get('application_url')
        )
        
        # === ENHANCED DEDUPLICATION KEY ===
        dedup_key = f"{FuzzyDeduplicator.normalize_company(company_name)}_{title.lower()[:50]}"
        
        # Determine opportunity status (active/expired/pending)
        deadline_str = spider_raw.get('closing_date_parsed') or llm_data.get('application_deadline')
        status_result = self._determine_status(deadline_str, description_text, spider_raw)
        
        # If confidence is below threshold, mark as pending for review
        final_status = status_result["status"]
        if status_result["confidence"] < STATUS_CONFIDENCE_THRESHOLD and final_status == "active":
            final_status = "pending"
            status_result["reason"] += " (Low confidence - needs review)"
        
        # Quarantine if scam analysis recommends it
        if scam_analysis.recommendation == "quarantine":
            final_status = "quarantine"
            status_result["reason"] = f"High scam risk: {', '.join(scam_analysis.red_flags[:3])}"
        
        # Validate application URL - filter out source portal URLs
        application_url = llm_data.get('application_url') or spider_raw.get('application_url')
        source_url = raw_item.get('original_url', '')
        application_url = self._validate_application_url(application_url, source_url)
        
        # Get company website for fallback
        company_website = llm_data.get('contact_website')
        
        # Prioritize spider-extracted structured requirements over LLM (more accurate for structured pages)
        structured_req = spider_raw.get('structured_requirements', {})
        
        # If spider didn't extract, fall back to LLM extraction
        if not structured_req or not any(structured_req.values()):
            structured_req = {
                'qualifications': llm_data.get('qualification_requirements', {}),
                'experience': llm_data.get('experience_requirements', {}),
                'skills': llm_data.get('skills', []),
                'knowledge': llm_data.get('knowledge_requirements', {}),
                'conditions_of_employment': llm_data.get('conditions_of_employment', [])
            }
        
        return {
            'type': opp_type,
            'title': raw_item.get('title') or llm_data.get('title', 'Untitled Opportunity'),
            'description': description_text,
            'requirements': llm_data.get('skills_required', []),
            'location': location,
            'salary': salary,
            'source_platform': raw_item.get('source_platform', 'studentroom'),
            'trust_score': trust_score,
            
            'status': final_status,
            'status_confidence': status_result["confidence"],
            'status_reason': status_result["reason"],
            
            'contact': {
                'email': llm_data.get('contact_email') or (spider_raw.get('contacts', {}).get('emails', [])[0] if spider_raw.get('contacts', {}).get('emails') else None),
                'phone': llm_data.get('contact_phone') or (spider_raw.get('contacts', {}).get('phones', [])[0] if spider_raw.get('contacts', {}).get('phones') else None),
                'website': company_website,
                'application_url': application_url,
            },
            'canonical_link': raw_item.get('canonical_link') or application_url or company_website,
            'source_url': raw_item.get('source_url') or raw_item.get('original_url'),  # Where we discovered it
            'source_links': [raw_item.get('original_url')] if raw_item.get('original_url') else [],
            
            # Link quality tracking (scraping refactor Phase 1)
            'is_direct_company_link': raw_item.get('is_direct_company_link', False),
            'link_quality': raw_item.get('link_quality', 'unknown'),
            
            'ai_confidence_score': 0.8,
            'application_deadline': llm_data.get('application_deadline'),
            
            'extra_metadata': {
                'sector': company_info.industry or spider_raw.get('sector', 'general'),
                'category': spider_raw.get('category', 'general'),
                'dedup_fingerprint': spider_raw.get('dedup_fingerprint'),
                'dedup_key': dedup_key,
                'is_pdf_application': spider_raw.get('is_pdf_application', False),
                'salary_string': spider_raw.get('salary'),
                'spider_contacts': spider_raw.get('contacts'),
                'spider_eligibility': spider_raw.get('eligibility'),
                'reference_number': spider_raw.get('reference_number'),
                'positions_count': spider_raw.get('positions_count'),
                'published_date': spider_raw.get('published_date'),
                'education_level': spider_raw.get('education_level'),
                
                'is_stipend': is_stipend,
                'salary_warnings': salary_warnings,
                'experience_level': experience_level,
                'experience_years': experience_years,
                'scam_score': scam_score,
                'scam_risk_level': scam_analysis.risk_level,
                'scam_recommendation': scam_analysis.recommendation,
                'red_flags': list(set(llm_data.get('red_flags', []) + scam_analysis.red_flags)),
                'work_arrangement': work_arrangement or llm_data.get('work_arrangement'),
                'location_coordinates': {
                    'lat': location.get('latitude'),
                    'lng': location.get('longitude'),
                } if location.get('latitude') else None,
                'extracted_skills': extracted_skills,
                'skill_categories': skills_result['categories'],
                'soft_skills': soft_skills,
                'quality_score': quality_result.overall_score,
                'quality_badge': quality_result.badge,
                'quality_issues': quality_result.issues,
                'missing_fields': quality_result.missing_fields,
                'company_verified': company_info.is_verified,
                'company_industry': company_info.industry,
                'company_trust_score': company_info.trust_score,
                'company_warnings': company_info.warnings,
                'application_method': app_method.method_type,
                'application_warnings': app_method.warnings,
                'deadline_type': status_result["deadline_type"],
                'verification_reason': status_result["reason"],
                'duration': llm_data.get('duration'),
                'start_date': llm_data.get('start_date'),
                'benefits': llm_data.get('benefits', []),
                'qualification_requirements': llm_data.get('qualification_requirements'),
                'tags': llm_data.get('tags', []),
                'ai_scam_score': llm_data.get('scam_score', 0.0),
                'required_documents': self._dedup_documents(
                    spider_raw.get('required_documents', []) + llm_data.get('required_documents', [])
                ),
                
                # Structured requirements (Phase 1 enhancement)
                'structured_qualifications': structured_req.get('qualifications', {}),
                'structured_experience': structured_req.get('experience', {}),
                'structured_skills': structured_req.get('skills', []),
                'structured_knowledge': structured_req.get('knowledge', {}),
                'conditions_of_employment': structured_req.get('conditions_of_employment', []),
            }
        }



    def _dedup_documents(self, docs_list):
        """Normalize and deduplicate document lists."""
        unique_docs = {}
        for doc in docs_list:
            if not doc: continue
            normalized = self._normalize_document_name(doc)
            if normalized in unique_docs:
                continue
            unique_docs[normalized] = normalized 
        return list(unique_docs.values())

    @staticmethod
    def _normalize_document_name(doc_name: str) -> str:
        """Normalize document names to canonical codes used by frontend."""
        if not doc_name: return ""
        d = doc_name.lower().strip()
        d_normalized = d.replace('_', ' ').replace('-', ' ')
        
        if any(x in d_normalized for x in ['cv', 'resume', 'curriculum vitae']):
            return 'cv'
        if any(x in d_normalized for x in ['matric', 'grade 12', 'senior certificate', 'nsc', 'grade 12 results', 'school report', 'school leaving']):
            return 'matric'
        if any(x in d_normalized for x in ['id copy', 'id document', 'identity document', 'identity copy', 'certified id', 'certified copy of id', 'south african id', 'id book', 'copy of id', 'identity card', 'smart card id']) or d_normalized in ['id', 'id document', 'id copy']:
            return 'id'
        if any(x in d_normalized for x in ['academic record', 'academic transcript', 'transcript', 'statement of result', 'completion letter', 'letter from academic', 'university transcript', 'college transcript']):
            return 'academic_record'
        if any(x in d_normalized for x in ['proof of residence', 'proof residence', 'residential address', 'address proof', 'utility bill', 'proof of address']):
            return 'proof_residence'
        if any(x in d_normalized for x in ['driver', 'driving licen', 'pdp']):
            return 'drivers_license'
        if any(x in d_normalized for x in ['qualification certificate', 'qualification', 'qualifications', 'certified copies of qualification', 'certified qualifications', 'certificate', 'diploma', 'degree', 'higher certificate']) and 'matric' not in d_normalized and 'grade 12' not in d_normalized:
            return 'qualification'
        if any(x in d_normalized for x in ['police clearance', 'criminal record', 'clearance certificate']):
            return 'police_clearance'
        
        return doc_name 

    def _validate_application_url(self, application_url: str, source_url: str) -> str:
        """Validate application URL is not the source portal URL."""
        if not application_url:
            return None
        
        forbidden_domains = [
            'studentroom.co.za', 'recentjobs.co.za', 'puffandpass.co.za',
            'careers24.com', 'pnet.co.za', 'indeed.co.za',
            'linkedin.com/jobs', 'facebook.com/groups'
        ]
        
        app_url_lower = application_url.lower()
        if source_url and application_url.strip().lower() == source_url.strip().lower():
            return None
        
        for domain in forbidden_domains:
            if domain in app_url_lower:
                return None
        
        return application_url

    def _determine_status(self, deadline_str: str, description: str, spider_raw: dict) -> dict:
        """Determine opportunity status based on deadline, keywords, and spider signals."""
        result = {
            "status": "active",
            "confidence": 1.0,
            "reason": "Default: no expiry signals detected",
            "deadline_type": "unknown",
        }
        
        description_lower = (description or "").lower()
        
        spider_expiry_signals = spider_raw.get("expiry_signals", [])
        if spider_expiry_signals:
            for signal in spider_expiry_signals:
                if signal in ["closed_badge", "expired_marker", "filled"]:
                    result["status"] = "expired"
                    result["confidence"] = 0.95
                    result["reason"] = f"Spider detected: {signal}"
                    return result
        
        for keyword in EXPIRED_KEYWORDS:
            if keyword in description_lower:
                result["status"] = "expired"
                result["confidence"] = 0.9
                result["reason"] = f"Keyword detected: '{keyword}'"
                return result
        
        for keyword in ONGOING_KEYWORDS:
            if keyword in description_lower:
                result["deadline_type"] = "ongoing"
                result["reason"] = f"Ongoing recruitment detected: '{keyword}'"
                return result
        
        for keyword in URGENT_KEYWORDS:
            if keyword in description_lower:
                result["deadline_type"] = "asap"
                result["reason"] = f"Urgent hiring: '{keyword}' - will expire in 30 days"
                return result
        
        if deadline_str:
            try:
                deadline = None
                for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"]:
                    try:
                        deadline = datetime.strptime(deadline_str, fmt)
                        break
                    except ValueError:
                        continue
                
                if deadline:
                    result["deadline_type"] = "fixed"
                    today = datetime.now()
                    grace_deadline = deadline + timedelta(days=EXPIRY_GRACE_DAYS)
                    
                    if today > grace_deadline:
                        result["status"] = "expired"
                        result["confidence"] = 1.0
                        result["reason"] = f"Deadline {deadline_str} passed"
                    elif today > deadline:
                        result["confidence"] = 0.7
                        result["reason"] = f"In grace period (deadline was {deadline_str})"
                    else:
                        result["confidence"] = 1.0
                        result["reason"] = f"Active until {deadline_str}"
            except Exception:
                result["confidence"] = 0.8
                result["reason"] = f"Could not validate deadline: {deadline_str}"
        else:
            result["confidence"] = 0.85
            result["reason"] = "No deadline found, assuming active"
        
        return result 

    async def process_item(self, raw_item: dict):
        """
        Core processing logic for a single item with semaphore protection.
        """
        print(f"DEBUG: Starting process_item for {raw_item.get('title')}")
        source_url = raw_item.get('original_url')
        request_id = f"{raw_item.get('spider', 'unknown')}:{hash(source_url)}"
        
        async with self.semaphore:
            try:
                # 1. Pre-LLM Deduplication
                if source_url:
                    if await self.redis.sismember(SEEN_URLS_KEY, source_url):
                        logger.info(f"[{request_id}] Skipping duplicate URL: {source_url}")
                        await self.redis.incr(METRICS_DUPLICATES)
                        return
                    # Mark as seen immediately to prevent race conditions (MVP level)
                    await self.redis.sadd(SEEN_URLS_KEY, source_url)
                    await self.redis.expire(SEEN_URLS_KEY, DUPLICATE_TTL)

                logger.info(f"[{request_id}] AI Extracting: {raw_item.get('title')}")
                
                # 2. Text Truncation & AI Extraction
                text_content = raw_item.get('description_full', '')
                if len(text_content) > MAX_TEXT_LENGTH:
                    logger.info(f"[{request_id}] Truncating text from {len(text_content)} to {MAX_TEXT_LENGTH}")
                    text_content = text_content[:MAX_TEXT_LENGTH]
                
                llm_response = await self.extractor.extract(text_content)
                llm_data = llm_response.model_dump()
                await self.redis.incr(METRICS_PROCESSED)

                # 3. Map to backend format
                final_payload = self._map_to_backend_format(raw_item, llm_data)
                
                # 4. POST to Backend API
                async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                    resp = await client.post(
                        f"{self.backend_url}/ingest/opportunity",
                        json=final_payload,
                        headers={"X-Internal-Secret": os.getenv("INTERNAL_API_SECRET", "dev-secret-change-in-production")}
                    )
                    if resp.status_code == 201:
                        logger.info(f"[{request_id}] Successfully saved to backend.")
                        await self.redis.incr(METRICS_SAVED)
                    else:
                        logger.error(f"[{request_id}] Backend error ({resp.status_code}): {resp.text}")
                        raise Exception(f"Backend returned {resp.status_code}")

            except Exception as e:
                logger.error(f"[{request_id}] Error processing item: {e}")
                await self._handle_retry(raw_item)

    async def _handle_retry(self, raw_item: dict):
        """Implement retry logic and DLQ."""
        retry_count = raw_item.get('_retry_count', 0)
        source_url = raw_item.get('original_url', 'unknown')
        
        if retry_count < MAX_RETRIES:
            raw_item['_retry_count'] = retry_count + 1
            logger.warning(f"Retrying item ({raw_item['_retry_count']}/{MAX_RETRIES}): {source_url}")
            await self.redis.lpush(QUEUE_NAME, json.dumps(raw_item))
            await self.redis.incr(METRICS_RETRIED)
        else:
            logger.error(f"Item failed after {MAX_RETRIES} retries. Moving to DLQ: {source_url}")
            await self.redis.lpush(DLQ_NAME, json.dumps(raw_item))
            await self.redis.incr(METRICS_FAILED)

    async def start_consuming(self):
        logger.info(f"Starting production raw data consumer (concurrency={CONCURRENT_TASKS})...")
        while True:
            try:
                # Pop from list (blocking async)
                result = await self.redis.brpop(QUEUE_NAME, timeout=5)
                if not result:
                    continue
                    
                _, data = result
                raw_item = json.loads(data)
                
                # Spawn concurrent task
                asyncio.create_task(self.process_item(raw_item))

            except Exception as e:
                logger.error(f"Error in consumer main loop: {e}", exc_info=True)
                await asyncio.sleep(1)

if __name__ == "__main__":
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/1")
    consumer = RawDataConsumer(redis_url)
    asyncio.run(consumer.start_consuming())
