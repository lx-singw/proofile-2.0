# Complete Personalization Dimensions Framework

The Proofile platform uses **11 personalization dimensions** to create deeply tailored user experiences across all features.

> **Related Document:** [Jobs to Opportunities Transformation Plan](./jobs_to_opportunities_transformation.md)

---

## Dimension Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PERSONALIZATION ENGINE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ OPPORTUNITY │  │    USER     │  │       INDUSTRY          │  │
│  │  CATEGORY   │  │   PERSONA   │  │        SECTOR           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ EXPERIENCE  │  │  LOCATION   │  │     CAREER INTENT       │  │
│  │   LEVEL     │  │  PROVINCE   │  │       & STAGE           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ VERIFICATION│  │   SKILLS    │  │     SALARY              │  │
│  │   LEVEL     │  │  PROFILE    │  │   EXPECTATIONS          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐  │
│  │  WORK MODE  │  │         ENGAGEMENT BEHAVIOR              │  │
│  │ PREFERENCE  │  │                                          │  │
│  └─────────────┘  └──────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dimension 1: Opportunity Category

Primary division of opportunities on the platform.

| Category | Types | Description |
|----------|-------|-------------|
| **Jobs** | Employment, Contract, Freelance, Consulting, Board, Volunteer | Actual work positions |
| **Training & Skills Programs** | Internship, Learnership, Apprenticeship | Structured development programs |

#### Database Schema
```sql
CREATE TYPE opportunity_category AS ENUM (
  'jobs',
  'training_skills_programs'
);

ALTER TABLE users ADD COLUMN opportunity_preference opportunity_category;
-- Values: 'jobs', 'training_skills_programs', 'both'
```

---

## Dimension 2: User Persona/Role

| Persona | Primary Focus | Tailored Features |
|---------|---------------|-------------------|
| **Job Seeker** | Finding opportunities | Job recommendations, application tracking, interview prep |
| **Recruiter** | Finding talent | Talent search, candidate pipeline, hiring analytics |
| **Employer** | Building team & brand | Company profile, job posting tools, team verification |
| **Mentor** | Guiding others | Mentee matching, coaching dashboard, guidance resources |
| **Student** | Launching career | Campus connections, graduate programs, study resources |

#### Database Schema
```sql
CREATE TYPE user_persona AS ENUM (
  'job_seeker',
  'recruiter', 
  'employer',
  'mentor',
  'student'
);

ALTER TABLE users ADD COLUMN persona user_persona;
```

#### Persona-Specific Navigation
```
Job Seeker:    [Feed] [Opportunities] [Applications] [Profile]
Recruiter:     [Talent Search] [Pipeline] [Analytics] [Company]
Employer:      [Dashboard] [Jobs Posted] [Team] [Company Brand]
Mentor:        [Mentees] [Sessions] [Resources] [Impact]
Student:       [Programs] [Campus] [Skills] [Mentors]
```

---

## Dimension 3: Industry/Sector

| Industry | SA-Specific Focus | Personalized Content |
|----------|-------------------|---------------------|
| **Technology** | Cape Town tech hub, JHB fintech | Coding challenges, GitHub integration, tech salaries |
| **Finance & Banking** | Big 4 banks, insurance | Compliance certs, FAIS requirements, banking learnerships |
| **Healthcare** | Public/private hospitals | Medical certifications, HPCSA registration, nursing programs |
| **Mining & Energy** | Gold, platinum, renewables | Safety certifications, field training, Eskom programs |
| **Retail & FMCG** | Shoprite, Pick n Pay, Woolworths | Store management paths, customer service, supply chain |
| **Manufacturing** | Automotive, food processing | Artisan training, quality control, factory management |
| **Agriculture** | Farming, agri-tech | Agricultural science, farm management, rural opportunities |
| **Government & NGO** | Public service, non-profits | DPSA requirements, public policy, community development |
| **Telecommunications** | Vodacom, MTN, Telkom | Network engineering, sales, customer experience |
| **Construction** | Infrastructure, property | CIDB registration, project management, safety |

#### Database Schema
```sql
CREATE TYPE industry_sector AS ENUM (
  'technology',
  'finance_banking',
  'healthcare',
  'mining_energy',
  'retail_fmcg',
  'manufacturing',
  'agriculture',
  'government_ngo',
  'telecommunications',
  'construction'
);

ALTER TABLE users ADD COLUMN primary_industry industry_sector;
ALTER TABLE users ADD COLUMN secondary_industries industry_sector[];
```

#### Industry-Specific Features
- **Tech**: Code assessment tools, GitHub profile import, tech salary benchmarks
- **Finance**: FAIS certification tracking, compliance training recommendations
- **Healthcare**: CPD point tracking, registration status verification
- **Mining**: Safety certificate expiry alerts, site-specific opportunities

---

## Dimension 4: Experience Level

| Level | Years | Profile Focus | Opportunity Types |
|-------|-------|---------------|-------------------|
| **Entry/Student** | 0 | Education, projects, potential | Internships, learnerships, entry roles |
| **Junior** | 0-2 | First roles, learning velocity | Graduate programs, junior positions |
| **Mid-Level** | 3-5 | Specialization, achievements | Specialist roles, team lead positions |
| **Senior** | 5-10 | Leadership, impact, expertise | Senior/principal roles, management |
| **Executive** | 10+ | Strategy, vision, influence | C-suite, board positions, consulting |

