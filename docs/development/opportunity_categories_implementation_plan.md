# Opportunity Categories & Types Implementation Plan

## Executive Summary

Expand the Proofile portal to support categorized opportunities with dedicated scraping sources for each category and type. This enables users to filter and discover opportunities across:

- **Jobs Category**: Employment, Contract, Freelance, Consulting, Board, Volunteer
- **Training & Skills Programs**: Internships, Learnerships, Apprenticeships

---

## Database Schema

### Opportunity Category Enum
```sql
CREATE TYPE opportunity_category AS ENUM (
  'jobs',
  'training_skills_programs'
);
```

### Opportunity Type Enum
```sql
CREATE TYPE opportunity_type AS ENUM (
  -- Jobs category
  'employment',
  'contract',
  'freelance',
  'consulting',
  'board',
  'volunteer',
  -- Training & Skills Programs category
  'internship',
  'learnership',
  'apprenticeship'
);
```

---

## Phase 1: Database & Model Updates

### 1.1 Migration: Add Columns to portal_jobs

```python
# alembic/versions/xxxx_add_opportunity_type_columns.py
def upgrade():
    op.add_column('portal_jobs', 
        sa.Column('opportunity_category', sa.String(50), nullable=True))
    op.add_column('portal_jobs', 
        sa.Column('opportunity_type', sa.String(50), nullable=True))
    
    # Indexes for filtering
    op.create_index('ix_portal_jobs_opp_category', 'portal_jobs', ['opportunity_category'])
    op.create_index('ix_portal_jobs_opp_type', 'portal_jobs', ['opportunity_type'])
    
    # Default existing jobs to 'employment'
    op.execute("""
        UPDATE portal_jobs 
        SET opportunity_category = 'jobs', opportunity_type = 'employment'
        WHERE opportunity_category IS NULL
    """)
```

### 1.2 Model Update: portal_job.py

```python
# Add after category column
opportunity_category = Column(String(50), nullable=True, index=True)
opportunity_type = Column(String(50), nullable=True, index=True)
```

---

## Phase 2: Schema Updates

### 2.1 PortalSearchParams

```python
class PortalSearchParams(BaseModel):
    # ... existing fields ...
    opportunity_category: Optional[str] = None  # 'jobs' | 'training_skills_programs'
    opportunity_types: Optional[List[str]] = None  # ['employment', 'internship', ...]
```

### 2.2 PortalJobCard

```python
class PortalJobCard(BaseModel):
    # ... existing fields ...
    opportunity_category: Optional[str] = None
    opportunity_type: Optional[str] = None
```

### 2.3 PortalFacets

```python
class PortalFacets(BaseModel):
    # ... existing fields ...
    opportunity_categories: List[FacetItem] = []
    opportunity_types: List[FacetItem] = []
```

---

## Phase 3: Service Layer Updates

### 3.1 portal_service.py - search_jobs()

```python
# Add filtering logic
if params.opportunity_category:
    query = query.filter(PortalJob.opportunity_category == params.opportunity_category)

if params.opportunity_types:
    query = query.filter(PortalJob.opportunity_type.in_(params.opportunity_types))
```

### 3.2 Facet Aggregation

```python
def _get_facets(self):
    # Add opportunity type facets
    opp_category_counts = self.db.query(
        PortalJob.opportunity_category, func.count(PortalJob.id)
    ).filter(PortalJob.is_active == True).group_by(PortalJob.opportunity_category).all()
```

---

## Phase 4: Scraping Sources by Category

### 4.1 Jobs Category Sources

| Opportunity Type | Primary Sources | Secondary Sources |
|------------------|-----------------|-------------------|
| **Employment** | PNet, Careers24, Indeed SA, LinkedIn, **CareerJunction**, **RecentJobs** | Glassdoor, OfferZen |
| **Contract** | PNet, Indeed SA, **CareerJunction** | Guru, Upwork (SA filter) |
| **Freelance** | Upwork, Freelancer | Fiverr, TopTal |
| **Consulting** | LinkedIn, PNet, **CareerJunction** | Bizcommunity |
| **Board** | NED on Board, IoDSA | LinkedIn, Bizcommunity |
| **Volunteer** | Volunteer SA, My School | NGO Pulse, GreaterGood |

### 4.2 Training & Skills Category Sources

| Opportunity Type | Primary Sources | Secondary Sources |
|------------------|-----------------|-------------------|
| **Internship** | Careers24, PNet, **StudentRoom**, **CareerJunction** | GradConnection, Indeed |
| **Learnership** | YES4Youth, SETA portals, **StudentRoom** | Careers24, Government listings |
| **Apprenticeship** | NAMB, MERSETA | National Skills Fund, CETA |

### 4.3 New Sources Added

| Source | URL | Focus |
|--------|-----|-------|
| **CareerJunction** | https://www.careerjunction.co.za/ | Jobs, Internships, Graduate Programs |
| **RecentJobs** | https://recentjobs.co.za/ | SA Employment listings |
| **StudentRoom** | https://www.studentroom.co.za/ | Internships, Learnerships, Graduate Opportunities |

---

## Phase 5: New Scrapers Implementation

### 5.1 File Structure

