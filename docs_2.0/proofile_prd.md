# ProofileSA — Product Requirements Document (PRD)
### The Full Blueprint: Phase 1 Through Monopoly

> **Vision:** Own the verified professional trust graph of the world — starting with South Africa. Replace the self-reported CV with proof. Replace isolated platform reputation systems with portable trust infrastructure. Become the identity layer the internet was supposed to have.

> **Codename:** The Real Graph — a deliberate, phased capture of every node in the professional trust and hiring network.

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [User Personas](#2-user-personas)
2.5. [GTM Model — Jobs Wedge, Trust Core](#25-gtm-model--jobs-wedge-trust-core)
3. [Phase 1 — ProofileSA (Verified Professional Profile)](#3-phase-1--proofilesa)
4. [Phase 2 — Proofile Recruit (Hiring Graph)](#4-phase-2--proofile-recruit)
5. [Phase 3 — Proofile API (Trust Infrastructure)](#5-phase-3--proofile-api)
6. [Phase 4 — Proofile Verify (Fake CV Detection)](#6-phase-4--proofile-verify)
7. [Phase 5 — Proofile Identity (Universal Trust Score)](#7-phase-5--proofile-identity)
8. [Platform Architecture](#8-platform-architecture)
9. [The Graph Data Strategy](#9-the-graph-data-strategy)
10. [Monetisation Roadmap](#10-monetisation-roadmap)
11. [Non-Functional Requirements](#11-non-functional-requirements)
12. [Risk Register](#12-risk-register)

---

## 1. Product Overview

### Problem Statement

The professional world runs on reputation — but reputation is currently:
- **Self-reported** (LinkedIn, CVs) — anyone can claim anything
- **Isolated** (Upwork rating, Airbnb score, GitHub stars) — no single truth
- **Ephemeral** (reference calls) — verbal, unrecorded, not portable
- **Gated** (background checks) — expensive, slow, only used at hiring stage

The result: employers make million-rand hiring decisions on unverifiable information. Talented people without the right network or credentials are systematically shut out of opportunities. Fraud is endemic. And the actual graph of who worked with whom, who vouches for whom, and who genuinely has proven skills — exists but has never been mapped.

### Solution

Proofile is the verified professional trust graph. A living, publicly accessible record of what you've actually done, verified by the real people you did it with — replacing the CV as the primary professional identity document, and eventually replacing every platform's isolated reputation system with a single, portable trust score.

### The Journey Map We Own

```
DISCOVER IT → CLAIM IT → PROVE IT → SHARE IT → GET HIRED → BE TRUSTED → VERIFY OTHERS
     🔍            📝          ✓           🔗          💼            🔐              ⭐
Opportunity    Profile    Reviews     Sharing    Recruit API    Trust API      Verify
    Feed
```

> **GTM model — Jobs Wedge, Trust Core:** The Opportunity Feed is the front door — it draws in users who are actively job-seeking. The Trust Graph is the building — every meaningful and defensible value is created inside it. These are not competing models; they are acquisition and retention working in sequence.

### Core Principles
- **Proof over claims** — every signal on Proofile must be verifiable by a real person or a public data source
- **Portable reputation** — your trust score belongs to you, not to any single platform
- **The reviewer is as important as the review** — a review from a verified, high-score reviewer carries more weight. This is PageRank for people.
- **Infrastructure not product** — the consumer profile is the engine. The graph is the asset. The API is the business.
- **Democratise access** — a self-taught developer from Khayelitsha with 5 verified reviews should beat a titled graduate with none

---

## 2. User Personas

### Persona A — The Skilled Professional Locked Out (Primary)
- **Name:** Kagiso, 26, Johannesburg
- **Background:** Self-taught developer. Bootcamp graduate (WeThinkCode). 2 years freelance work. 800 GitHub contributions. No degree. No LinkedIn network of senior people.
- **Pain:** Gets filtered out before interviews because HR systems sort by degree. His real skills and work record are invisible. References are a phone call nobody makes.
- **Proofile value:** His verified reviews from 3 clients and 1 senior developer mentor + his GitHub signal = a credibility profile that bypasses the degree filter.

### Persona B — The Mis-hired Employer (B2B Primary)
- **Name:** Nomsa, 38, Cape Town
- **Role:** Head of Engineering at a 60-person SA tech company
- **Pain:** Hired someone with a stellar CV and LinkedIn profile. Four months in — they couldn't do the job. Reference check was a rubber stamp from a friend. Cost: 4 months salary + recruitment fee + team disruption.
- **Proofile value:** Proofile Recruit shows her candidates with verified reviews from real managers. She can see the actual graph — who this person really worked with, what those people actually said.

### Persona C — The Proud Manager (Viral Growth Engine)
- **Name:** Sipho, 42, Durban
- **Role:** CTO who has mentored and promoted dozens of developers over 15 years
- **Behaviour:** Takes genuine pride in the careers he's shaped. Informally vouches for former team members all the time — phone calls, WhatsApp messages, LinkedIn endorsements.
- **Proofile value:** ProofileSA gives him a public, permanent, credible place to put those vouches. When he vouches for someone on Proofile, his credibility transfers visibly. He becomes a node. His vouches become the most trusted signal on the platform.

### Persona D — The Marketplace / Platform (API Customer)
- **Company:** SA fintech offering freelancer payment services
- **Pain:** High fraud rate at onboarding. KYC is expensive. New users have no track record on their platform.
- **Proofile value:** Call the Proofile API at signup. Get a trust score. Instantly know if this user has a verified professional history — not just a phone number and ID.

### Persona E — The HR Manager Burned by Fake CVs
- **Name:** Lerato, 35, Johannesburg
- **Role:** HR Manager, 200-person financial services firm
- **Pain:** Manually checks qualifications and calls references for every hire. It takes weeks. Still gets fooled by sophisticated CV fraud.
- **Proofile value:** Proofile Verify (Phase 4) — paste a candidate's profile link, get instant verification of their claimed work history against the graph.

---

## 2.5 GTM Model — Jobs Wedge, Trust Core

> **The central strategic decision for Phase 1 launch.**

### The Dilemma

A trust graph is only valuable once it has density. But density requires users. Users require a reason to show up before the graph is dense.

The classic cold-start problem: *why would I create a profile and request reviews today, when the value I care about — getting hired, being discovered — requires many other people to have already done it?*

### The Resolution

**Use a curated Opportunity Feed as the acquisition wedge.**

The job seeker is the most motivated, frequent, and high-intent professional on the internet. They will sign up for a new platform immediately if it solves an urgent, daily problem. An attractive, curated feed of verified South African opportunities draws them in — today, with zero graph density required.

Once they arrive, the product structure converts that motivation into the graph-building behaviour Proofile actually needs:

```
User lands from the Opportunity Feed
         ↓
Apply to a role → prompted to complete profile first
         ↓
Profile complete → prompted to request at least 1 verified review
         ↓
Verified review on profile → unlocks "Top Applicant" signal
         ↓
"Top Applicant" visibility → stronger match ranking in feed
         ↓
Reviewer receives email → clicks through → leaves review
         ↓
Reviewer is invited to create their own profile
         ↓
Graph grows in both directions
```

### The Critical Guardrails

| Guardrail | Rule |
|---|---|
| Feed is never the investor value prop | We build a trust graph. The feed is GTM. |
| No job posting marketplace in Phase 1 | Curate and aggregate from external sources only |
| Apply flow is trust-gated | Cannot apply with zero profile — profile + 1 review request minimum |
| Feed ranking favours verified users | Proofile Score affects match visibility — incentivises graph participation |
| 70/30 product effort split | 70% on profile/review/score graph; max 30% on feed mechanics |
| Feed success metric is not views | The only feed metric that matters: feed visitor → review request sent conversion |

### The Activation Funnel

| Stage | Metric | Target |
|---|---|---|
| Feed visitor → signup | Conversion rate | 15%+ |
| Signup → profile complete | Activation | 60%+ |
| Profile complete → review request sent | Core behaviour | 50%+ |
| Review request → review completed | Trust loop | 40%+ |
| Verified user → opportunity applied | Engagement | 30%+ |
| Reviewer → new profile created | Viral coefficient | 20%+ |

**The test that confirms this is working:** If feed visitors are converting to verified reviewers at 8%+ within 30 days, the wedge is functioning. If they're browsing jobs and never touching their profile, you've built a job board. Watch that metric obsessively.

---

## 3. Phase 1 — ProofileSA

**Timeline:** Months 1–6
**Goal:** Prove that SA professionals will actively solicit verified reviews from real managers, colleagues, and clients — and that those reviewers will complete them. The Opportunity Feed is the acquisition mechanism that brings those professionals to the platform.

---

### 3.0 Opportunity Feed (Acquisition Wedge)

The Opportunity Feed is the first screen a new user sees. It is curated, not a marketplace. Proofile surfaces verified South African opportunities — real roles from employers and recruiters who meet a quality bar.

**What the feed shows:**
- Role title, company, location, type (full-time / contract / freelance)
- Proofile Match Score: how well this role fits the user's verified profile (visible once profile is set up)
- "X verified Proofile users have applied" — social proof within the graph
- Employer trust signal: whether the posting employer has verified hires via Proofile (Phase 2+)

**How the feed drives graph building:**

| Feed Interaction | Trust Behaviour Triggered |
|---|---|
| First login, no profile | Prompted: "Complete your profile to see your match score" |
| Profile complete, no reviews | Prompted: "Add a verified review to become a Top Applicant" |
| Apply clicked | Gated: must have profile + at least 1 review request sent |
| Apply submitted | Profile link shared with employer automatically |
| Match score improves | Notification: "Your match score for 3 roles increased — here's why" |

**Feed sourcing (Phase 1):**
- Manual curation of high-quality SA roles from partner employers and bootcamp hiring networks
- Integration with public SA job feeds (PNet, Indeed) as aggregated signals
- Phase 2: employer-posted opportunities directly on Proofile (with verification requirement)

**What the feed is NOT:**
- Not a job board — Proofile does not charge employers to post in Phase 1
- Not a marketplace — no bidding, no freelancer gig listings
- Not the core product — it is the acquisition channel for the trust graph

---

### 3.1 Profile Creation

| Requirement | Detail |
|---|---|
| Sign up | Email or Google OAuth |
| Profile fields | Full name, headline (e.g. "Backend Developer"), city, industry, profile photo, bio (300 chars) |
| Public URL | proofilesa.com/[username] — chosen at signup |
| Work history | Company name, role, start date, end date / current, brief description (200 chars) |
| Multiple entries | Unlimited work history entries |
| Edit anytime | Users can update all fields — changes are versioned, not deleted |
| Profile completeness | Visual indicator — "Your profile is 60% complete" prompts action |

### 3.2 Verified Review System

#### Review Request Flow
| Step | Detail |
|---|---|
| 1. Select entry | User selects a work history entry to request a review for |
| 2. Enter reviewer | Name + email of reviewer. Required: their relationship (managed me / colleague / client / mentored me) |
| 3. Send | System sends branded email with personal context |
| 4. Reviewer opens | No account required. One-click form. |
| 5. Review form | Relationship confirmation, star rating (1-5), written review (50–500 chars), skills endorsement (multi-select) |
| 6. Reviewer name | Full name and title displayed on review — no anonymity. This is a feature, not a bug. |
| 7. Published | Review appears on profile within seconds of submission |
| 8. Notification | Profile owner notified immediately |

#### Review Display
| Element | Detail |
|---|---|
| Reviewer identity | Full name, job title, company — all public |
| Verification badge | ✓ Verified (reviewer confirmed relationship) |
| Weight indicator | Reviews from high-Proofile-Score reviewers shown with subtle visual weight |
| Grouped by role | Reviews grouped under the work history entry they relate to |
| Overall rating | Aggregate star rating across all reviews — shown prominently |

#### Review Integrity Rules
- Reviewer cannot be the profile owner (blocked by email match)
- Same reviewer cannot review the same person twice for the same role
- Reviewer email domain checked against company domain where possible (flags mismatches)
- Reviews can be disputed — flagged for manual review by Proofile team
- Reviewer can update or retract a review — retraction is noted publicly ("This review was retracted by the reviewer")

### 3.3 Proofile Score (The PageRank for People)

**Version 1 (MVP) — Transparent Formula:**
```
Proofile Score = 
  (Average star rating × 30%)
  + (Number of verified reviews, capped at 20, normalised × 25%)
  + (Reviewer seniority score average × 25%)
  + (Profile completeness × 10%)
  + (Cross-platform signal bonus × 10%)
```

**Reviewer Seniority Score:**
- C-suite / Founder: 10 points
- Director / VP: 8 points
- Manager / Senior: 6 points
- Peer / Colleague: 4 points
- Client: 7 points
- Junior / Report: 3 points

*Seniority determined by reviewer's self-declared title — upgraded when reviewer has their own verified Proofile with high score*

**Why transparency matters:** Users must understand how to improve their score. Hidden algorithms breed distrust. Proofile's score is a coaching tool, not a black box.

### 3.4 Skills Verification

| State | Display | Requirement |
|---|---|---|
| Self-reported | "Python" (no badge) | User adds it themselves |
| Endorsed | "Python ✓ ×3" | 3+ reviewers selected it in their review |
| Highly Verified | "Python ✓✓ ×8" | 8+ reviewers, at least 2 senior-level |
| Platform Verified | "Python ⚡ GitHub: 1,200 contributions" | Cross-platform data confirms it |

**Standard Skill Library:**
- Technical: 200 pre-defined skills across engineering, data, design, product
- Business: 100 skills across sales, marketing, finance, operations, HR
- Soft skills: 50 skills (leadership, communication, etc.) — endorsable but always shown separately from technical skills
- Custom: User can add custom skills — shown as "Unverified Custom Skill" until endorsed

### 3.5 Cross-Platform Signals (MVP)

| Platform | Integration Method | Signal |
|---|---|---|
| GitHub | Public API (URL-based) | Years active, total contributions, top languages, public repos |
| LinkedIn | URL link only (Phase 1) | "Profile exists" — full integration Phase 2 |
| Portfolio/Website | URL link | Displayed as external link |
| Upwork | URL link (Phase 1) | Full integration Phase 2 |

### 3.6 Public Profile Features

| Feature | Detail |
|---|---|
| Public URL | proofilesa.com/[username] |
| Share button | Generates link + pre-written share message |
| QR code | Generated for every profile — for in-person use |
| OG image | Auto-generated preview card for WhatsApp, Twitter, LinkedIn sharing |
| Download | "Download as PDF" option — formats profile as a modern CV (Phase 1.5) |
| Privacy options | Public (indexed) / Link-only (not indexed) / Private (hidden) |

### 3.7 Phase 1 Success Criteria

**Trust Graph Metrics (primary — these prove the thesis):**

| Metric | 90-Day Target | 6-Month Target |
|---|---|---|
| Profiles created | 2,000 | 10,000 |
| Review requests sent | 5,000 | 25,000 |
| Review completion rate | 40%+ | 45%+ |
| Verified reviews published | 2,000 | 11,000 |
| Profiles shared externally | 30% | 40% |
| Reviewers who then create own profile | 20% | 30% |
| D30 retention | 30%+ | 40%+ |

**Acquisition Funnel Metrics (feed wedge health):**

| Metric | 90-Day Target | 6-Month Target |
|---|---|---|
| Feed visitors (unique) | 5,000/month | 25,000/month |
| Feed visitor → signup conversion | 15%+ | 20%+ |
| Signup → profile complete | 50%+ | 60%+ |
| Profile complete → review request sent | 40%+ | 50%+ |
| Feed-sourced users in verified review loop | 25%+ | 40%+ |

> **Red flag:** If feed visitor → review request conversion drops below 8%, the feed is generating passive browsers, not trust-graph participants. Audit the apply-gate flow immediately.

---

## 4. Phase 2 — Proofile Recruit

**Timeline:** Months 7–14
**Trigger:** 10,000 profiles with 30,000+ verified reviews in the graph
**Goal:** Monetise the hiring graph. Sell verified talent intelligence to SA employers and recruiters.

---

### 4.1 Recruiter Search

| Feature | Detail |
|---|---|
| Search by | Role, skill (verified only filter), city, industry, Proofile Score range |
| Sort by | Proofile Score, most verified, most recently active, closest match |
| Filter: verified only | Toggle to show only profiles with minimum N verified reviews |
| Graph view | "Show me who this candidate has worked with that I also know" — network overlap |
| Candidate card | Shows score, top verified skills, 1 review excerpt, reviewer names |
| Unlock full profile | Recruiter purchases access or uses subscription credits |

### 4.2 Hiring Graph Intelligence

This is the feature LinkedIn cannot replicate. Built from the graph assembled in Phase 1:

| Feature | Detail |
|---|---|
| Network overlap | "You know 3 people who have worked with this candidate directly" |
| Referral path | "Your colleague Nomsa managed this person at Takealot 2 years ago" |
| Company talent map | "These 12 verified candidates all came from Bash.com's engineering team" |
| Poaching alerts | Recruiters can set alerts when candidates from target companies become active |
| Trust chain | "This candidate was reviewed by someone you have hired before successfully" |

### 4.3 Pricing Model

| Tier | Price (per month) | Includes |
|---|---|---|
| Starter | R2,500 | 10 full profile unlocks, basic search |
| Growth | R7,500 | 40 unlocks, graph intelligence, email candidates |
| Scale | R15,000 | Unlimited unlocks, ATS integration, API access |
| Enterprise | Custom | White-label, bulk verification, dedicated support |

### 4.4 ATS Integration (Phase 2.5)

- Integrate with common SA ATS tools (BambooHR, Greenhouse, Workable)
- Recruiters can pull Proofile data directly into candidate profiles
- One-click "Request Proofile Verification" from within the ATS
- Webhook support for real-time updates when a candidate's score changes

### 4.5 Phase 2 Success Criteria

| Metric | Target (6 months post-launch) |
|---|---|
| Paying recruiter accounts | 50 |
| Monthly recurring revenue | R500,000 |
| Candidates contacted via Proofile | 1,000/month |
| Hires made via Proofile (tracked) | 50/month |
| Recruiter churn rate | < 10%/month |

---

## 5. Phase 3 — Proofile API

**Timeline:** Months 15–24
**Trigger:** 50,000 verified profiles. Proofile Score is trusted and understood in the market.
**Goal:** Become the trust infrastructure layer for any platform that needs to verify human identity and reputation.

---

### 5.1 The Trust Score API

Any platform can call the Proofile API with a user's email or Proofile ID and receive:

```json
{
  "proofile_score": 87,
  "score_confidence": "high",
  "verified_reviews": 8,
  "verified_employment_years": 4.5,
  "top_verified_skills": ["React", "Node.js", "Team Leadership"],
  "cross_platform_signals": {
    "github": { "active": true, "years": 3, "contributions": 1240 },
    "linkedin": { "verified": true }
  },
  "last_review_date": "2025-11-01",
  "profile_url": "https://proofile.com/kagiso"
}
```

### 5.2 Target API Customers

| Sector | Use Case | Willingness to Pay |
|---|---|---|
| Fintech / Lending | Creditworthiness signal for thin-file borrowers | Very High |
| Freelance platforms | Onboarding fraud reduction | High |
| Property / Rental | Tenant verification | High |
| Gig economy (delivery, rideshare) | Driver / worker verification | Medium |
| SaaS platforms | User identity confidence | Medium |
| Insurance | Risk assessment for business owners | High |
| B2B marketplaces | Supplier verification | High |

### 5.3 API Pricing

| Tier | Price | Volume |
|---|---|---|
| Startup | R500/month | 500 API calls/month |
| Growth | R2,000/month | 5,000 calls/month |
| Scale | R8,000/month | 50,000 calls/month |
| Enterprise | Custom | Unlimited + SLA |

### 5.4 Phase 3 Success Criteria

| Metric | Target |
|---|---|
| API customers | 30 |
| Monthly API revenue | R300,000 |
| API calls per month | 500,000 |
| Partner platform integrations | 10 |

---

## 6. Phase 4 — Proofile Verify

**Timeline:** Months 20–30
**Trigger:** API is proven. B2B relationships established with HR firms.
**Goal:** Become the standard pre-employment verification tool for SA businesses. Kill the fake CV.

---

### 6.1 Instant CV Verification

- HR manager receives a candidate's CV
- They paste candidate details (name + claimed work history) into Proofile Verify
- System cross-references against the graph:
  - Does a verified Proofile exist for this person?
  - Do their claimed roles match verified roles in the graph?
  - Are there red flags — gaps, mismatched companies, reviewer identity inconsistencies?
- Output: Verification report — Confirmed / Partially Confirmed / Flagged / No Data

### 6.2 Background Check Integration

- Partner with existing SA background check providers (MIE, Managed Integrity Evaluation)
- Proofile adds the social/reputation layer they don't have
- MIE confirms formal records (qualifications, criminal). Proofile confirms professional reality (did they actually do the work, do real people vouch for them).
- Combined offering sold to enterprise HR departments

### 6.3 Verification Report Pricing

| Product | Price |
|---|---|
| Single verification | R150 per candidate |
| Bulk (50+ per month) | R100 per candidate |
| Enterprise subscription | R10,000/month (unlimited) |

### 6.4 Phase 4 Success Criteria

| Metric | Target |
|---|---|
| Verifications per month | 5,000 |
| Enterprise subscribers | 20 |
| Monthly revenue (Verify product) | R750,000 |
| Fake CV detection rate | Measurable and publishable stat |

---

## 7. Phase 5 — Proofile Identity

**Timeline:** Months 30–48
**Trigger:** API trusted across multiple sectors. 200,000+ verified profiles.
**Goal:** Become the portable professional identity layer for Africa — and then the world.

---

### 7.1 Proofile Passport

- A user's complete, verified professional identity — portable across any platform
- One click: "Sign in with Proofile" — like Sign in with Google, but it brings your reputation with it
- Platform receives: verified identity + trust score + relevant professional context
- User controls exactly what each platform sees

### 7.2 Cross-Border Verification

- SA professionals working in or applying to opportunities in Kenya, Nigeria, Ghana, UK, UAE
- Proofile Passport recognised across borders — one verified record, globally readable
- Partner with international credential verification bodies for formal qualification layer

### 7.3 Proofile for Institutions

- Universities and bootcamps issue verified graduation credentials directly on Proofile
- Employers issue verified employment records directly (replacing reference letters)
- Government departments issue verified professional licences (engineers, doctors, lawyers)
- Proofile becomes the notarised professional record of African careers

### 7.4 Phase 5 Success Criteria

| Metric | Target |
|---|---|
| Verified profiles | 1,000,000+ |
| Countries active | 10+ African markets |
| "Sign in with Proofile" integrations | 100+ platforms |
| Monthly revenue (all streams) | R10,000,000+ |

---

## 8. Platform Architecture

### 8.1 Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend (MVP) | React PWA | Fast to ship, no App Store friction |
| Frontend (Phase 2+) | React Native | Native app when scale justifies |
| Backend | Node.js + Express | Full JS stack, fast iteration |
| Database | PostgreSQL (via Supabase) | Relational for graph edges, scalable |
| Graph database (Phase 2) | Neo4j or PostgreSQL recursive queries | Hiring graph traversal and relationship queries |
| Auth | Supabase Auth | Email + Google + future SSO |
| Email | Resend or Postmark | High deliverability for review request emails |
| GitHub API | Public REST API | Profile signal integration |
| OG Images | Vercel OG | Profile share cards |
| Search (Phase 2) | Algolia or Meilisearch | Fast skill and candidate search |
| API layer (Phase 3) | REST + GraphQL | Flexible for diverse API customers |
| Analytics | PostHog (self-hosted) | Full behavioural data ownership |
| Hosting | Vercel + Railway | Cheap, fast, scalable early |
| CDN | Cloudflare | Performance + DDoS protection |

### 8.2 Core Data Models

**User / Profile**
```
id, username, email, full_name, headline, city, industry,
bio, profile_photo_url, proofile_score, profile_visibility,
github_url, linkedin_url, portfolio_url, created_at, updated_at
```

**Work History Entry**
```
id, user_id, company_name, role_title, start_date, end_date,
is_current, description, created_at
```

**Review**
```
id, reviewer_email, reviewer_name, reviewer_title, reviewer_company,
reviewee_id, work_entry_id, relationship_type, star_rating,
written_review, endorsed_skills[], status (pending/published/retracted),
reviewer_proofile_id (nullable), created_at
```

**Skill**
```
id, user_id, skill_name, is_custom, endorsement_count,
verified_by_platforms[], created_at
```

**Review Request**
```
id, user_id, work_entry_id, reviewer_email, reviewer_name,
status (sent/viewed/completed/expired), sent_at,
reminder_sent_at, completed_at, token (unique link)
```

**Graph Edge (Phase 2)**
```
id, from_user_id, to_user_id, edge_type (managed/colleague/client/mentored),
company, period_start, period_end, weight, created_at
```

**API Key (Phase 3)**
```
id, organisation_id, key_hash, plan_tier, calls_this_month,
monthly_limit, created_at, last_used_at
```

### 8.3 The Graph Architecture

Phase 1 builds a relational database. Phase 2 adds graph traversal.

Every verified review creates a directed, weighted edge in the graph:
```
Reviewer → [relationship_type, weight, period] → Reviewee
```

Graph queries power:
- "Who do I know who knows this candidate?" (2-hop traversal)
- "Who are the most trusted nodes in the SA tech industry?" (PageRank)
- "Which companies produce the highest-score talent?" (node aggregation)
- "What is the trust chain between any two professionals?" (shortest path)

This graph is the moat. It cannot be replicated without the verified review data. It grows in accuracy and value with every new review.

---

## 9. The Graph Data Strategy

### 9.1 What We Collect and Why

| Data | Source | Value |
|---|---|---|
| Employment history (verified) | Work entries + review confirmation | Actual career graph |
| Manager/colleague relationships | Review relationship types | Hierarchy and peer graph |
| Skill endorsements | Reviewer endorsement | True skill distribution in SA workforce |
| Review sentiment | Written review text | Professional reputation signals |
| GitHub activity | Public API | Technical skill verification |
| Proofile Score over time | Calculated | Career trajectory modelling |
| Recruiter search queries | Platform usage | Market demand signals |
| Hire outcomes (Phase 2+) | Recruiter feedback | Ground truth for model accuracy |

### 9.2 Privacy and Ethics (Non-Negotiable)

- **POPIA compliant from day one** — no exceptions
- **Reviews are public and attributed** — the reviewer's name is always shown. Accountability is the integrity mechanism.
- **Users control their profile visibility** — public, link-only, or private
- **API data is aggregated and anonymised** — individual profiles are never sold via API without explicit user consent
- **Right to erasure** — users can delete their profile and all associated reviews. Reviewer's review is removed but the reviewer's identity is not retroactively hidden from their own history.
- **Dispute mechanism** — users can dispute any review. Disputed reviews are flagged pending investigation.

### 9.3 The Compounding Flywheel

```
More verified profiles
        ↓
Richer graph data
        ↓
More accurate Proofile Score
        ↓
More trusted by recruiters + platforms
        ↓
More valuable to job seekers
        ↓
More people create profiles + invite reviewers
        ↓
More verified profiles
```

Each loop makes the score more accurate, the graph more complete, and the platform more defensible.

---

## 10. Monetisation Roadmap

| Phase | Product | Model | Target Monthly Revenue |
|---|---|---|---|
| 1 | Free (build the asset) | — | R0 |
| 2 | Proofile Recruit | R2,500–R15,000/month SaaS | R500,000 |
| 3 | Proofile API | R500–R8,000/month + usage | R300,000 |
| 4 | Proofile Verify | R150/verification + enterprise | R750,000 |
| 5 | Proofile Passport / Identity | Platform licensing + enterprise | R5,000,000+ |
| All | Proofile Premium (individual) | R79/month | R500,000+ |

**Proofile Premium (individual) features:**
- See who viewed your profile
- Analytics: which skills are getting attention, which roles your profile is matching for
- Priority placement in recruiter searches
- Custom profile domain (kagiso.proofile.com)
- PDF export with Proofile branding and QR code
- API access for personal use (share your trust score with any platform)

---

## 11. Non-Functional Requirements

### Performance
- Profile page load: < 1.5 seconds
- Review submission (end to end): < 2 seconds
- API response time: < 200ms (p95)
- 99.9% uptime SLA (from Phase 3 onward)

### Security
- All data encrypted in transit (TLS 1.3) and at rest (AES-256)
- API keys hashed, never stored in plaintext
- Review request tokens are single-use and expire after 30 days
- Rate limiting on all public endpoints
- Penetration testing before Phase 3 API launch
- POPIA compliance audit annually

### Scalability
- Database designed for horizontal scaling from Phase 1
- Graph queries optimised before Phase 2 launch
- API infrastructure designed for 10x expected load from launch

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatible
- High contrast mode
- Low-bandwidth optimised (important for SA network conditions)

---

## 12. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Low review completion rate | Medium | Critical | Polish the review email. Make it take < 2 minutes. Test obsessively. |
| Fake reviews from friends | High | High | Email domain matching. Reviewer identity verification. Community flagging. Score weighting by reviewer credibility. |
| Employer legal challenges to public reviews | Low | High | Clear terms of service. Review dispute mechanism. Defamation policy with SA legal counsel. |
| LinkedIn builds this feature | Low | Medium | Network effect and data moat are the defence. LinkedIn is a US company that moves slowly. Speed is your advantage. |
| POPIA violation | Low | Critical | Legal review before launch. Privacy-by-design architecture. POPIA officer appointed at launch. |
| Low recruiter adoption (Phase 2) | Medium | High | Seed with 10 founding recruiter partners before public launch. Offer free trials. |
| Graph data too sparse to be useful | Medium | High | Don't launch Phase 2 recruiting until graph has minimum 30,000 verified edges. |
| Domain name (proofile.com) acquisition fails | Low | Low | ProofileSA operates independently. getproofile.com as fallback. Legal review of trademark before acquisition attempt. |

---

## Appendix: The Full Conspiracy — One Paragraph

ProofileSA launches as a free profile page — prettier and more credible than LinkedIn for people who actually have something to prove. Users invite their managers to leave verified reviews. Those managers get emails, click through, leave reviews — and then create their own profiles. The graph builds. The data accumulates. By the time Proofile has 50,000 verified profiles and 150,000 verified review edges, it has something no other company on the continent has: the actual, verified map of who worked with whom, who vouches for whom, and who genuinely has the skills they claim. That graph powers a recruiter product that makes LinkedIn Recruiter look like a keyword search. Then an API that every platform needing to trust a human being plugs into. Then a verification product that kills the fake CV industry. Then a passport that becomes the professional identity layer for Africa — and eventually for any market underserved by the Western credential system. Not a profile page. Not a job board. The trust infrastructure of professional Africa. That is the conspiracy.

---

*Document version: 1.0 — ProofileSA Founding Session*
*Operating name: ProofileSA until proofile.com + proofile.app domains acquired (~$10,000 budget)*
*Next document: Pitch Deck*