#### Database Schema
```sql
CREATE TYPE experience_level AS ENUM (
  'entry_student',
  'junior',
  'mid_level',
  'senior',
  'executive'
);

ALTER TABLE users ADD COLUMN experience_level experience_level;
ALTER TABLE users ADD COLUMN years_experience INTEGER;
```

#### Level-Specific UI Adaptations
```
Entry/Student:
├── "First Job Tips" widget
├── CV template library
├── Interview basics guide
├── Mentor matching emphasis

Senior/Executive:
├── Executive job alerts
├── Board opportunity section
├── Consulting gigs
├── Thought leadership tools
```

---

## Dimension 5: Location/Province (SA-Specific)

| Province | Economic Focus | Localized Features |
|----------|---------------|-------------------|
| **Gauteng** | Corporate HQs, finance, mining | Sandton roles, JHB commute radius, Pretoria govt jobs |
| **Western Cape** | Tech startups, tourism, wine | Cape Town tech scene, remote-friendly, creative roles |
| **KwaZulu-Natal** | Manufacturing, ports, tourism | Durban logistics, tourism hospitality, sugar industry |
| **Eastern Cape** | Automotive, agriculture | Port Elizabeth manufacturing, rural development |
| **Limpopo** | Mining, agriculture | Mining operations, agricultural programs |
| **Mpumalanga** | Mining, tourism, forestry | Kruger tourism, coal mining, plantation work |
| **Free State** | Mining, agriculture | Goldfields, farming, education |
| **North West** | Mining, agriculture | Platinum belt, agricultural co-ops |
| **Northern Cape** | Mining, astronomy | Solar farms, SKA opportunities, sparse population |

#### Database Schema
```sql
CREATE TYPE sa_province AS ENUM (
  'gauteng',
  'western_cape',
  'kwazulu_natal',
  'eastern_cape',
  'limpopo',
  'mpumalanga',
  'free_state',
  'north_west',
  'northern_cape'
);

ALTER TABLE users ADD COLUMN province sa_province;
ALTER TABLE users ADD COLUMN city VARCHAR(100);
ALTER TABLE users ADD COLUMN willing_to_relocate BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN relocation_provinces sa_province[];
```

#### Location-Based Features
- **Distance filtering**: "Within 30km of my location"
- **Commute time estimates**: Integrate with traffic data
- **Regional salary data**: Province-specific benchmarks
- **Local learnerships**: SETA programs in user's area

---

## Dimension 6: Career Stage/Intent

| Intent | Description | Engagement Style |
|--------|-------------|------------------|
| **Actively Looking** | Urgently seeking new role | Daily alerts, quick-apply, interview prep |
| **Passively Open** | Happy but open to offers | Weekly digest, selective matches only |
| **Career Changer** | Switching industries/roles | Skills gap analysis, retraining programs |
| **Upskilling** | Building new skills | Courses, certifications, side projects |
| **Returning to Work** | After career break | Returnship programs, confidence building |
| **Exploring Options** | Not sure what's next | Career assessment, AI coaching |

#### Database Schema
```sql
CREATE TYPE career_intent AS ENUM (
  'actively_looking',
  'passively_open',
  'career_changer',
  'upskilling',
  'returning_to_work',
  'exploring_options'
);

ALTER TABLE users ADD COLUMN career_intent career_intent;
ALTER TABLE users ADD COLUMN available_from DATE;
ALTER TABLE users ADD COLUMN notice_period_weeks INTEGER;
```

#### Intent-Based Communication
```
Actively Looking:
→ Push notifications for new matches
→ "Apply now" CTAs
→ Application deadline alerts

Passively Open:
→ Weekly email digest only
→ "Save for later" emphasis
→ Salary benchmark nudges
```

---

## Dimension 7: Verification Level/Trust Score

| Level | Requirements | Benefits Unlocked |
|-------|--------------|-------------------|
| **Unverified** | Email only | Basic search, limited applications |
| **Basic** | Phone verified | Apply to jobs, basic profile |
| **Standard** | ID + 1 verification | Featured in search, more applications |
| **Verified** | Work history + skills | Priority placement, trusted badge |
| **Premium** | Full verification suite | Top visibility, headhunter access |

#### Trust Score Components
```
Trust Score (0-100)
├── Identity Verification (20 pts)
│   ├── Email verified: 5 pts
│   ├── Phone verified: 5 pts
│   └── ID verified: 10 pts
│
├── Work History (25 pts)
│   ├── Per verified employer: 5 pts (max 25)
│
├── Skills (20 pts)
│   ├── Per skill assessment: 4 pts (max 20)
│
├── Education (15 pts)
│   ├── Per verified qualification: 5 pts (max 15)
│
├── Peer Ratings (15 pts)
│   ├── Average rating score normalized
│
└── Profile Completeness (5 pts)
    └── All sections filled
```

#### Verification-Based Access
```
Feature                    | Basic | Standard | Verified | Premium
---------------------------|-------|----------|----------|--------
Apply to jobs              |   ✓   |    ✓     |    ✓     |   ✓
Appear in search           |   ✗   |    ✓     |    ✓     |   ✓
Priority placement         |   ✗   |    ✗     |    ✓     |   ✓
Trusted badge              |   ✗   |    ✗     |    ✓     |   ✓
Headhunter visibility      |   ✗   |    ✗     |    ✗     |   ✓
Salary insights access     |   ✗   |    ✓     |    ✓     |   ✓
```

---

## Dimension 8: Skills Profile

