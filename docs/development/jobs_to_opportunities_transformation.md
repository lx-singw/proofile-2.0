# Jobs to Opportunities Transformation Plan

## Executive Summary

Transform the Proofile platform from a "Jobs" focused terminology to "Opportunities" to cover a broader range of career opportunities in South Africa, including:
- Traditional employment (full-time, part-time)
- Contract work
- Freelance gigs
- Internships
- Learnerships
- Apprenticeships
- Volunteer positions
- Board positions
- Consulting engagements

---

## Scope & Impact Analysis

### Frontend Files Affected

#### A. Routes/Pages to Rename
| Current Path | New Path | Files Affected |
|--------------|----------|----------------|
| `/jobs` | `/opportunities` | 8+ files |
| `/jobs/[id]` | `/opportunities/[id]` | page.tsx, apply/page.tsx, gap-analysis/page.tsx |
| `/jobs/saved` | `/opportunities/saved` | page.tsx |
| `/jobs/agents` | `/opportunities/agents` | page.tsx, hunter/page.tsx, logs/page.tsx |
| `/jobs/market` | `/opportunities/market` | page.tsx |

#### B. Component Files to Rename
| Current Name | New Name |
|--------------|----------|
| `components/jobs/` | `components/opportunities/` |
| `cards/JobMatchCard.tsx` | `cards/OpportunityMatchCard.tsx` |
| `components/dashboard/JobRecommendations.tsx` | `components/dashboard/OpportunityRecommendations.tsx` |
| `components/portal/JobSearchSection.tsx` | `components/portal/OpportunitySearchSection.tsx` |
| `components/ai/AIJobMatches.tsx` | `components/ai/AIOpportunityMatches.tsx` |
| `components/resume/JobMatching.tsx` | `components/resume/OpportunityMatching.tsx` |

#### C. Service Files to Rename
| Current Name | New Name |
|--------------|----------|
| `services/jobService.ts` | `services/opportunityService.ts` |
| `store/useJobStore.ts` | `store/useOpportunityStore.ts` |

#### D. UI Text Changes (~50+ files)
- Navigation labels: "Jobs" → "Opportunities"
- Buttons: "Search Jobs" → "Find Opportunities"
- Headers: "Job Listings" → "Opportunities"
- Cards: "Job Match" → "Opportunity Match"
- Filters: "Job Type" → "Opportunity Type"
- Messages: "No jobs found" → "No opportunities found"

---

### Backend Files Affected

#### A. Model Files to Rename
| Current Name | New Name |
|--------------|----------|
| `models/job.py` | `models/opportunity.py` |
| `models/saved_job.py` | `models/saved_opportunity.py` |
| `models/portal_job.py` | `models/portal_opportunity.py` |

#### B. Schema Files to Rename
| Current Name | New Name |
|--------------|----------|
| `schemas/job.py` | `schemas/opportunity.py` |

#### C. Service Files to Rename
| Current Name | New Name |
|--------------|----------|
| `services/job_service.py` | `services/opportunity_service.py` |

#### D. API Route Files to Rename
| Current Name | New Name |
|--------------|----------|
| `api/v1/jobs.py` | `api/v1/opportunities.py` |

#### E. Database Migrations
New migration required to rename:
- `jobs` table → `opportunities`
- `saved_jobs` table → `saved_opportunities`
- `portal_jobs` table → `portal_opportunities`
- Related columns containing "job" references

#### F. Scraper/Task Files
| Current Name | New Name |
|--------------|----------|
| `scripts/seed_portal_jobs.py` | `scripts/seed_portal_opportunities.py` |
| `create_test_jobs.py` | `create_test_opportunities.py` |

---

## Detailed Implementation Phases

### Phase 1: Backend Foundation (Priority: High)

#### 1.1 Database Migration
```python
# New migration: rename_jobs_to_opportunities.py
- Rename table: jobs → opportunities
- Rename table: saved_jobs → saved_opportunities
- Rename table: portal_jobs → portal_opportunities
- Update foreign key references
- Update indexes
```

#### 1.2 Model Updates
- Create new `Opportunity` model (copy from `Job`)
- Create new `SavedOpportunity` model
- Create new `PortalOpportunity` model
- Update all class names and references