```
backend/app/scrapers/
├── base_scraper.py           # Abstract base class
├── jobs/
│   ├── pnet_scraper.py       # PNet (existing)
│   ├── careers24_scraper.py  # Careers24 (existing)
│   ├── indeed_scraper.py     # Indeed SA (existing)
│   ├── linkedin_scraper.py   # LinkedIn (new)
│   ├── upwork_scraper.py     # Freelance (new)
│   └── volunteer_sa_scraper.py  # Volunteer (new)
├── training/
│   ├── yes4youth_scraper.py  # Learnerships (new)
│   ├── seta_scraper.py       # All SETA learnerships (new)
│   ├── namb_scraper.py       # Apprenticeships (new)
│   └── gradconnection_scraper.py  # Internships (new)
└── utils/
    ├── rate_limiter.py
    └── proxy_manager.py
```

### 5.2 Base Scraper Interface

```python
class BaseScraper(ABC):
    opportunity_category: str
    opportunity_type: str
    source_name: str
    
    @abstractmethod
    async def scrape(self, params: dict) -> List[Dict]:
        """Scrape opportunities from source"""
        pass
    
    def normalize(self, raw_data: dict) -> dict:
        """Normalize to PortalJob schema"""
        return {
            **raw_data,
            'opportunity_category': self.opportunity_category,
            'opportunity_type': self.opportunity_type,
            'source': self.source_name,
        }
```

### 5.3 New Celery Tasks

```python
# tasks/opportunity_scrapers.py

@shared_task
def scrape_learnerships():
    """Scrape learnerships from YES4Youth and SETA portals"""
    pass

@shared_task
def scrape_internships():
    """Scrape internships from GradConnection and Careers24"""
    pass

@shared_task
def scrape_apprenticeships():
    """Scrape apprenticeships from NAMB and MERSETA"""
    pass

@shared_task
def scrape_freelance():
    """Scrape freelance gigs from Upwork SA"""
    pass

@shared_task
def scrape_volunteer():
    """Scrape volunteer positions from VolunteerSA"""
    pass
```

### 5.4 Celery Beat Schedule

```python
# celery_beat_schedule.py
CELERYBEAT_SCHEDULE = {
    'scrape-employment-jobs': {
        'task': 'app.tasks.portal_scraper.scrape_all_sources',
        'schedule': crontab(hour='*/6'),  # Every 6 hours
    },
    'scrape-learnerships': {
        'task': 'app.tasks.opportunity_scrapers.scrape_learnerships',
        'schedule': crontab(hour=8, minute=0),  # Daily at 8am
    },
    'scrape-internships': {
        'task': 'app.tasks.opportunity_scrapers.scrape_internships',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9am
    },
    'scrape-apprenticeships': {
        'task': 'app.tasks.opportunity_scrapers.scrape_apprenticeships',
        'schedule': crontab(hour=10, minute=0),  # Daily at 10am
    },
}
```

---

## Phase 6: South African SETA Coverage

### SETA Portals to Scrape

| SETA | Focus Area | URL |
|------|------------|-----|
| MICT SETA | IT, Media, ICT | mict.org.za |
| BANKSETA | Banking & Finance | bankseta.org.za |
| FASSET | Accounting & Finance | fasset.org.za |
| MERSETA | Manufacturing & Engineering | merseta.org.za |
| MQA | Mining | mqa.org.za |
| Services SETA | Services sector | serviceseta.org.za |
| W&R SETA | Wholesale & Retail | wrseta.org.za |
| CETA | Construction | ceta.org.za |
| FP&M SETA | Food & Printing | fpmseta.org.za |
| HWSETA | Health & Welfare | hwseta.org.za |

### YES4Youth Integration

```python
# scrapers/training/yes4youth_scraper.py
class YES4YouthScraper(BaseScraper):
    opportunity_category = 'training_skills_programs'
    opportunity_type = 'learnership'
    source_name = 'yes4youth'
    base_url = 'https://www.yes4youth.co.za/opportunities/'
```

---

## Phase 7: Frontend Integration

### 7.1 Already Completed
- ✅ OpportunityTypeFilter component created
- ✅ JobSearchSection accepts filter props
- ✅ Home page integrates filter

### 7.2 Remaining Work
- [ ] Update portalService.ts to include new params
- [ ] Add opportunity type badges to job cards
- [ ] Update filter facets sidebar
- [ ] Add opportunity type icons

---

## Implementation Timeline

| Phase | Description | Estimated Time |
|-------|-------------|----------------|
| 1 | Database migration | 1 day |
| 2 | Schema updates | 1 day |
| 3 | Service layer | 1 day |
| 4 | Research scrape sources | 2 days |
| 5 | Implement new scrapers | 5 days |
| 6 | SETA integration | 3 days |
| 7 | Frontend polish | 2 days |
| **Total** | | **~15 days** |

---

## Verification Plan

1. **Database**: Run migration, verify columns exist
2. **API**: Test `/api/v1/portal/search?opportunity_category=jobs&opportunity_types=employment,contract`
3. **Scrapers**: Run each scraper individually, verify data saved with correct category/type
4. **Frontend**: Filter clicks trigger API with correct params, listings update

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| SETA sites may block scrapers | Use rotating proxies, respect robots.txt |
| Varying data formats across sources | Robust normalization in each scraper |
| Rate limiting | Implement exponential backoff |
| Stale data | Daily refresh schedules + monitoring |

---

## Success Metrics

- 50+ learnerships scraped from SETA sources
- 100+ internships from career portals
- 20+ apprenticeships from NAMB
- Filter UI correctly filters by category/type
- <500ms API response time for filtered searches