| Skill Category | Examples | Personalization Use |
|----------------|----------|---------------------|
| **Technical/Hard Skills** | Python, SAP, Nursing, Welding | Match to job requirements |
| **Soft Skills** | Leadership, Communication, Teamwork | Culture fit assessment |
| **Tools & Platforms** | Salesforce, AWS, Excel, AutoCAD | Tool-specific roles |
| **Certifications** | PMP, CFA, AWS Solutions Architect | Certification-required jobs |
| **Languages** | English, Afrikaans, Zulu, Xhosa | Multilingual role matching |
| **Emerging Skills** | AI/ML, Blockchain, Data Science | Future-proof opportunities |

#### Database Schema
```sql
CREATE TABLE user_skills (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  skill_name VARCHAR(100),
  skill_category VARCHAR(50),
  proficiency_level INTEGER CHECK (proficiency_level BETWEEN 1 AND 5),
  years_experience DECIMAL(3,1),
  is_verified BOOLEAN DEFAULT false,
  last_used DATE,
  endorsement_count INTEGER DEFAULT 0
);

CREATE INDEX idx_user_skills_category ON user_skills(user_id, skill_category);
CREATE INDEX idx_skills_verified ON user_skills(skill_name, is_verified);
```

#### Skills-Based Features
- **Skill gap analysis**: "You need X to qualify for Y roles"
- **Learning paths**: "Complete these to unlock senior roles"
- **Skill trending**: "Python demand up 23% this month"
- **Endorsement requests**: "Ask colleagues to verify your skills"

---

## Dimension 9: Salary Expectations

| Range (Annual ZAR) | Label | Opportunity Types |
|--------------------|-------|-------------------|
| R0 - R150k | Entry | Internships, learnerships, entry jobs |
| R150k - R350k | Junior | Junior roles, graduate programs |
| R350k - R600k | Mid | Mid-level positions, specialists |
| R600k - R1M | Senior | Senior roles, management |
| R1M - R2M | Executive | Directors, executives |
| R2M+ | C-Suite | C-level, board positions |

#### Database Schema
```sql
ALTER TABLE users ADD COLUMN salary_expectation_min INTEGER;
ALTER TABLE users ADD COLUMN salary_expectation_max INTEGER;
ALTER TABLE users ADD COLUMN salary_negotiable BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN open_to_equity BOOLEAN DEFAULT false;
```

#### Salary-Based Features
- **Salary match indicator**: "This role pays 15% above your expectation"
- **Market benchmarking**: "Professionals like you earn R650k avg"
- **Negotiation tips**: "Based on your profile, you could ask for..."
- **Equity explainer**: "This startup offers equity compensation"

---

## Dimension 10: Work Mode Preference

| Mode | Description | Filter Criteria |
|------|-------------|-----------------|
| **Remote Only** | 100% work from home | No office requirement |
| **Hybrid** | Mix of remote and office | 1-3 days in office |
| **Office-Based** | Traditional on-site | Daily commute expected |
| **Field Work** | Travel/site-based | Construction, sales, mining |
| **Flexible** | Open to any arrangement | All modes considered |

#### Database Schema
```sql
CREATE TYPE work_mode AS ENUM (
  'remote_only',
  'hybrid',
  'office_based',
  'field_work',
  'flexible'
);

ALTER TABLE users ADD COLUMN work_mode_preference work_mode;
ALTER TABLE users ADD COLUMN max_commute_minutes INTEGER;
ALTER TABLE users ADD COLUMN has_transport BOOLEAN;
ALTER TABLE users ADD COLUMN has_home_office BOOLEAN;
```

#### Work Mode Features
- **Remote jobs section**: Dedicated remote opportunities
- **Commute calculator**: "This role is 45 mins from you"
- **Home office tips**: For remote-preference users
- **Travel requirements**: Field work opportunity clarity

---

## Dimension 11: Engagement Behavior (Inferred)

| Behavior Pattern | Detection | Adaptive Response |
|------------------|-----------|-------------------|
| **Daily Active** | Login daily, high activity | Real-time notifications, live updates |
| **Weekly Visitor** | 1-2 logins per week | Weekly digest email, summary view |
| **Returning User** | Back after 2+ weeks | "What you missed" recap, re-engagement |
| **First-Time User** | New account | Guided tour, onboarding tips, help prompts |
| **Power User** | Uses advanced features | Pro tips, beta features, shortcuts |
| **Mobile-First** | Primarily app usage | Mobile-optimized CTAs, swipe actions |

#### Tracking Schema
```sql
CREATE TABLE user_engagement (
  user_id UUID REFERENCES users(id),
  login_count_7d INTEGER,
  login_count_30d INTEGER,
  last_login TIMESTAMP,
  avg_session_minutes DECIMAL(5,2),
  preferred_device VARCHAR(20),
  features_used JSONB,
  engagement_score INTEGER
);
```

#### Behavior-Based Adaptations
```
Daily Active User:
├── Show live activity feed
├── Push instant notifications
└── "Just posted" badge on new items

Returning After Break:
├── "Welcome back!" greeting
├── "12 new opportunities since your last visit"
└── Simplified UI, re-onboarding hints
```

---

## Personalization Priority Matrix