#### 1.3 Schema Updates
- Rename all Job* schemas to Opportunity* schemas
- Update field names where appropriate

#### 1.4 Service Updates
- Rename `job_service.py` → `opportunity_service.py`
- Update all function names and references

#### 1.5 API Route Updates
- Rename endpoint paths: `/api/v1/jobs` → `/api/v1/opportunities`
- Update route file name
- Maintain backward compatibility with redirects if needed

---

### Phase 2: Frontend Routes (Priority: High)

#### 2.1 Directory Restructure
```
frontend/src/app/
├── jobs/           →  opportunities/
│   ├── page.tsx
│   ├── [id]/
│   │   ├── page.tsx
│   │   ├── apply/
│   │   └── gap-analysis/
│   ├── saved/
│   ├── agents/
│   └── market/
```

#### 2.2 Component Restructure
```
frontend/src/components/
├── jobs/           →  opportunities/
│   ├── ApplyModal.tsx
│   ├── agents/
│   ├── cards/
│   ├── filters/
│   ├── modals/
│   └── visualization/
```

#### 2.3 Service Updates
- `jobService.ts` → `opportunityService.ts`
- Update all API endpoint paths
- Update function names

#### 2.4 Store Updates
- `useJobStore.ts` → `useOpportunityStore.ts`
- Update state property names

---

### Phase 3: UI Text & Labels (Priority: Medium)

#### 3.1 Navigation Updates
**Files:** `config/navigation.tsx`, `middleware.ts`
- Update menu labels
- Update route paths in navigation config

#### 3.2 Page Content Updates
**All affected pages need text changes:**

| Area | Current Text | New Text |
|------|--------------|----------|
| Search | "Search Jobs" | "Find Opportunities" |
| Hero | "Find Your Next Job" | "Discover Your Next Opportunity" |
| Results | "X jobs found" | "X opportunities found" |
| Empty | "No jobs match" | "No opportunities match" |
| CTA | "Browse Jobs" | "Explore Opportunities" |
| Filters | "Job Type" | "Opportunity Type" |
| Cards | "Job Match Score" | "Match Score" |

#### 3.3 Component Text Updates
- Update all hardcoded strings
- Consider i18n implementation for future flexibility

---

### Phase 4: Type System Updates (Priority: Medium)

#### 4.1 TypeScript Interfaces
```typescript
// Current
interface Job { ... }
interface JobCard { ... }
interface SavedJob { ... }

// New
interface Opportunity { ... }
interface OpportunityCard { ... }
interface SavedOpportunity { ... }
```

#### 4.2 Schema Alignment
Ensure frontend types match backend schemas

---

### Phase 5: Testing & Validation (Priority: High)

#### 5.1 Backend Tests
- Update test file names
- Update test function names
- Verify all API endpoints work

#### 5.2 Frontend Tests
- Update SignUpModal.test.tsx references
- Add E2E tests for new routes

#### 5.3 Integration Tests
- Test complete opportunity flow
- Verify backward compatibility

---

## Opportunity Categories

Opportunities are organized into **two main categories**:

### Category Structure

```
Opportunities
├── Jobs
│   ├── Employment (full-time, part-time)
│   ├── Contract (fixed-term)
│   ├── Freelance (gig, project-based)
│   ├── Consulting (advisory work)
│   ├── Board (director positions)
│   └── Volunteer (community work)
│
└── Training & Skills Programs
    ├── Internship (work experience)
    ├── Learnership (SA skills program)
    └── Apprenticeship (trade training)
```

---

### Jobs Category

Work opportunities where you're hired to perform a role.

| Type | Description | Icon |
|------|-------------|------|
| **Employment** | Full-time, part-time positions | `Briefcase` |
| **Contract** | Fixed-term contracts | `FileText` |
| **Freelance** | Gig work, project-based | `Zap` |
| **Consulting** | Expert advisory work | `Brain` |
| **Board** | Director/advisory positions | `Users` |
| **Volunteer** | Non-profit, community work | `Heart` |

---

### Training & Skills Programs Category

