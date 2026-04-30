# Proofile — The Feed
### Comprehensive Development Plan

> **The Feed is not a job board. It is a mirror. It reflects your verified professional worth back at you — and surfaces opportunities calibrated to your actual signal, not your stated one. It works for everyone, from anonymous first visitor to fully verified power user. No walls. No gates. Just increasing signal quality as you prove more about yourself.**

---

## Table of Contents
1. [Core Philosophy](#1-core-philosophy)
2. [The Anonymous-First Principle](#2-the-anonymous-first-principle)
3. [Feed Architecture](#3-feed-architecture)
4. [The Signal Stack](#4-the-signal-stack)
5. [The Match Card — Core UX Unit](#5-the-match-card--core-ux-unit)
6. [The Four Feed States](#6-the-four-feed-states)
7. [The Algorithm — Phase by Phase](#7-the-algorithm--phase-by-phase)
8. [Content Strategy — What Lives In The Feed](#8-content-strategy--what-lives-in-the-feed)
9. [The Addiction Loop](#9-the-addiction-loop)
10. [Data Sourcing Strategy](#10-data-sourcing-strategy)
11. [Technical Specification](#11-technical-specification)
12. [Personalisation Engine](#12-personalisation-engine)
13. [The Upgrade Moment — Not A Wall, A Window](#13-the-upgrade-moment--not-a-wall-a-window)
14. [Feed Analytics & Success Metrics](#14-feed-analytics--success-metrics)
15. [Build Roadmap](#15-build-roadmap)

---

## 1. Core Philosophy

### The Three Laws of the Proofile Feed

**Law 1 — Show, Don't Gate**
The feed is fully functional for anonymous users. No account required to scroll. No popup blocking the content. No "sign up to see more" wall after 3 cards. The feed earns the signup — it does not demand it.

**Law 2 — The Feed Is A Mirror, Not A Catalogue**
LinkedIn shows you job listings. Indeed shows you job listings. Proofile shows you a reflection of your verified professional worth — and opportunities that match that worth precisely. The product isn't the listing. It's the insight.

**Law 3 — The Graph Drives Everything**
Every feed decision — what to show, in what order, with what context — is powered by the verified trust graph. For anonymous users, the graph is inferred from behaviour. For verified users, it is known. The feed gets smarter as the graph gets richer. That is the moat.

---

## 2. The Anonymous-First Principle

### Why Anonymous Must Work Completely

Every great consumer product earns the user before it asks anything of them.

- TikTok shows you a full, functioning feed before you have an account
- Google returns results before you log in
- YouTube plays videos before you sign up

The moment you block an anonymous user, you've communicated: *"We need you more than you need us."* That is fatal for a new product competing in any space where established alternatives exist.

For Proofile specifically, anonymous functionality is even more critical because our target users — SA professionals, bootcamp graduates, PJC students — are often discovery-mode browsers. They heard about the platform, they're checking it out, they're not ready to commit. The feed has 90 seconds to make them believers.

### What Anonymous Users Get — Everything

| Feature | Anonymous | Logged In (No Reviews) | Verified (1+ Reviews) |
|---|---|---|---|
| Browse full feed | ✅ | ✅ | ✅ |
| Infinite scroll | ✅ | ✅ | ✅ |
| See match cards with full detail | ✅ | ✅ | ✅ |
| See "Why this might match you" | ✅ (inferred) | ✅ (profile-based) | ✅ (graph-based) |
| Save/bookmark opportunities | ❌ → prompt | ✅ | ✅ |
| See salary data | ✅ | ✅ | ✅ |
| See who's hiring | ✅ | ✅ | ✅ |
| Express interest | ❌ → prompt | ✅ | ✅ |
| See your match strength | ❌ (shown as potential) | ✅ (partial) | ✅ (full) |
| Receive personalised feed | ✅ (behaviour-based) | ✅ (profile-based) | ✅ (graph-based) |
| See Proofile Score of other applicants | ❌ | ✅ | ✅ |
| Contact recruiter directly | ❌ | ❌ | ✅ (Score 75+) |

**The rule:** Anonymous users see everything. They just can't act on it. Acting requires identity. Identity creates the graph.

### The Anonymous Session Engine

Before a user creates an account, Proofile builds a behavioural profile in-session:

- Which cards they pause on (>3 seconds = interest signal)
- Which cards they scroll past quickly (negative signal)
- Which salary ranges they linger on
- Which industries and roles appear repeatedly in their session
- Which skills appear across the cards they engage with most

This session data is stored anonymously (cookie/local storage) and used to personalise the feed within the same session. When they sign up — the session data is merged into their account. Their feed is already personalised before they've told us a single thing about themselves.

This is the same mechanic TikTok uses. You don't tell TikTok what you like. It watches what you do for 10 minutes and then it knows.

---

## 3. Feed Architecture

### The Feed Is Not A List. It Is A Stream.

Architecturally, the feed is a real-time stream of scored opportunity cards, powered by a multi-signal ranking engine. It is not a database query sorted by date. It is a continuously-updated ranked list where each card's position is determined by its relevance score for the current viewer — whether anonymous or verified.

```
┌─────────────────────────────────────────────────┐
│                  FEED ENGINE                    │
│                                                 │
│  Opportunity Pool (sourced, cleaned, scored)    │
│              ↓                                  │
│  Viewer Signal Stack (anonymous or verified)    │
│              ↓                                  │
│  Ranking Algorithm (weighted multi-signal)      │
│              ↓                                  │
│  Feed Stream (personalised, infinite)           │
│              ↓                                  │
│  Match Card (rendered with context layer)       │
└─────────────────────────────────────────────────┘
```

### Feed Composition (What's Actually In The Stream)

The feed is not 100% job listings. That would be a job board. The feed is a **mixed content stream** — like TikTok mixing tutorials, entertainment, and ads — except every content type serves the core mission of showing you your verified professional worth.

| Content Type | % of Feed | Purpose |
|---|---|---|
| Opportunity Cards (jobs, contracts, projects) | 60% | Core product — the hook |
| Trust Insight Cards | 15% | "You rank in top 20% for this skill in SA" |
| Graph Discovery Cards | 10% | "Someone you know works here" |
| Market Intelligence Cards | 10% | "Average salary for your profile is R65k" |
| Community Proof Cards | 5% | "This person just got hired with a similar profile" |

Each non-job card type reinforces the core Proofile value: **your verified worth, made visible.** None of them are filler. Each one is a data point that makes the feed feel like a mentor, not a search engine.

---

## 4. The Signal Stack

The signal stack is the collection of data points that power personalisation. Different users have different signal depths. The feed works at every depth.

### Layer 0 — Session Signals (Anonymous)
Available immediately. No account required.
- Scroll velocity (how fast they pass each card)
- Dwell time per card (milliseconds)
- Card type engagement (jobs vs insights)
- Category patterns (which roles/industries appear in engaged cards)
- Salary range patterns (what ranges they linger on)
- Location (inferred from IP — city level only)
- Device type (mobile vs desktop — affects card complexity)
- Time of day (job browsing at 2am signals something different from 9am)

### Layer 1 — Profile Signals (Logged In, No Reviews)
Available after account creation. Takes 5 minutes to generate.
- Stated role and industry
- Listed skills (unverified — used weakly)
- Location (stated — used strongly)
- Work history entries (company names, role levels, tenure)
- Education (used as context, not filter)
- Profile completeness score (higher = richer signal)

### Layer 2 — Verified Signals (1+ Reviews)
Available after first verified review. The graph begins.
- Verified skills (what reviewers confirmed)
- Verified role levels (what managers described)
- Reviewer seniority (a CTO's review recalibrates the entire signal)
- Tenure authenticity (dates confirmed by real people)
- Proofile Score (the aggregate — used as a percentile rank)
- Soft skills (leadership, communication — verified by reviewers)

### Layer 3 — Graph Signals (3+ Reviews, Multiple Relationships)
Available when the graph has enough edges to traverse.
- Who in the user's verified network works at which companies
- Which companies have hired people with similar verified profiles
- Which roles people with similar trust graphs have moved into
- Which skills co-occur with career advancement in the graph
- Trust propagation (a review from a high-score reviewer carries more weight)

### Layer 4 — Behavioural Graph Signals (Long-term)
Built from feed interaction history over time.
- Expressed interest patterns (which opportunities they engage with)
- Rejection patterns (which they skip — informs negative filtering)
- Conversion data (what kind of cards lead to profile completion actions)
- Time-of-day engagement patterns
- Salary sensitivity (where is their threshold)

---

## 5. The Match Card — Core UX Unit

The Match Card is the atomic unit of the feed. Every design and development decision for the feed flows from getting this card right. It is the thing that makes Proofile feel different from the first scroll.

### Anatomy of a Match Card

```
┌──────────────────────────────────────────────────┐
│  [Company Logo]  Bash.com                    🔖  │
│                  Senior Backend Engineer          │
│                  Johannesburg · Remote-Friendly   │
│                  R65,000 – R80,000/month          │
├──────────────────────────────────────────────────┤
│  WHY YOU'RE SEEING THIS                          │
│  ✓ Node.js — verified by 5 people in your graph  │
│  ✓ 2 of your reviewers have worked here          │
│  ✓ Your profile beats 78% of past applicants    │
├──────────────────────────────────────────────────┤
│  MARKET CONTEXT                                  │
│  📊 Avg salary for this role in SA: R71,000      │
│  👥 12 people expressed interest this week       │
│  ⏱  Posted 2 days ago · Closes in 12 days       │
├──────────────────────────────────────────────────┤
│  [Express Interest]        [Tell me more →]      │
└──────────────────────────────────────────────────┘
```

### Card States By User Type

**Anonymous User Card:**
```
WHY YOU'RE SEEING THIS (based on your browsing)
~ This role matches your apparent interest in 
  backend development roles
~ Salary range aligns with what you've engaged with
~ Sign in to see your real match strength →
```

**Logged In (No Reviews) Card:**
```
WHY YOU'RE SEEING THIS
✓ Node.js listed on your profile
⚠ Unverified — get a review to strengthen this match
~ Your match strength: Potential (not yet proven)
  Add a verified review to unlock your real score →
```

**Verified User Card:**
```
WHY YOU'RE SEEING THIS
✓ Node.js — verified by 5 colleagues
✓ 2 of your reviewers worked at this company
✓ Your Proofile Score: 87 — beats 78% of applicants
  Your match strength: STRONG ●●●●○
```

### The "Why You're Seeing This" Layer

This is the feature that has never existed in any job product. Every card explains itself. No black box. No "because you applied to similar jobs." Specific, honest, verifiable reasons — sourced from the trust graph.

For anonymous users, the explanation is behavioural: *"Based on what you've browsed."*
For profile users, it's stated: *"Based on your listed skills."*
For verified users, it's proven: *"Based on what your managers confirmed."*

This transparency is not just good UX. It is the core product message delivered silently with every single card. By the 10th card, the user understands the difference between stated and verified — and they want to be verified.

### Card Interaction Model

- **Swipe right / tap Express Interest** — "I'm open to this"
- **Swipe left / tap Not for me** — negative signal, improves future ranking
- **Tap Tell me more** — expands card to full opportunity detail
- **Long press / hold** — quick-save without committing to interest
- **Share** — share the opportunity card to WhatsApp, Twitter, email
- **Tap company logo** — company profile page (all Proofile data on that company)

Every interaction feeds the algorithm. Every swipe is a data point. Every "not for me" is as valuable as every "express interest" — because knowing what someone doesn't want is as important as knowing what they do.

---

## 6. The Four Feed States

### State 1 — The Anonymous Feed ("Cold Start")

**Who:** A first-time visitor. No account. No cookies.

**What they see:** A curated, SA-market feed of high-quality opportunities across all industries. No personalisation yet — but high production quality. Beautiful cards. Real salaries. Real companies. The feed looks and feels like it knows things.

**The goal:** Make them scroll. Make them find something interesting. Make them think: *"Wait, this is different."*

**How it works:** The anonymous feed is not random. It is editorially curated by the team in early days, then algorithm-ranked by aggregate engagement signals — which cards do anonymous users engage with most? This is the same approach Reddit used early on — editors seeded the best content until the algorithm could take over.

**The hook:** Within the first 10 cards, every visitor should encounter:
- At least one opportunity in their inferred interest area
- At least one salary data point that surprises them
- At least one Trust Insight card that explains what Proofile is without explaining it

### State 2 — The Behavioural Feed ("Warming Up")

**Who:** A user who has been browsing for 3+ minutes in the same session.

**What they see:** A feed that is visibly shifting based on what they've engaged with. The cards start to feel like they're reading their mind. Role types narrow. Salary ranges tighten. Industry focus sharpens.

**The goal:** Make them feel seen before they've said a word. Make creating an account feel like confirming what the platform already knows.

**The trigger moment:** After 5–7 minutes of anonymous browsing, one card appears:

```
┌──────────────────────────────────────────────────┐
│  🔍 We're learning your taste                    │
│                                                  │
│  Based on what you've browsed, you seem to be    │
│  interested in backend development roles in      │
│  Johannesburg, paying R55k–R75k.                │
│                                                  │
│  Is that right?  [Yes, keep going]  [No, adjust]│
│                                                  │
│  Sign in to save this + get your real           │
│  match strength on every card →                  │
└──────────────────────────────────────────────────┘
```

This is not a signup wall. They can tap "Yes, keep going" and continue browsing anonymously. But many won't — because the card demonstrated something valuable and they want more of it.

### State 3 — The Profile Feed ("Getting Real")

**Who:** Logged-in user with a profile but no verified reviews yet.

**What they see:** Personalised feed based on their stated profile. Match cards now show their potential match strength — but with a consistent honest signal that potential ≠ proven.

**The goal:** Make the difference between "potential" and "proven" feel tangible and worth acting on.

**The mechanic:** Every match card for a profile user shows two numbers:

```
Your match strength: ░░░░░ POTENTIAL
Get 1 verified review → unlock your real score
```

The empty bars are not a punishment. They are an invitation. The user can see the structure of what they're missing — and it feels achievable, not arbitrary.

**The Trust Nudge Card** — appears every 8th card in the feed:

```
┌──────────────────────────────────────────────────┐
│  💡 Your match strength is unproven              │
│                                                  │
│  Recruiters see 340 applicants for roles like   │
│  yours this week. 12 have verified reviews.     │
│  Those 12 get contacted first.                  │
│                                                  │
│  It takes one email to your manager.            │
│  [Request a review now →]                       │
└──────────────────────────────────────────────────┘
```

Data-driven. Specific. No guilt — just consequence.

### State 4 — The Verified Feed ("The Real Mirror")

**Who:** Logged-in user with 1+ verified reviews and a growing Proofile Score.

**What they see:** The full Proofile feed experience. Every card has the complete "Why You're Seeing This" layer powered by real graph data. Match strength is real, not potential. Salary positioning is specific. Network overlaps are shown.

**The goal:** Make this feel like having a brilliant recruiter friend who knows everyone and tells you the truth.

**What makes this state addictive:**
- The feed updates as reviews come in — a new review from a senior person can shift the entire feed calibration overnight
- "You now rank in the top 12% of SA Node.js developers" cards appear when the score crosses thresholds
- New opportunities surface that weren't visible before because the match strength now qualifies
- The feed becomes a live dashboard of the user's career trajectory — not just a list of jobs

---

## 7. The Algorithm — Phase by Phase

### Phase 0 — Editorial Algorithm (Months 1–3)

**Honest assessment:** With under 1,000 users and limited graph data, a sophisticated ML algorithm would be trained on noise. Don't pretend otherwise. Do something smarter.

**The approach:** Human-curated signals + simple rules engine.

Rules:
1. Show opportunities matching inferred/stated location first
2. Within location, rank by engagement rate (clicks + dwell time from all users)
3. Insert Trust Insight and Market Intelligence cards every 5th position
4. Deprioritise opportunities with no salary listed (low signal quality)
5. Rotate out opportunities older than 30 days
6. Boost opportunities from companies with claimed Proofile profiles (they're invested)

**The data flywheel starts here.** Every anonymous scroll, every click, every "not for me" is feeding the system. By Month 3 you have enough signal to train the first real model.

### Phase 1 — Collaborative Filtering (Months 4–9)

**The approach:** Users who engage similarly get similar feeds.

"People who paused on the same 5 cards as you also engaged heavily with these 8 cards you haven't seen yet."

This is how early Netflix worked before it had enough viewing history for deep personalisation. It's robust, explainable, and works with modest data volumes.

**Signals used:**
- Card engagement patterns (dwell, click, swipe direction)
- Expressed interest history
- Profile similarity (stated role, industry, location)
- Session length and return frequency

### Phase 2 — Graph-Powered Ranking (Months 10–18)

**The approach:** The verified trust graph starts driving rankings.

For verified users:
- Opportunities at companies where verified reviewers work bubble up
- Roles that match verified skills (not stated) rank higher
- Proofile Score percentile used to filter out reach opportunities (prevents discouragement) and underestimated opportunities (prevents underselling)

**The Undervalue Detection Model:**
```
If user's Proofile Score percentile > role's typical applicant score percentile
AND user's verified salary history < role's salary range floor
→ Flag as "You may be undervaluing yourself" card type
→ Boost rank significantly
```

This is the model that tells someone they're worth more than they think. This is the feature that gets shared on Twitter.

### Phase 3 — Predictive Graph Algorithm (Month 18+)

**The approach:** Predict career trajectory. Show opportunities not just for where you are — but where your graph says you're going.

"People with your verified profile at your career stage typically move into these roles within 18 months. Here's what the path looks like and which companies are currently hiring for it."

This shifts the feed from reactive (here are jobs matching your current profile) to proactive (here is your next chapter, mapped). Nobody has built this. It's possible only because the trust graph contains longitudinal career data — not just snapshots, but trajectories.

---

## 8. Content Strategy — What Lives In The Feed

### Opportunity Cards (60%)

**Sources (Phase 1 — no employer partners yet):**
- Aggregated from public listings: LinkedIn, Indeed, PNet, Careers24, Glassdoor SA
- Scraped and normalised into Proofile's format
- Salary data enriched from market data where missing
- Deduplicated across sources
- Quality-scored (companies with no salary listed, no company information, or bot-pattern postings are filtered out)

**Sources (Phase 2 — employer partners):**
- Direct employer postings on Proofile
- ATS integrations (Greenhouse, Workable) pushing verified-applicant-only postings
- Premium employer profiles with curated opportunity streams

**Quality floor:** No opportunity appears in the feed without: company name, role title, location, salary range (or "competitive — enquire"), and at least one skill tag.

### Trust Insight Cards (15%)

Data-driven insights about the user's verified position in the professional market. These are the cards that make the feed feel like more than a job board.

Examples:
```
"Your verified Node.js skill ranks in the top 15% 
of SA developers on Proofile. Roles requiring it 
pay an average of R68,000 in Johannesburg."

"You've been in your current role level for 2+ years.
Professionals with your verified profile typically 
move up within 24 months. Here's what that looks like."

"3 companies that hired someone with your exact 
verified skill set in the last 90 days."

"The most in-demand skill among your verified peers 
right now: System Design. 4 people with your profile 
just added it."
```

### Graph Discovery Cards (10%)

Surfaces the hidden trust network — the connections and company relationships the user has through their verified graph.

Examples:
```
"Nomsa Dlamini, who reviewed your work at Bash.com, 
recently connected to a Takealot engineering lead 
on Proofile. Takealot is hiring backend engineers."

"2 people in your verified network work at this 
company. You didn't know — now you do."

"This role was just posted by a company that has 
hired 3 people from WeThinkCode in the last year."
```

### Market Intelligence Cards (10%)

SA-specific professional market data, surfaced in context.

Examples:
```
"SA's highest-paying backend roles right now — 
and what verified skills they require."

"Remote-friendly companies actively hiring in SA 
this month: 47. Up 12% from last month."

"Average time from application to offer for 
senior developer roles in Johannesburg: 18 days.
Your current Proofile Score gets you through 
initial screening 3x faster than unverified profiles."
```

### Community Proof Cards (5%)

Anonymised social proof from the Proofile community. The human face of the graph.

Examples:
```
"A backend developer in Johannesburg with 6 verified 
reviews just moved from R52k to R78k using Proofile."

"This week, 34 SA professionals expressed interest 
in roles that matched their verified Proofile signals."

"A WeThinkCode graduate with 4 verified reviews 
landed a senior role this week. No degree. 
Just proof."
```

These are anonymised. No names without explicit opt-in. The point is not the individual — it's the pattern.

---

## 9. The Addiction Loop

What makes TikTok addictive is not the content. It is the **variable reward schedule.** Sometimes the next card is boring. Sometimes it's exactly what you needed. You keep scrolling because you don't know which it will be. That unpredictability is neurologically compelling.

Proofile's variable reward schedule:

```
Scroll → job card (expected)
Scroll → job card (expected)
Scroll → INSIGHT CARD: "You rank top 15% in SA for this skill"
         (unexpected, personally relevant, shareable)
Scroll → job card (expected)
Scroll → GRAPH CARD: "Someone who reviewed you works here"
         (unexpected, actionable, creates urgency)
Scroll → job card (expected)
Scroll → MARKET CARD: "Average salary for your profile is R15k 
         more than you're earning"
         (unexpected, emotionally charged, immediately actionable)
```

Every 5–7 cards, something unexpected and personally relevant appears. The user doesn't know when. That uncertainty keeps them scrolling.

**The second addiction mechanic — progression.**

Unlike TikTok where each session is self-contained, Proofile feeds have state. Your Proofile Score is visible in the feed header. Every verified review that comes in triggers a feed refresh. The feed literally changes as your professional credibility grows.

This means users have a reason to come back that has nothing to do with new job listings. They come back to see if their score improved. They come back to see what new opportunities opened up. They come back because the feed is a live measure of their professional worth and that number can move.

---

## 10. Data Sourcing Strategy

### Phase 1 — Aggregate and Enrich (No Employer Partners)

**The approach:** Proofile doesn't need employer relationships to launch a compelling feed. We aggregate from public sources and add a Proofile intelligence layer on top.

**Sources:**
- LinkedIn Jobs (public listings, scrape-compliant)
- Indeed SA
- PNet
- Careers24
- OfferZen (SA tech focused)
- Glassdoor SA
- Company career pages (direct scraping of major SA employers)

**The normalisation pipeline:**
1. Ingest raw listing data
2. Deduplicate (same role posted on multiple platforms)
3. Normalise structure (company, role, location, salary, skills, date)
4. Enrich salary (where missing, use market data from similar roles)
5. Quality score (filter out low-signal listings)
6. Skill tag extraction (NLP on job description to extract required skills)
7. Map to Proofile's skill taxonomy (standardise "NodeJS" = "Node.js" = "Node JS")
8. Publish to feed engine

**Data freshness:** Pipeline runs every 6 hours. Stale listings (>30 days, no activity) are retired from the feed but retained in the database for market intelligence.

### Phase 2 — Direct Employer Relationships (Month 6+)

Once Proofile has 10,000+ verified profiles, the employer proposition changes:

*"Post on Proofile and your listing is only shown to candidates with at least one verified review. Every applicant has been vouched for by a real person. No CV spam. No keyword matching. Just verified candidates."*

This is a premium product. Direct postings surface higher in the feed (clearly labelled as "Direct posting"). Employers get applicant Proofile Scores. They pay for this access.

**Phase 2 employer pricing:**
- Standard posting: R2,500/listing (30 days)
- Verified-only posting: R5,000/listing (shown only to users with 1+ reviews)
- Talent pool access: R15,000/month (search + reach out directly)

### Phase 3 — The Graph as Source (Month 12+)

By Phase 3, the graph itself becomes a sourcing mechanism. When the trust graph shows that a cluster of verified professionals have the skills a growing company needs — Proofile can proactively suggest to that company that a talent pool exists. The company doesn't post a job. They browse a pre-qualified pool and reach out.

This inverts the traditional recruitment model entirely. Talent finds opportunity. Not the other way around.

---

## 11. Technical Specification

### Feed Backend Architecture

```
┌─────────────────────────────────────────────────────┐
│                  FEED SERVICE                       │
├─────────────────────────────────────────────────────┤
│  Opportunity Ingestion Pipeline                     │
│  ├── Source connectors (LinkedIn, Indeed, PNet...)  │
│  ├── Normaliser + Deduplicator                      │
│  ├── NLP skill extractor                            │
│  ├── Quality scorer                                 │
│  └── Feed pool writer → PostgreSQL                  │
├─────────────────────────────────────────────────────┤
│  Ranking Engine                                     │
│  ├── Signal aggregator (session + profile + graph)  │
│  ├── Scoring model (Phase 0: rules, Phase 2: ML)    │
│  ├── Feed composer (mixes card types per rules)     │
│  └── Ranked feed writer → Redis (cache)             │
├─────────────────────────────────────────────────────┤
│  Feed API                                           │
│  ├── GET /feed (paginated, cursor-based)            │
│  ├── POST /feed/signal (interaction tracking)       │
│  ├── GET /feed/card/:id (single card expansion)     │
│  └── POST /feed/interest (express interest)         │
├─────────────────────────────────────────────────────┤
│  Session Service                                    │
│  ├── Anonymous session creation + cookie            │
│  ├── Behavioural signal collector                   │
│  ├── Session → account merge on signup              │
│  └── Session store → Redis                          │
└─────────────────────────────────────────────────────┘
```

### Feed Frontend Architecture

**Infinite scroll implementation:**
- Cursor-based pagination (not offset — prevents duplicate cards on re-render)
- Pre-fetch next page when user is 5 cards from bottom
- Skeleton loading cards shown during fetch (never a spinner blocking content)
- Virtual list rendering (only render cards in viewport + 3 above/below)
- Cards not in viewport are unmounted to preserve memory on mobile

**Scroll performance targets:**
- First card visible: < 800ms on 4G
- Subsequent page load: < 400ms (pre-fetched)
- Card render: < 16ms (60fps scroll)
- Interaction response (swipe, tap): < 100ms

**Offline handling:**
- Last 20 cards cached locally
- "You're offline — showing your saved feed" state
- Graceful degradation — feed shows, interactions queue for when connection returns

### Card Interaction Tracking

Every interaction is tracked in real time and fed back to the ranking engine:

```javascript
// Signal types tracked per card
{
  card_id: string,
  user_id: string | null,        // null for anonymous
  session_id: string,
  signal_type: 
    'view'           |           // card entered viewport
    'dwell_3s'       |           // stayed in viewport 3+ seconds
    'dwell_10s'      |           // stayed 10+ seconds
    'expand'         |           // tapped "tell me more"
    'interest'       |           // tapped express interest
    'dismiss'        |           // swiped/tapped "not for me"
    'save'           |           // bookmarked
    'share'          |           // shared
    'scroll_past'    ,           // in viewport < 1 second
  timestamp: number,
  feed_position: number,         // which position in the feed
  card_type: string,             // opportunity | insight | graph | market
  session_duration_at_signal: number  // how long they've been on the feed
}
```

### Database Schema (Feed-Specific)

**Opportunities Table**
```sql
id              uuid primary key
source          text (linkedin | indeed | pnet | direct)
source_id       text (original listing ID for deduplication)
company_name    text
role_title      text
location        text
remote_type     text (onsite | hybrid | remote | flexible)
salary_min      integer (ZAR monthly)
salary_max      integer (ZAR monthly)
salary_visible  boolean
required_skills text[] (normalised skill tags)
description     text
quality_score   float (0–1)
engagement_rate float (updated continuously)
posted_at       timestamptz
expires_at      timestamptz
is_direct       boolean (employer posted directly vs aggregated)
created_at      timestamptz
updated_at      timestamptz
```

**Feed Signals Table**
```sql
id              uuid primary key
session_id      text
user_id         uuid (nullable — null for anonymous)
opportunity_id  uuid (nullable — null for non-opportunity cards)
card_type       text
signal_type     text
feed_position   integer
timestamp       timestamptz
```

**User Feed State Table**
```sql
user_id         uuid primary key
last_seen_cursor text
dismissed_ids   uuid[]
saved_ids       uuid[]
inferred_roles  text[]
inferred_salary_min integer
inferred_salary_max integer
inferred_location   text
feed_version    integer (incremented when signal model updates)
updated_at      timestamptz
```

---

## 12. Personalisation Engine

### The Match Strength Score

For each (user, opportunity) pair, the engine calculates a match strength score (0–100):

**For anonymous users:**
```
Match Strength = 
  Location match (inferred vs listing)    × 30%
  Role category match (browsing signals)  × 40%
  Salary range overlap (browsing signals) × 30%
```

**For profile users (unverified):**
```
Match Strength =
  Location match                          × 20%
  Stated skills overlap                   × 30%
  Role level match                        × 25%
  Industry match                          × 15%
  Tenure pattern match                    × 10%
```

**For verified users:**
```
Match Strength =
  Verified skills overlap                 × 35%
  Proofile Score vs role percentile       × 25%
  Graph proximity (reviewer network)      × 20%
  Location match                          × 10%
  Career trajectory fit                   × 10%
```

### The Undervalue Detection Model

One of Proofile's most powerful and unique feed signals:

```
If:
  user.verified_skill_percentile > role.typical_applicant_percentile + 15
  AND user.current_salary_estimate < role.salary_min × 0.9
  
Then:
  Flag card as "You may be undervaluing yourself"
  Boost feed rank by 2× 
  Show special card variant with insight:
  "Your verified profile outperforms 78% of typical 
   applicants for this role — but you may be 
   underpaid by ~R18,000/month"
```

This model requires salary data (from receipt of verified profile data and market intelligence). It is the feature that creates genuine emotional impact — and drives shares and referrals more than any other single card type.

### The Stale Feed Prevention System

A common feed failure mode: users see the same cards repeatedly and disengage. Proofile prevents this with:

- **Diversity enforcement:** No more than 2 cards from the same company in any 20-card window
- **Seen-card filtering:** Cards already viewed (dwell > 3s) are deprioritised for 7 days
- **Freshness injection:** 20% of each feed page is "discovery" cards — outside the user's apparent comfort zone, slightly higher or different than their typical engagement pattern
- **Score-change triggers:** When a user's Proofile Score changes (new review received), their full feed is recalculated and refreshed

---

## 13. The Upgrade Moment — Not A Wall, A Window

The philosophy: never block. Always show the user what is possible on the other side of an action — and make that action feel immediate, achievable, and worth it.

### Moment 1 — The Save Prompt (Anonymous → Logged In)

**Trigger:** Anonymous user taps bookmark on a card.

**Response (not a wall):**
```
┌──────────────────────────────────────────────┐
│  💾 Save this opportunity                    │
│                                              │
│  Create a free account to save this and     │
│  get personalised matches based on your     │
│  actual profile.                             │
│                                              │
│  [Create account — takes 30 seconds]        │
│  [Continue browsing without saving]  ←      │
└──────────────────────────────────────────────┘
```

The "continue browsing" option is always visible. They are never trapped.

### Moment 2 — The Interest Prompt (Logged In → Verified)

**Trigger:** Unverified user taps "Express Interest."

**Response:**
```
┌──────────────────────────────────────────────┐
│  ✋ One thing first                          │
│                                              │
│  Recruiters at Bash.com require at least    │
│  1 verified review before reviewing         │
│  your application.                           │
│                                              │
│  This protects their time — and yours.      │
│  It takes 2 minutes to request a review.   │
│                                              │
│  [Request a review now →]                   │
│  [Save for later — remind me]               │
└──────────────────────────────────────────────┘
```

The framing is not "you are blocked." It is "this is how you get taken seriously." The requirement is positioned as professional gatekeeping that protects them — not a platform restriction.

### Moment 3 — The Score Upgrade Prompt (Verified → High Score)

**Trigger:** User has 1 review but sees "Top Applicant" label on someone else's card.

**Response:** A persistent but non-intrusive feed card:
```
┌──────────────────────────────────────────────┐
│  ⭐ Top Applicant status: 2 reviews away     │
│                                              │
│  Users with a Proofile Score of 70+ are    │
│  labelled "Top Applicant" — and contacted  │
│  directly by recruiters 4× more often.     │
│                                              │
│  You have 1 verified review. You need 3.   │
│  [Request another review →]                 │
└──────────────────────────────────────────────┘
```

Progress framing. Specific target. Immediate action. No guilt.

---

## 14. Feed Analytics & Success Metrics

### Feed Health Metrics (Monitored Daily)

| Metric | Target (Month 3) | Target (Month 6) | Why It Matters |
|---|---|---|---|
| Anonymous session length | 4+ minutes | 7+ minutes | Feed is compelling before signup |
| Anonymous → account conversion | 8% | 15% | Feed earns the signup |
| Cards per session (anonymous) | 15+ | 25+ | Scroll depth = engagement |
| Cards per session (verified) | 30+ | 50+ | Verified users more invested |
| D7 return rate | 25% | 40% | Feed has ongoing pull |
| D30 return rate | 15% | 30% | Long-term habit forming |
| "Express interest" rate | 3% of views | 6% of views | Feed relevance |
| "Not for me" rate | 10–20% | 10–20% | Healthy signal (too low = passive, too high = irrelevant) |
| Verified review requests triggered by feed | 500/month | 2,000/month | Feed driving core behaviour |
| Score-threshold upgrades triggered by feed | 100/month | 500/month | Feed driving graph growth |

### Algorithm Quality Metrics (Monitored Weekly)

| Metric | Target | What It Indicates |
|---|---|---|
| Match card click-through rate | > 8% | Relevance of ranked cards |
| "Why you're seeing this" expansion rate | > 20% | Users trust and want to understand the signal |
| Insight card share rate | > 5% | Content is genuinely valuable |
| Undervalue detection card CTR | > 15% | Emotional impact and relevance |
| Feed satisfaction (in-app survey, monthly) | 4.2+/5 | Overall experience |

### Business Impact Metrics (Monitored Monthly)

| Metric | Month 6 Target | Month 12 Target |
|---|---|---|
| Feed-driven profile completions | 1,000 | 5,000 |
| Feed-driven review requests | 2,000 | 10,000 |
| Feed-driven employer discoveries | 50 | 300 |
| Direct posting revenue (feed-driven) | R25,000 | R200,000 |
| Employer inquiries from feed visibility | 10 | 75 |

---

## 15. Build Roadmap

### Sprint 1–2 (Weeks 1–4): Feed Foundation

- Opportunity ingestion pipeline (3 sources: PNet, Careers24, OfferZen)
- Basic opportunity normalisation and deduplication
- PostgreSQL schema for opportunities, signals, user feed state
- Simple rules-based ranking engine (location + quality score)
- Feed API: GET /feed (cursor-based), POST /feed/signal
- Anonymous session creation and cookie management
- Basic Match Card component (no "Why you're seeing this" layer yet)
- Infinite scroll frontend (virtual list, pre-fetch)

**End of Sprint 2 deliverable:** An anonymous user can open Proofile and scroll a real SA job feed infinitely. Cards are real, salaries are real, the scroll is smooth.

---

### Sprint 3–4 (Weeks 5–8): The Card Experience

- "Why you're seeing this" layer — anonymous version (behavioural signals)
- Session-based personalisation engine (dwell, scroll, category inference)
- All 5 card types built: opportunity, insight, graph, market, community
- Card interaction model (swipe, expand, save, dismiss, share)
- The behavioural "We're learning your taste" trigger card
- Skeleton loading states (no spinners)
- Mobile-optimised card layout (tested on low-end Android)

**End of Sprint 4 deliverable:** The feed feels smart. Anonymous users who browse for 5 minutes see a visibly personalising feed and encounter insight cards that surprise them.

---

### Sprint 5–6 (Weeks 9–12): Account Integration

- Session → account merge on signup (behavioural data carries over)
- Profile-based personalisation (stated skills, location, role level)
- Profile user match card variant ("potential" state)
- The upgrade moments: save prompt, interest prompt
- "Not for me" negative signal implementation
- Bookmark/save feed (logged in users)
- Notification: "A new opportunity matches your profile"

**End of Sprint 6 deliverable:** The full anonymous-to-logged-in funnel works smoothly. Users who create accounts immediately see a better feed than they had anonymously.

---

### Sprint 7–8 (Weeks 13–16): Graph Integration

- Verified user match card variant (full "Why you're seeing this")
- Proofile Score percentile integration into ranking engine
- Verified skill matching (not just stated skills)
- Graph proximity cards ("someone who reviewed you works here")
- Top Applicant label for Score 70+ users
- Undervalue detection model (v1 — simple threshold-based)
- Score change → feed refresh trigger
- Feed header Proofile Score display (live, updates with new reviews)

**End of Sprint 8 deliverable:** Verified users experience the full Proofile feed. The difference between anonymous, unverified, and verified is felt, not just stated.

---

### Sprint 9–10 (Weeks 17–20): Intelligence Layer

- Market Intelligence cards with real SA salary data
- Community Proof cards (anonymised success stories)
- SA Trust Index content integration (feed cards from monthly index)
- Collaborative filtering model (Phase 1 algorithm) 
- A/B testing framework for card ranking experiments
- Feed analytics dashboard (internal)
- Employer direct posting integration (first 5 employer partners)

**End of Sprint 10 deliverable:** The feed is a full product. The algorithm is learning. The first employer partners are live. The feed is ready for public launch.

---

### Post-Launch: Continuous Optimisation

- Weekly algorithm tuning based on engagement data
- Monthly card type ratio experiments
- Quarterly model retraining (collaborative filtering → graph-powered)
- Employer partner expansion (target: 50 direct posting partners by Month 6)
- Undervalue detection model refinement as graph data grows
- Predictive career trajectory model (Phase 3 — Month 18+)

---

## Appendix: The Feed's Role In The Full Proofile Conspiracy

The feed is the front door. But it is also the engine room.

Every anonymous scroll generates signal that trains the algorithm. Every signup triggered by the feed adds a node to the graph. Every review request made urgent by the feed adds an edge. Every employer who discovers Proofile through a candidate's application becomes a potential B2B customer.

The feed does not just acquire users. It builds the graph. And the graph is what makes Proofile irreplaceable.

By Month 12, the Proofile feed will know more about the SA professional market — in verified, graph-powered detail — than any job board, any recruiter, and any LinkedIn search. Not because we asked people to tell us. Because we watched what they did, verified what they proved, and organised what was always there but never visible.

That is the PageRank moment. And the feed is where it happens.

---

*Document version: 1.0 — Proofile Feed Development Plan*
*Core principle: Anonymous users get everything. Verification unlocks truth, not access.*