| Dimension | Impact | Effort | Priority | Phase |
|-----------|--------|--------|----------|-------|
| Opportunity Category | ⬛⬛⬛⬛⬛ | ⬛⬛⬛ | P0 | 1 |
| Experience Level | ⬛⬛⬛⬛ | ⬛⬛ | P1 | 1 |
| Industry/Sector | ⬛⬛⬛⬛ | ⬛⬛ | P1 | 1 |
| User Persona | ⬛⬛⬛⬛ | ⬛⬛⬛ | P1 | 2 |
| Location/Province | ⬛⬛⬛ | ⬛⬛ | P2 | 2 |
| Career Intent | ⬛⬛⬛ | ⬛⬛ | P2 | 2 |
| Skills Profile | ⬛⬛⬛⬛ | ⬛⬛⬛⬛ | P2 | 3 |
| Salary Expectations | ⬛⬛⬛ | ⬛ | P2 | 2 |
| Work Mode | ⬛⬛ | ⬛ | P3 | 3 |
| Verification Level | ⬛⬛⬛⬛ | ⬛⬛⬛ | P1 | 2 |
| Engagement Behavior | ⬛⬛ | ⬛⬛⬛ | P3 | 3 |

---

## Complete User Preferences Schema

```typescript
interface UserPersonalization {
  // Dimension 1: Opportunity Category
  opportunity_preference: 'jobs' | 'training_skills_programs' | 'both';
  
  // Dimension 2: User Persona
  persona: 'job_seeker' | 'recruiter' | 'employer' | 'mentor' | 'student';
  
  // Dimension 3: Industry/Sector
  primary_industry: IndustrySector;
  secondary_industries: IndustrySector[];
  
  // Dimension 4: Experience Level
  experience_level: 'entry_student' | 'junior' | 'mid_level' | 'senior' | 'executive';
  years_experience: number;
  
  // Dimension 5: Location
  province: SAProvince;
  city: string;
  willing_to_relocate: boolean;
  relocation_provinces: SAProvince[];
  
  // Dimension 6: Career Intent
  career_intent: 'actively_looking' | 'passively_open' | 'career_changer' | 
                  'upskilling' | 'returning_to_work' | 'exploring_options';
  available_from: Date;
  notice_period_weeks: number;
  
  // Dimension 7: Verification
  trust_score: number; // 0-100
  verification_level: 'unverified' | 'basic' | 'standard' | 'verified' | 'premium';
  
  // Dimension 8: Skills
  skills: UserSkill[];
  skill_gaps: string[];
  
  // Dimension 9: Salary
  salary_expectation_min: number;
  salary_expectation_max: number;
  salary_negotiable: boolean;
  open_to_equity: boolean;
  
  // Dimension 10: Work Mode
  work_mode_preference: 'remote_only' | 'hybrid' | 'office_based' | 'field_work' | 'flexible';
  max_commute_minutes: number;
  
  // Dimension 11: Engagement (auto-tracked)
  engagement_pattern: 'daily_active' | 'weekly_visitor' | 'returning' | 'new_user' | 'power_user';
}
```

---

## Implementation Roadmap

### Phase 1: Core Personalization
- [ ] Opportunity Category (Jobs vs Training)
- [ ] Experience Level
- [ ] Industry/Sector
- [ ] User Persona (enhance existing)

### Phase 2: Context Personalization
- [ ] Location/Province
- [ ] Career Intent
- [ ] Salary Expectations
- [ ] Verification Level integration

### Phase 3: Advanced Personalization
- [ ] Skills Profile deep integration
- [ ] Work Mode filtering
- [ ] Engagement behavior tracking
- [ ] AI-driven personalization engine

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              PROOFILE PLATFORM                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                        FRONTEND (Next.js)                                │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│    │
│  │  │  Feed Page  │ │ Dashboard   │ │ Opportunities│ │  Profile/Settings  ││    │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘│    │
│  │         │               │               │                   │           │    │
│  │         └───────────────┴───────────────┴───────────────────┘           │    │
│  │                                   │                                      │    │
│  │                    ┌──────────────▼──────────────┐                      │    │
│  │                    │  PERSONALIZATION CONTEXT    │                      │    │
│  │                    │  (React Context Provider)   │                      │    │
│  │                    └──────────────┬──────────────┘                      │    │
│  └───────────────────────────────────┼──────────────────────────────────────┘    │
│                                      │                                           │
│  ┌───────────────────────────────────▼──────────────────────────────────────┐    │
│  │                         API GATEWAY (FastAPI)                            │    │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐│    │
│  │  │ Auth API    │ │ Users API   │ │ Opport. API │ │ Personalization API ││    │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────────────┘│    │
│  └───────────────────────────────────┬──────────────────────────────────────┘    │
│                                      │                                           │
│  ┌───────────────────────────────────▼──────────────────────────────────────┐    │
│  │                     PERSONALIZATION ENGINE                               │    │
│  │                                                                          │    │
│  │  ┌──────────────────────────────────────────────────────────────────┐   │    │
│  │  │                    DIMENSION RESOLVER                             │   │    │
│  │  │  Resolves user's 11 dimensions from profile + behavior data      │   │    │
│  │  └───────────────────────────┬──────────────────────────────────────┘   │    │
│  │                              │                                          │    │
│  │  ┌─────────────┬─────────────┼─────────────┬─────────────────────────┐  │    │
│  │  │             │             │             │                         │  │    │
│  │  ▼             ▼             ▼             ▼                         ▼  │    │
│  │ ┌───────┐ ┌─────────┐ ┌──────────┐ ┌────────────┐ ┌────────────────┐   │    │
│  │ │ Feed  │ │   AI    │ │ Coaching │ │ Verification│ │   Ratings     │   │    │
│  │ │ Algo  │ │ Matching│ │  Engine  │ │   Engine   │ │   Engine      │   │    │
│  │ └───────┘ └─────────┘ └──────────┘ └────────────┘ └────────────────┘   │    │
│  │                                                                          │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                      │                                           │
│  ┌───────────────────────────────────▼──────────────────────────────────────┐    │
│  │                          DATA LAYER                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │    │
│  │  │  PostgreSQL  │  │    Redis     │  │  Celery/     │  │  ML Models   │  │    │
│  │  │  (Primary)   │  │   (Cache)    │  │  Tasks       │  │  (AI/ML)     │  │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘  │    │
│  └──────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