Structured development programs combining learning with work experience.

| Type | Description | Icon |
|------|-------------|------|
| **Internship** | Student/graduate work experience | `GraduationCap` |
| **Learnership** | SA-specific SETA-registered program | `BookOpen` |
| **Apprenticeship** | Trade/craft training program | `Wrench` |

> **Note:** Learnerships are a South African qualification combining theory and workplace experience, linked to NQF levels and registered with SETAs.

---

### Database Schema

```sql
-- Opportunity category enum
CREATE TYPE opportunity_category AS ENUM (
  'jobs',
  'training_skills_programs'
);

-- Opportunity type enum
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

-- Add to opportunities table
ALTER TABLE opportunities 
  ADD COLUMN category opportunity_category,
  ADD COLUMN opportunity_type opportunity_type;
```

---

### UI Implementation

#### Navigation Tabs
```
[ All Opportunities ] [ Jobs ] [ Training & Skills Programs ]
```

#### Filter Sidebar
```
Category
├── ☑ Jobs
│   ├── ☐ Employment
│   ├── ☐ Contract
│   ├── ☐ Freelance
│   ├── ☐ Consulting
│   ├── ☐ Board
│   └── ☐ Volunteer
│
└── ☑ Training & Skills Programs
    ├── ☐ Internship
    ├── ☐ Learnership
    └── ☐ Apprenticeship
```

#### Home Page Sections
- "Find Jobs" → Browse employment, contracts, freelance, etc.
- "Explore Training & Skills Programs" → Browse internships, learnerships, apprenticeships

---

## API Compatibility

### Backward Compatibility Strategy
For a smooth transition:

1. **Phase A:** Add new `/opportunities` routes alongside `/jobs`
2. **Phase B:** Add deprecation warnings to `/jobs` routes
3. **Phase C:** Redirect `/jobs/*` to `/opportunities/*`
4. **Phase D:** Remove old `/jobs` routes after 3 months

### URL Redirects
```typescript
// middleware.ts
const opportunityRedirects = {
  '/jobs': '/opportunities',
  '/jobs/saved': '/opportunities/saved',
  '/jobs/:id': '/opportunities/:id',
  '/jobs/:id/apply': '/opportunities/:id/apply',
};
```

---

## Files to Modify - Complete List

### Frontend (~60 files) ✅ COMPLETE

**Routes:**
- [x] `app/jobs/page.tsx` → `app/opportunities/page.tsx`
- [x] `app/jobs/layout.tsx` → `app/opportunities/layout.tsx`
- [x] `app/jobs/loading.tsx` → `app/opportunities/loading.tsx`
- [x] `app/jobs/error.tsx` → `app/opportunities/error.tsx`
- [x] `app/jobs/[id]/page.tsx` → `app/opportunities/[id]/page.tsx`
- [x] `app/jobs/[id]/apply/page.tsx` → `app/opportunities/[id]/apply/page.tsx`
- [x] `app/jobs/[id]/gap-analysis/page.tsx` → `app/opportunities/[id]/gap-analysis/page.tsx`
- [x] `app/jobs/saved/page.tsx` → `app/opportunities/saved/page.tsx`
- [x] `app/jobs/agents/page.tsx` → `app/opportunities/agents/page.tsx`
- [x] `app/jobs/agents/hunter/page.tsx` → `app/opportunities/agents/hunter/page.tsx`
- [x] `app/jobs/agents/logs/page.tsx` → `app/opportunities/agents/logs/page.tsx`
- [x] `app/jobs/market/page.tsx` → `app/opportunities/market/page.tsx`

**Components:**
- [x] `components/jobs/` → `components/opportunities/` (entire directory)
- [x] `components/dashboard/JobRecommendations.tsx`
- [x] `components/portal/JobSearchSection.tsx`
- [x] `components/portal/PortalJobCard.tsx`
- [x] `components/ai/AIJobMatches.tsx`
- [x] `components/resume/JobMatching.tsx`
- [x] `components/feed/FeedRightSidebar.tsx`
- [x] `components/feed/FeedLeftSidebar.tsx`
- [x] `components/home/HomeRightSidebar.tsx`