### Personalization Engine Integration

#### How Each Platform Feature Uses Personalization

```
┌────────────────────────────────────────────────────────────────────────────┐
│                 PERSONALIZATION DATA FLOW                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  USER PROFILE ────────┐                                                    │
│                       │                                                    │
│  - Opportunity Pref   │     ┌────────────────────────────────────────┐    │
│  - Persona            │     │                                        │    │
│  - Industry           │     │     PERSONALIZATION ENGINE             │    │
│  - Experience         ├────►│                                        │    │
│  - Location           │     │     Combines all 11 dimensions into    │    │
│  - Career Intent      │     │     a unified PersonalizationContext   │    │
│  - Skills             │     │                                        │    │
│  - Salary             │     └────────────────┬───────────────────────┘    │
│  - Work Mode          │                      │                            │
│                       │                      │                            │
│  BEHAVIOR TRACKING ───┘                      ▼                            │
│                              ┌───────────────────────────────┐            │
│                              │    PersonalizationContext     │            │
│                              └───────────────┬───────────────┘            │
│                                              │                            │
│          ┌──────────────┬──────────────┬─────┴─────┬──────────────┐      │
│          ▼              ▼              ▼           ▼              ▼      │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐ ┌──────────┐  ┌──────────┐  │
│    │   FEED   │  │    AI    │  │ COACHING │ │VERIFICATION│  │ RATINGS  │  │
│    └──────────┘  └──────────┘  └──────────┘ └──────────┘  └──────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

### Feature Integration Matrix

| Feature | Dimensions Used | Integration Type | Existing/New |
|---------|-----------------|------------------|--------------|
| **User Feed** | Opportunity, Persona, Industry, Experience, Location, Intent | Blend | ENHANCE existing `/feed` |
| **AI Matching** | Skills, Experience, Industry, Salary, Work Mode | Blend | ENHANCE existing AI matcher |
| **AI Coaching** | Opportunity, Experience, Career Intent, Skills | Blend | ENHANCE existing AI chat |
| **Verification** | Persona, Experience, Verification Level | Append | ENHANCE existing verification flow |
| **Ratings** | Persona, Experience, Skills | Append | ENHANCE existing ratings |
| **Onboarding** | ALL 11 dimensions | Replace | NEW onboarding wizard |
| **Dashboard** | Persona, Opportunity, Intent, Engagement | Blend | ENHANCE existing dashboard |
| **Notifications** | Intent, Engagement | Append | ENHANCE existing notifications |

#### Integration Types Explained

| Type | Description |
|------|-------------|
| **Blend** | Dimensions are combined with existing logic to modify output |
| **Append** | New personalization layer added on top of existing feature |
| **Replace** | Existing feature replaced with personalized version |
| **New** | Completely new feature enabled by personalization |

---

### Backend Service Architecture

```python
# personalization_service.py

class PersonalizationService:
    """
    Central service that resolves user personalization context
    and provides it to all platform features.
    """
    
    def __init__(self, db: Session, cache: Redis):
        self.db = db
        self.cache = cache
        
    async def get_context(self, user_id: UUID) -> PersonalizationContext:
        """
        Builds complete personalization context for a user.
        Uses caching for performance.
        """
        cached = await self.cache.get(f"personalization:{user_id}")
        if cached:
            return PersonalizationContext.parse_raw(cached)
            
        user = await self.db.get(User, user_id)
        engagement = await self._get_engagement_data(user_id)
        
        context = PersonalizationContext(
            # Dimension 1: Opportunity Category
            opportunity_preference=user.opportunity_preference,
            
            # Dimension 2: Persona
            persona=user.persona,
            
            # Dimension 3: Industry
            primary_industry=user.primary_industry,
            secondary_industries=user.secondary_industries,
            
            # Dimension 4: Experience
            experience_level=user.experience_level,
            years_experience=user.years_experience,
            
            # Dimension 5: Location
            province=user.province,
            city=user.city,
            willing_to_relocate=user.willing_to_relocate,
            
            # Dimension 6: Career Intent
            career_intent=user.career_intent,
            available_from=user.available_from,
            
            # Dimension 7: Verification
            trust_score=user.trust_score,
            verification_level=user.verification_level,
            
            # Dimension 8: Skills
            skills=await self._get_user_skills(user_id),
            
            # Dimension 9: Salary
            salary_min=user.salary_expectation_min,
            salary_max=user.salary_expectation_max,
            
            # Dimension 10: Work Mode
            work_mode=user.work_mode_preference,
            max_commute=user.max_commute_minutes,
            
            # Dimension 11: Engagement (inferred)
            engagement_pattern=engagement.pattern
        )
        
        await self.cache.setex(
            f"personalization:{user_id}",
            ttl=300,  # 5 min cache
            value=context.json()
        )
        
        return context
```

---

### Integration with Existing Features

#### 1. Feed Integration (BLEND)

```python
# feed_service.py - ENHANCED

class FeedService:
    def __init__(self, personalization: PersonalizationService):
        self.personalization = personalization
    
    async def get_personalized_feed(
        self, 
        user_id: UUID,
        page: int = 1
    ) -> FeedResponse:
        # Get personalization context
        ctx = await self.personalization.get_context(user_id)
        
        # Apply opportunity category filter
        opportunity_filter = self._build_opportunity_filter(ctx)
        
        # Apply industry relevance scoring
        industry_boost = self._build_industry_boost(ctx)
        
        # Apply experience level filter
        experience_filter = self._build_experience_filter(ctx)
        
        # Apply location filter
        location_filter = self._build_location_filter(ctx)
        
        # Build personalized query
        opportunities = await self.db.query(Opportunity)\
            .filter(opportunity_filter)\
            .filter(experience_filter)\
            .filter(location_filter)\
            .order_by(industry_boost)\
            .paginate(page)
            
        return FeedResponse(
            opportunities=opportunities,
            personalization_applied={
                "category": ctx.opportunity_preference,
                "industry": ctx.primary_industry,
                "experience": ctx.experience_level
            }
        )
```

#### 2. AI Matching Integration (BLEND)

```python
# ai_matching_service.py - ENHANCED

class AIMatchingService:
    """
    Blends personalization dimensions with existing AI matching.
    """
    
    async def get_matches(
        self, 
        user_id: UUID,
        opportunity_id: UUID
    ) -> MatchScore:
        ctx = await self.personalization.get_context(user_id)
        opportunity = await self.get_opportunity(opportunity_id)
        
        # Category-specific matching weights
        if ctx.opportunity_preference == 'jobs':
            weights = JobsMatchingWeights()
        elif ctx.opportunity_preference == 'training_skills_programs':
            weights = TrainingMatchingWeights()
        else:
            weights = BlendedMatchingWeights()
        
        # Calculate match score using dimension-aware weights
        score = self.calculate_match(
            user_skills=ctx.skills,
            opportunity_requirements=opportunity.requirements,
            weights=weights,
            experience_level=ctx.experience_level,
            salary_range=(ctx.salary_min, ctx.salary_max)
        )
        
        return score
```

#### 3. AI Coaching Integration (BLEND)

```python
# coaching_service.py - ENHANCED

class CoachingService:
    """
    Customizes AI coach responses based on personalization.
    """
    
    def build_system_prompt(self, ctx: PersonalizationContext) -> str:
        base_prompt = "You are a career coach for Proofile users."
        
        # Add category-specific context
        if ctx.opportunity_preference == 'jobs':
            base_prompt += """
            The user is focused on finding work opportunities.
            Tailor advice for job searching, interviews, and career growth.
            """
        else:
            base_prompt += """
            The user is focused on training and skills development.
            Tailor advice for learnerships, internships, and skill building.
            """
        
        # Add experience-specific context
        if ctx.experience_level == 'entry_student':
            base_prompt += "The user is new to the workforce. Be encouraging and explain basic concepts."
        elif ctx.experience_level == 'executive':
            base_prompt += "The user is senior. Discuss strategic career moves and leadership."
        
        # Add industry context
        base_prompt += f"\nThe user works in {ctx.primary_industry}."
        
        return base_prompt
```

#### 4. Verification Integration (APPEND)

```python
# verification_service.py - ENHANCED

class VerificationService:
    """
    Appends personalization to prioritize verification steps.
    """
    
    async def get_priority_verifications(
        self,
        user_id: UUID
    ) -> List[VerificationStep]:
        ctx = await self.personalization.get_context(user_id)
        
        # Different priorities based on opportunity preference
        if ctx.opportunity_preference == 'jobs':
            return [
                VerificationStep("work_history", priority=1),
                VerificationStep("skills", priority=2),
                VerificationStep("peer_ratings", priority=3),
                VerificationStep("education", priority=4),
            ]
        else:  # Training & Skills Programs
            return [
                VerificationStep("education", priority=1),
                VerificationStep("certifications", priority=2),
                VerificationStep("portfolio", priority=3),
                VerificationStep("references", priority=4),
            ]
```

#### 5. Ratings Integration (APPEND)

```python
# ratings_service.py - ENHANCED

class RatingsService:
    """
    Appends personalization to customize rating categories.
    """
    
    async def get_rating_categories(
        self,
        user_id: UUID
    ) -> List[RatingCategory]:
        ctx = await self.personalization.get_context(user_id)
        
        if ctx.opportunity_preference == 'jobs':
            return [
                RatingCategory("technical_skills"),
                RatingCategory("leadership"),
                RatingCategory("collaboration"),
                RatingCategory("reliability"),
                RatingCategory("problem_solving"),
            ]
        else:  # Training & Skills Programs
            return [
                RatingCategory("learning_aptitude"),
                RatingCategory("initiative"),
                RatingCategory("coachability"),
                RatingCategory("teamwork"),
                RatingCategory("potential"),
            ]
```

---

### API Endpoints

```
GET  /api/v1/personalization/context
     → Returns user's full personalization context

POST /api/v1/personalization/preferences
     → Updates user's personalization preferences

GET  /api/v1/feed?personalized=true
     → Returns personalized opportunity feed

GET  /api/v1/opportunities/matches
     → Returns personalized opportunity matches

GET  /api/v1/coaching/prompts
     → Returns personalized coaching prompts

GET  /api/v1/verification/priorities
     → Returns personalized verification priorities

GET  /api/v1/ratings/categories
     → Returns personalized rating categories