**Services/Stores:**
- [x] `services/jobService.ts` → `services/opportunityService.ts`
- [x] `services/portalService.ts` (update references)
- [x] `store/useJobStore.ts` → `store/useOpportunityStore.ts`
- [x] `store/useAgentStore.ts` (update references)

**Configuration:**
- [x] `config/navigation.tsx`
- [x] `middleware.ts`

**Other Pages:**
- [x] `app/home/page.tsx`
- [x] `app/feed/page.tsx`
- [x] `app/dashboard/page.tsx`
- [x] `app/portal/page.tsx`
- [x] `app/portal/[id]/page.tsx`
- [x] `app/tools/page.tsx`
- [x] `app/discover/page.tsx`
- [x] `app/explore/page.tsx`
- [x] `app/analytics/page.tsx`
- [x] `app/ai-assistant/page.tsx`
- [x] `app/onboarding/page.tsx`
- [x] `app/profile/page.tsx`
- [x] `app/settings/page.tsx`

### Backend (~40 files) ✅ COMPLETE

**Models:**
- [x] `models/job.py` → `models/opportunity.py`
- [x] `models/saved_job.py` → `models/saved_opportunity.py`
- [x] `models/portal_job.py` → `models/portal_opportunity.py`
- [x] `models/application.py` (update references)
- [x] `models/user.py` (update references)

**Schemas:**
- [x] `schemas/job.py` → `schemas/opportunity.py`
- [x] `schemas/portal.py` (update references)

**Services:**
- [x] `services/job_service.py` → `services/opportunity_service.py`
- [x] `services/portal_service.py` (update references)
- [x] `services/feed_service.py` (update references)
- [x] `services/agents/hunter.py` (update references)
- [x] `services/trust_score_engine.py` (update references)

**API:**
- [x] `api/v1/jobs.py` → `api/v1/opportunities.py`
- [x] `api/v1/portal.py` (update references)
- [x] `api/v1/agents.py` (update references)
- [x] `api/v1/ai.py` (update references)
- [x] `api/v1/ai_chat.py` (update references)
- [x] `api/v1/analytics.py` (update references)
- [x] `api/v1/api.py` (update router references)

**Tasks/Scripts:**
- [x] `scripts/seed_portal_jobs.py`
- [x] `scripts/run_scrapers.py`
- [x] `scripts/test_scrapers.py`
- [x] `create_test_jobs.py`
- [x] `tasks/portal_scraper.py`

**Scrapers:**
- [x] `scrapers/indeed.py`
- [x] `scrapers/pnet.py`
- [x] `scrapers/careers24.py`
- [x] `scrapers/utils.py`
- [x] `scrapers/__init__.py`