```

---

## Detailed UI/UX Design System

### Design Principles

1. **Dimension-Aware UI** - Interface adapts based on user's personalization profile
2. **Progressive Disclosure** - Show relevant content first, hide irrelevant
3. **Consistent but Contextual** - Same design language, different content
4. **Seamless Transitions** - Smooth changes when user updates preferences

---

### Personalized Component Library

#### 1. Onboarding Wizard (NEW - Phase 1)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          WELCOME TO PROOFILE                            │
│                                                                         │
│                     Let's personalize your experience                   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  ● Step 1: What are you looking for?                           │   │
│  │  ○ Step 2: Your background                                      │   │
│  │  ○ Step 3: Career goals                                         │   │
│  │  ○ Step 4: Preferences                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────────────┐   ┌────────────────────────────────┐    │
│  │     💼 JOBS              │   │  📚 TRAINING & SKILLS           │    │
│  │                          │   │       PROGRAMS                  │    │
│  │  Find your next role     │   │  Build your career              │    │
│  │                          │   │                                 │    │
│  │  • Employment            │   │  • Internships                  │    │
│  │  • Contract work         │   │  • Learnerships                 │    │
│  │  • Freelance             │   │  • Apprenticeships              │    │
│  │  • Consulting            │   │                                 │    │
│  │                          │   │                                 │    │
│  │  [ SELECT ]              │   │  [ SELECT ]                     │    │
│  └──────────────────────────┘   └────────────────────────────────┘    │
│                                                                         │
│                        ○ I'm interested in both                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2. Personalized Dashboard (ENHANCE existing)

**Jobs-Focused Dashboard:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏠 Dashboard                                    Jobs View | Programs ▼ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ 📊 YOUR JOB SEARCH STATS   │  │ 🎯 TOP MATCHES TODAY            │  │
│  │                             │  │                                 │  │
│  │  Applications: 12           │  │  Senior Dev @ TechCorp (95%)   │  │
│  │  Interviews: 3              │  │  Lead Eng @ FinHub (88%)       │  │
│  │  Views: 245                 │  │  Architect @ StartupX (82%)    │  │
│  │                             │  │                                 │  │
│  │  [ View All Applications ]  │  │  [ See All Matches ]           │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 💰 SALARY INSIGHTS                                              │   │
│  │                                                                 │   │
│  │  Your expected: R650k - R850k                                   │   │
│  │  Market average: R720k  (You're in range! ✓)                    │   │
│  │                                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Training & Skills Dashboard:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏠 Dashboard                                    Jobs | Programs View ▼ │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────┐  │
│  │ 📚 YOUR APPLICATIONS        │  │ ⭐ FEATURED PROGRAMS            │  │
│  │                             │  │                                 │  │
│  │  Pending: 3                 │  │  IT Learnership @ Capitec      │  │
│  │  Shortlisted: 1             │  │  Data Science @ Discovery      │  │
│  │  Accepted: 0                │  │  Finance @ Standard Bank       │  │
│  │                             │  │                                 │  │
│  │  [ Track Applications ]     │  │  [ Explore Programs ]          │  │
│  └─────────────────────────────┘  └─────────────────────────────────┘  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 🎓 SKILLS PROGRESS                                              │   │
│  │                                                                 │   │
│  │  NQF Level: 5 → Building towards Level 6                        │   │
│  │  Skills Verified: 4/7                                           │   │
│  │                                                                 │   │
│  │  [████████░░░░░░░░] 57% to next level                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### 3. Personalized Feed (ENHANCE existing)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  FILTERS        Your Preferences: Jobs • Tech • Senior • GPT  ▼│   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ [All Opportunities] [Jobs ●] [Training & Skills] [Saved]        │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  📍 PERSONALIZED FOR YOU                                        │   │
│  │                                                                 │   │
│  │  Showing: Tech jobs in Gauteng for Senior professionals         │   │
│  │  Salary: R600k - R1.2M • Work mode: Remote/Hybrid              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ ┌──────┐  Senior Software Engineer                      95% ⭐  │ │
│  │ │ LOGO │  TechCorp • Johannesburg                               │ │
│  │ └──────┘  R850k - R1.1M • Remote                                │ │
│  │                                                                  │ │
│  │  ✓ Matches your skills: Python, AWS, React                      │ │
│  │  ✓ Matches your salary: Within range                            │ │
│  │  ✓ Matches your work mode: Remote                               │ │
│  │                                                                  │ │
│  │  [ Apply ] [ Save ] [ View Details ]                            │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### 4. Personalized Opportunity Card

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌────────┐                                                            │
│   │  LOGO  │  Senior Software Engineer                     MATCH: 95%  │
│   └────────┘  TechCorp • Johannesburg, Gauteng                          │
│                                                                         │
│   💰 R850,000 - R1,100,000/year                                         │
│   🏠 Remote (with optional office)                                      │
│   📅 Posted 2 days ago • Closes in 12 days                              │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ WHY THIS MATCHES YOU:                                           │  │
│   │ ✓ Skills: Python (you have 5 yrs), AWS (you have 3 yrs)        │  │
│   │ ✓ Salary: 15% above your expectation                           │  │
│   │ ✓ Location: 12km from you                                       │  │
│   │ ✓ Experience: They want 5+ yrs, you have 7                     │  │
│   │ ⚠ Gap: TypeScript (consider learning)                          │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   [ 🚀 Quick Apply ]   [ ♡ Save ]   [ 📋 View Full Details ]           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

#### 5. Settings: Personalization Preferences

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚙️ Settings > Personalization Preferences                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ OPPORTUNITY FOCUS                                               │   │
│  │                                                                 │   │
│  │  ○ Jobs only                                                    │   │
│  │  ○ Training & Skills Programs only                              │   │
│  │  ● Show me both                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ INDUSTRY PREFERENCES                                            │   │
│  │                                                                 │   │
│  │  Primary:    [Technology               ▼]                       │   │
│  │  Also show:  ☑ Finance  ☑ Consulting  ☐ Healthcare              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ EXPERIENCE LEVEL                                                │   │
│  │                                                                 │   │
│  │  ○ Entry/Student  ○ Junior  ○ Mid-Level  ● Senior  ○ Executive │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ LOCATION                                                        │   │
│  │                                                                 │   │
│  │  Province: [Gauteng ▼]    City: [Johannesburg ▼]               │   │
│  │                                                                 │   │
│  │  ☐ Willing to relocate                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ WORK MODE                                                       │   │
│  │                                                                 │   │
│  │  ● Remote only  ○ Hybrid  ○ Office  ○ Flexible                  │   │
│  │                                                                 │   │
│  │  Max commute: [45] minutes                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                    [ Save Preferences ]                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### Color & Visual Language

#### Category Color Coding

| Category | Primary Color | Usage |
|----------|---------------|-------|
| **Jobs** | Blue (`#3B82F6`) | Job opportunity cards, CTAs |
| **Training & Skills** | Orange (`#F97316`) | Training program cards, CTAs |
| **Match Score** | Green gradient | High match indicators |
| **Alerts** | Amber (`#F59E0B`) | Deadlines, gaps |
| **Verified** | Emerald (`#10B981`) | Verification badges |

#### Dimension-Based Visual Indicators

```css
/* Experience level badges */
.badge-entry { background: linear-gradient(to-r, #93C5FD, #60A5FA); }
.badge-junior { background: linear-gradient(to-r, #6EE7B7, #34D399); }
.badge-mid { background: linear-gradient(to-r, #FCD34D, #FBBF24); }
.badge-senior { background: linear-gradient(to-r, #F97316, #EA580C); }
.badge-executive { background: linear-gradient(to-r, #A855F7, #9333EA); }

/* Verification level badges */
.verification-basic { border: 2px solid #9CA3AF; }
.verification-standard { border: 2px solid #3B82F6; }
.verification-verified { border: 2px solid #10B981; background: #D1FAE5; }
.verification-premium { border: 2px solid #F59E0B; background: #FEF3C7; }
```

---

### Frontend Component Architecture

```typescript
// PersonalizationProvider.tsx

import { createContext, useContext, useEffect, useState } from 'react';

interface PersonalizationContextType {
  context: UserPersonalization | null;
  isLoading: boolean;
  updatePreference: (key: string, value: any) => Promise<void>;
  refreshContext: () => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextType>(null);

export function PersonalizationProvider({ children }) {
  const [context, setContext] = useState<UserPersonalization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadPersonalizationContext();
  }, []);
  
  const loadPersonalizationContext = async () => {
    const response = await fetch('/api/v1/personalization/context');
    const data = await response.json();
    setContext(data);
    setIsLoading(false);
  };
  
  const updatePreference = async (key: string, value: any) => {
    await fetch('/api/v1/personalization/preferences', {
      method: 'POST',
      body: JSON.stringify({ [key]: value })
    });
    await loadPersonalizationContext();
  };
  
  return (
    <PersonalizationContext.Provider value={{ 
      context, 
      isLoading, 
      updatePreference,
      refreshContext: loadPersonalizationContext 
    }}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export const usePersonalization = () => useContext(PersonalizationContext);
```

```typescript
// Usage in components

function OpportunityFeed() {
  const { context } = usePersonalization();
  
  // Conditionally render based on opportunity preference
  if (context?.opportunity_preference === 'jobs') {
    return <JobsFeed />;
  } else if (context?.opportunity_preference === 'training_skills_programs') {
    return <TrainingFeed />;
  }
  
  return <BlendedFeed />;
}

function DashboardWidgets() {
  const { context } = usePersonalization();
  
  return (
    <>
      {/* Common widgets */}
      <ProfileCompleteness />
      <NotificationsWidget />
      
      {/* Jobs-specific widgets */}
      {context?.opportunity_preference !== 'training_skills_programs' && (
        <>
          <SalaryInsights salary={context?.salary_expectation_min} />
          <JobApplications />
          <InterviewSchedule />
        </>
      )}
      
      {/* Training-specific widgets */}
      {context?.opportunity_preference !== 'jobs' && (
        <>
          <SkillsProgress />
          <ProgramApplications />
          <MentorConnections />
        </>
      )}
    </>
  );
}
```

---

### Responsive Behavior

| Screen Size | Personalization Behavior |
|-------------|-------------------------|
| **Desktop** (>1024px) | Full 3-column layout, all personalization filters visible |
| **Tablet** (768-1024px) | 2-column, collapsed filter sidebar |
| **Mobile** (<768px) | Single column, swipe-based category switching, bottom sheet filters |

---

### Accessibility Considerations

1. **Screen readers**: Announce personalization context ("Showing jobs for senior professionals in Gauteng")
2. **Color contrast**: All category colors meet WCAG 2.1 AA standards
3. **Keyboard navigation**: Tab through personalization options
4. **Reduced motion**: Respect `prefers-reduced-motion` for transitions

---

## Related Documents

- [Jobs to Opportunities Transformation](./jobs_to_opportunities_transformation.md)
- [Feed & Dashboard Transformation](./feed_dashboard_transformation_plan.md)
- [Home & Portal Combination](./home_portal_combination_plan.md)
- [Ratings System](./ratings_plan.md)