**Database:**
- [x] New migration: `rename_jobs_to_opportunities.py`
- [x] Existing migrations (reference only, don't modify)

---

## Estimated Effort

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1: Backend Foundation | 2-3 days | High (DB migration) |
| Phase 2: Frontend Routes | 1-2 days | Medium |
| Phase 3: UI Text & Labels | 1-2 days | Low |
| Phase 4: Type System | 1 day | Low |
| Phase 5: Testing | 1-2 days | Medium |
| **Total** | **6-10 days** | |

---

## Rollback Plan

1. Keep database backup before migration
2. Maintain git branch with original "jobs" code
3. Use feature flags if needed for gradual rollout
4. Plan for quick revert if critical issues arise

---

## Success Criteria

- [x] All `/jobs` routes redirect to `/opportunities`
- [x] All UI text uses "opportunities" terminology
- [x] All API endpoints use `/opportunities` paths
- [ ] Database tables renamed successfully
- [ ] All tests pass
- [ ] No broken links or 404s
- [ ] Mobile app (if any) updated
- [ ] SEO redirects configured

---

## Category-Based Personalized Experience

### Overview

The opportunity category (Jobs vs Training & Skills Programs) selected during signup drives a **unique, tailored experience** across the entire platform. This creates two distinct user journeys while maintaining a unified platform.

---

### 1. Signup & Onboarding

#### Category Selection Step
During registration, users select their primary interest:

```
┌─────────────────────────────────────────────────────────────┐
│                    What are you looking for?                │
│                                                             │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │      💼 JOBS        │    │  📚 TRAINING & SKILLS       │ │
│  │                     │    │      PROGRAMS               │ │
│  │  Employment         │    │                             │ │
│  │  Contract work      │    │  Internships                │ │
│  │  Freelance gigs     │    │  Learnerships               │ │
│  │  Consulting         │    │  Apprenticeships            │ │
│  │                     │    │                             │ │
│  │  [ Select Jobs ]    │    │  [ Select Programs ]        │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                                                             │
│            ○ I'm interested in both                         │
└─────────────────────────────────────────────────────────────┘
```

#### Database Schema Update
```sql
ALTER TABLE users ADD COLUMN opportunity_preference opportunity_category;
-- Values: 'jobs', 'training_skills_programs', 'both'
```

#### Category-Specific Onboarding Flows

| Step | Jobs User | Training & Skills User |
|------|-----------|------------------------|
| Profile Setup | Work history, skills, salary expectations | Education, certifications, career goals |
| Experience Level | Junior/Mid/Senior/Executive | Student/Graduate/Career Changer |
| Goals | "Find my next role" | "Launch my career", "Gain skills" |
| Resume | Upload or build resume | Upload CV, highlight education |
| Verification Priority | Work history, skills endorsements | Education, certifications |

---

### 2. Personalized User Feed

#### Jobs-Focused Feed
```
┌─────────────────────────────────────────────────────────────┐
│ Your Feed                              [Jobs] [Programs]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 🔥 TRENDING JOBS                                            │
│ ├── Senior Developer at TechCorp (95% match)               │
│ ├── Product Manager at FinanceHub (88% match)              │
│ └── UX Designer at StartupXYZ (82% match)                  │
│                                                             │
│ 💼 NEW CONTRACTS                                            │
│ ├── 6-month React Developer contract                       │
│ └── SAP Consultant - Remote                                │
│                                                             │
│ 🎯 MATCHED TO YOUR SKILLS                                   │
│ ├── Python roles with 90%+ match                           │
│ └── Salary range: R800k - R1.2M                            │
│                                                             │
│ 📊 SALARY INSIGHTS                                          │
│ └── Senior Devs in JHB earning R95k avg                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Training & Skills Programs Feed
```
┌─────────────────────────────────────────────────────────────┐
│ Your Feed                              [Jobs] [Programs]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📚 FEATURED LEARNERSHIPS                                    │
│ ├── IT Technical Support - Capitec (SETA funded)           │
│ ├── Data Science Learnership - Discovery                   │
│ └── Financial Services - Standard Bank                     │
│                                                             │
│ 🎓 INTERNSHIPS FOR YOU                                      │
│ ├── Graduate Software Developer - Amazon SA               │
│ └── Marketing Intern - Takealot                            │
│                                                             │
│ 🔧 APPRENTICESHIPS                                          │
│ ├── Electrical Artisan - Eskom                             │
│ └── Automotive Technician - BMW SA                         │
│                                                             │
│ 💡 SKILLS DEVELOPMENT                                       │
│ ├── Free coding bootcamps near you                         │
│ └── NQF-aligned certifications                             │
│                                                             │
│ 🏆 SUCCESS STORIES                                          │
│ └── How Sarah went from learnership to Lead Developer      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3. AI Matching & Recommendations

#### Jobs AI Matching Criteria
| Factor | Weight | Description |
|--------|--------|-------------|
| Skills Match | 35% | Technical and soft skills alignment |
| Experience Level | 25% | Years of experience vs requirements |
| Industry Match | 15% | Sector experience |
| Salary Fit | 15% | Expected vs offered salary |
| Location | 10% | Remote/hybrid/onsite preferences |

#### Training & Skills AI Matching Criteria
| Factor | Weight | Description |
|--------|--------|-------------|
| Education Level | 30% | NQF level, qualifications required |
| Career Goals | 25% | Alignment with stated career path |
| Skill Gaps | 20% | Areas where user needs development |
| SETA Alignment | 15% | Relevant SETA registration |
| Location/Mode | 10% | In-person vs online training |

#### Personalized Prompts
```typescript
// Jobs user prompt
"Based on your 5 years of Python experience and preference for 
remote work, here are your top matches..."

// Training user prompt  
"Based on your BCom degree and interest in data analytics, 
these learnerships will help you build the skills employers want..."
```

---

### 4. AI Career Coach

#### Jobs User Coaching Topics
- Resume optimization for specific roles
- Interview preparation
- Salary negotiation strategies
- Career progression planning
- Networking and personal branding
- Side gig opportunities

#### Training & Skills User Coaching Topics
- Choosing the right learnership/internship
- Building a professional portfolio from scratch
- Understanding SETA qualifications
- Transitioning from training to employment
- Study tips and time management
- First job preparation

#### Conversation Starters
```
Jobs User:
├── "Review my resume for Senior Developer roles"
├── "Help me negotiate a higher salary"
└── "What skills should I learn next for promotion?"

Training User:
├── "Which learnership is best for software development?"
├── "How do I prepare for my first internship interview?"
└── "Explain the NQF levels to me"
```

---

### 5. Verification Priorities

#### Jobs User Verification
| Priority | Verification Type | Why Important |
|----------|-------------------|---------------|
| 1 | Work History | Confirm employment claims |
| 2 | Skills Assessment | Validate technical abilities |
| 3 | Peer Ratings | Social proof from colleagues |
| 4 | Certifications | Industry credentials |
| 5 | Education | Academic qualifications |

#### Training & Skills User Verification
| Priority | Verification Type | Why Important |
|----------|-------------------|---------------|
| 1 | Education | Confirm academic credentials |
| 2 | Certifications | NQF-aligned qualifications |
| 3 | Skills Portfolio | Projects and work samples |
| 4 | References | Academic/mentor endorsements |
| 5 | Volunteer/Projects | Demonstrated initiative |

#### Verification Prompts
```
Jobs User:
→ "Add your work history to unlock premium job matches"
→ "Get your skills verified for 3x more profile views"

Training User:
→ "Verify your matric certificate to qualify for learnerships"
→ "Upload your transcripts for faster applications"
```

---

### 6. Ratings & Reviews System

#### Jobs User Rating Categories
| Category | Description |
|----------|-------------|
| **Technical Skills** | Coding, tools, methodologies |
| **Leadership** | Team management, decision-making |
| **Collaboration** | Teamwork, communication |
| **Reliability** | Delivery, deadlines, attendance |
| **Problem Solving** | Critical thinking, innovation |

#### Training & Skills User Rating Categories
| Category | Description |
|----------|-------------|
| **Learning Aptitude** | Quick learner, curiosity |
| **Initiative** | Proactive, self-driven |
| **Coachability** | Receptive to feedback |
| **Teamwork** | Collaboration with peers |
| **Potential** | Future growth trajectory |

#### Who Can Rate
```
Jobs Users rated by:
├── Former managers
├── Colleagues
├── Clients
└── Direct reports

Training Users rated by:
├── Mentors
├── Lecturers/Trainers
├── Internship supervisors
└── Project partners
```

---

### 7. Dashboard Customization

#### Jobs User Dashboard Widgets
- Active job applications
- Interview schedule
- Salary benchmarking
- Skills gap analysis
- New opportunities count
- Network activity

#### Training User Dashboard Widgets
- Application status (learnerships/internships)
- Course progress
- Skills building tracker
- Mentor connections
- Certificate timeline
- Success stories & inspiration

---

### 8. Notifications & Alerts

#### Jobs User Notifications
- "5 new jobs matching your profile"
- "TechCorp viewed your profile"
- "Your salary is 15% below market"
- "Interview reminder: Tomorrow 10am"

#### Training User Notifications
- "New learnership: Applications close Friday"
- "Complete your profile for SETA eligibility"
- "Your mentor sent feedback"
- "Congratulations! You're shortlisted"

---

### 9. Implementation Checklist

#### Backend Changes
- [x] Add `opportunity_preference` to User model ✅ `user.py`
- [x] Create Category-based feed algorithm ✅ `opportunity_service.py`
- [x] Build separate AI matching models ✅ Category-specific weights
- [x] Implement category-specific verification workflows ✅ `suggestion_engine.py`
- [x] Create rating schemas per category ✅ `scoring_engine.py`

#### Frontend Changes
- [x] Add category selection to signup flow ✅ `onboarding/page.tsx`
- [x] Create dual-feed component with tabs ✅ `opportunities/page.tsx`
- [x] Build category-specific dashboard layouts ✅ `CategoryWidgets.tsx`
- [x] Design distinct onboarding wizards ✅ Category step added
- [x] Implement category-aware notification system ✅ `notification_service.py`

#### AI/ML Changes
- [x] Train Jobs matching model ✅ Weighted scoring
- [x] Train Training & Skills matching model ✅ Category weights
- [x] Create category-specific coaching prompts ✅ `ai_chat.py`
- [x] Build personalized recommendation engine ✅ `opportunity_service.py`

---

### 10. User Preference Flexibility

Users can always:
- **Switch categories** in settings
- **Browse both** categories from feed tabs
- **Save opportunities** from either category
- **Update preference** as career evolves

```typescript
// Settings toggle
{
  primary_preference: 'jobs' | 'training_skills_programs' | 'both',
  show_jobs: true,
  show_training: true,
  notification_preferences: {
    jobs: true,
    training: true
  }
}
```

---

## Personalization Framework

The personalization dimensions used to create tailored user experiences are documented in a separate, comprehensive plan:

📄 **[Complete Personalization Dimensions Framework](./personalization_dimensions_framework.md)**

This framework covers 11 dimensions:
1. Opportunity Category (Jobs vs Training & Skills Programs)
2. User Persona/Role
3. Industry/Sector
4. Experience Level
5. Location/Province (SA-Specific)
6. Career Stage/Intent
7. Verification Level/Trust Score
8. Skills Profile
9. Salary Expectations
10. Work Mode Preference
11. Engagement Behavior

See the linked document for full database schemas, UI implementations, and implementation roadmap.

---

## Implementation Status

### ✅ Completed (December 2025)

| Phase | Description | Status |
|-------|-------------|--------|
| **Phase 1** | Backend Foundation - Models, schemas, APIs | ✅ Done |
| **Phase 2** | Frontend Routes - /jobs → /opportunities | ✅ Done |
| **Phase 3** | Category Personalization - Onboarding, tabs | ✅ Done |
| **Phase 4** | AI Matching - Category-specific weights | ✅ Done |
| **Phase 5** | Verification Priorities - SuggestionEngine | ✅ Done |
| **Phase 6** | Dashboard Customization - CategoryWidgets | ✅ Done |
| **Phase 7** | AI Coaching Prompts - Personalized coaching | ✅ Done |
| **Phase 8** | Ratings Categories - Dimension schemas | ✅ Done |
| **Phase 9** | Category Notifications - Personalized templates | ✅ Done |

### Key Files Modified

**Backend:**
- `backend/app/models/opportunity.py` - Opportunity model with category
- `backend/app/models/user.py` - Added `opportunity_preference`
- `backend/app/services/opportunity_service.py` - Category-specific matching
- `backend/app/services/suggestion_engine.py` - Verification priorities
- `backend/app/services/scoring/scoring_engine.py` - Rating dimensions
- `backend/app/services/notification_service.py` - Category notification templates
- `backend/app/api/v1/ai_chat.py` - Category coaching prompts

**Frontend:**
- `frontend/src/app/opportunities/` - Renamed from /jobs
- `frontend/src/app/onboarding/page.tsx` - Category selection
- `frontend/src/components/dashboard/CategoryWidgets.tsx` - New
- `frontend/src/services/opportunityService.ts` - Renamed

### Pull Requests

| PR | Branch | Status |
|----|--------|--------|
| Jobs → Opportunities | `feat/jobs-to-opportunities` | ✅ Merged |
| Category Enhancements | `feat/category-enhancements` | 🔄 Ready |

---

## Future Enhancements

| Feature | Priority | Description |
|---------|----------|-------------|
| URL Redirects | Low | /jobs/* → /opportunities/* |
| Settings Toggle | Low | UI to switch category preference |
