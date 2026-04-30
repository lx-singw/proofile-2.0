# Proofile — MVP Scope
### The Smallest Thing That Proves Everything

> **Founding Principle:** We are not building a CV tool. We are building the verified trust and hiring graph of South Africa — starting with the one thing every professional already needs but nobody has made honest: proof that you actually did what you claim.

> **Brand note:** Operating as proofile.co.za, getproofile.com and getproofile.app until proofile.com and proofile.app domains are acquired (budgeted at ~$10,000). All architecture, branding, and product decisions are built for the Proofile global identity from day one.

---

## The One Question This MVP Must Answer

> *"Will South African professionals invite their real managers, colleagues, and clients to leave verified public reviews on their profile — and will those reviewers actually do it?"*

Everything in this MVP exists to answer that question. If yes — the graph builds itself. If no — we learn exactly where the friction is and fix it.

---

## The Core Insight (Say It Daily)

LinkedIn indexes what you **claim.**
Proofile indexes what you've **proven.**

A job title is a self-reported page.
A verified review from your actual manager is a backlink.
Backlinks beat self-reporting. Always.

This is PageRank for people.

---

## What Is In (Non-Negotiable Core)

### 1. The Proofile Profile
- User signs up and creates their professional profile
- Fields: Name, headline, city, industry, profile photo
- Work history entries: Company, role, start date, end date (or current), brief description
- Each work history entry has a "Request Review" button
- Profile has a public URL: proofile.co.za or getproofile.com/[username]
- Shareable as a link — designed to replace the PDF CV entirely

### 2. The Verified Review System
- User selects a work history entry and enters the email of a manager, colleague, or client
- System sends a branded review request email to that person
- Reviewer clicks the link — no account required to leave a review
- Review form: Relationship to reviewee (managed them / worked alongside / was their client), star rating (1–5), written review (50–500 characters), skills they can verify (multi-select from a list)
- Once submitted, review is marked "✓ Verified" on the profile
- Reviewer's name, title, and company are shown — they cannot be anonymous
- If the reviewer later creates their own Proofile, their review gains additional weight (verified identity = higher trust signal)

### 3. Proofile Score/Reputation/Ratings (v1)
A single number (0–100) visible on every profile. Calculated from:
- Number of verified reviews (volume)
- Average star rating across all reviews (quality)
- Seniority of reviewers (a CTO's review carries more weight than a peer's)
- Tenure length of verified roles (longer verified employment = more signal)
- Cross-platform verification bonus (GitHub, LinkedIn URL confirmed active)

This is the seed of the PageRank algorithm for people. Simple in MVP. Powerful as the data grows.

### 4. Skills Verification
- Standard skill tags (Node.js, Python, Project Management, Sales, Design, etc.)
- Skill is "verified" when at least one reviewer has endorsed it via their review
- Verified skills shown with a checkmark and reviewer count: "Node.js ✓ endorsed by 3 verified colleagues"
- Unverified skills shown in a separate section — still visible, clearly labelled as self-reported

### 5. Cross-Platform Signal Integration (Lightweight MVP Version)
- GitHub: User pastes their GitHub URL — system pulls public contribution stats (repos, commits, stars, years active). Displayed as a verified activity signal, not a self-reported claim.
- LinkedIn: User pastes LinkedIn URL — displayed as "profile exists" link for now. Full integration in Phase 2.
- No OAuth required for MVP — URL-based verification is enough to start

### 6. Public Profile & Sharing
- Every profile is public by default (can be set to link-only, not indexed)
- Designed to be beautiful when shared — open graph image generated for WhatsApp, Twitter, LinkedIn sharing
- "Share my Proofile" button generates a link + a pre-written message: "Instead of sending my CV, here's my verified professional record: [link]"
- QR code for in-person networking (printed on physical cards, shown on phone)

### 7. Review Request Management
- Dashboard showing all pending review requests
- Status: Sent / Viewed / Completed
- Reminder email auto-sent after 7 days if not completed
- User can resend or cancel any request
- Maximum 3 pending requests per work history entry (prevents spam)

### 8. Opportunity Feed (The Acquisition Wedge)

A curated feed of verified South African job opportunities — the first screen a new user sees, and the reason they sign up today before the trust graph has density.

**What it shows:**
- Role title, company, location, employment type
- Proofile Match Score (visible after profile completion — incentivises completing profile)
- Number of verified Proofile users who have applied (social proof)

**The apply gate (non-negotiable):**
Clicking Apply on any opportunity requires:
1. Profile at least 70% complete
2. At least one review request sent (not necessarily completed — the act of requesting matters)

This is not UX friction. This is the mechanism that converts job seekers into trust-graph participants.

**Feed sourcing in MVP:**
- Manual curation from partner employers, bootcamp hiring networks, and public SA job feeds
- No employer-pay-to-post model until Phase 2
- Proofile does not own the job listings — it surfaces, ranks, and gates the application flow

**Success metric for the feed:**
Not job views. Not applications submitted. The only metric that proves the feed is working:
> *Feed visitor → review request sent within 7 days: target 8%+*

---

## What Is Out (For Now — And Why)

| Feature | Why It's Out |
|---|---|
| Recruiter search / hiring dashboard | Needs a critical mass of profiles first. Phase 2. |
| ProofileAPI (trust score API) | Enterprise sales cycle. Phase 3. |
| Job posting marketplace | Proofile does not host raw employer job posts in Phase 1. The feed curates and aggregates from external sources. Employers cannot pay to post. |
| Feed replacing graph as core product | The Opportunity Feed is GTM only. If feed engagement metrics outpace review metrics in your weekly review, you've drifted. Rebalance immediately. |
| Salary data | Legal complexity. Phase 3+ |
| Video reviews | Technical overhead. Text reviews first. |
| Company profiles | Individual trust graph first. Companies second. |
| Mobile app (iOS/Android) | PWA first. Ship faster. |
| AI-generated profile suggestions | Phase 2. Core behaviour first. |
| Fake CV detection service (B2B) | Phase 2 — once we have enough data to power it |
| Payment / subscription | Free until 10,000 profiles. Growth before revenue. |

---

## The One Screen That Must Be Perfect

**The Review Request email.**

The user creates their profile on Proofile. That's easy — people love making profiles. The hard part is getting their manager to actually click the link and leave a review. If that email is weak, generic, or feels like spam — the graph never builds.

Requirements for this email specifically:
- Subject line must feel personal, not automated: "[Name] is asking you to verify their work at [Company]"
- Body explains clearly: what Proofile is, why it matters, that the reviewer's name will appear publicly (this signals seriousness)
- One clear CTA button: "Leave [Name] a review"
- Mobile-optimised — most reviewers will open on their phone
- Takes less than 3 minutes to complete — shown clearly ("This takes about 2 minutes")
- After submitting: reviewer sees a beautiful confirmation with the option to create their own profile

If only one thing gets polish before launch — it's this email and the review submission flow.

---

## Platform Decision

**Progressive Web App (PWA) — not native iOS/Android for MVP**

Same reasoning as Parcelicious:
- Faster to ship and iterate
- No App Store delays or approval uncertainty
- Users can install to home screen — feels native
- Switch to React Native in Phase 2

**Tech Stack Recommendation:**
| Layer | Technology |
|---|---|
| Frontend | React (PWA) |
| Backend | Node.js + Express or Supabase |
| Database | PostgreSQL |
| Auth | Supabase Auth (email + Google) |
| Email | Resend or Postmark (transactional, high deliverability) |
| GitHub API | Public REST API (no auth needed for public data) |
| Hosting | Vercel (frontend) + Railway (backend) |
| OG Image generation | Vercel OG or Cloudinary |
| Analytics | PostHog (self-hosted) |

---

## SA Market Context — Why This Is Urgent Here

**Problem 1 — Fake CVs**
Studies estimate 30%+ of CVs in South Africa contain false information — fabricated degrees, inflated titles, fake reference contacts. Employers know this and still cannot systematically solve it. ProofileSA makes a fake CV structurally impossible. You cannot fabricate a review from a real person with their own verified identity and their name publicly attached to it.

**Problem 2 — The Hidden Job Market**
70-80% of SA jobs are filled through networks and referrals. Talented people without the right connections — skilled developers from Soweto, designers from Durban who didn't go to the right university — are locked out. ProofileSA democratises access. A verified record of real work is more powerful than a network you were born into.

**Problem 3 — Degree Fetishism**
SA employers over-index on formal qualifications. A Wits CS dropout with 5 verified reviews from senior engineers and 800 GitHub contributions is more hireable than a degree holder with no proof of actual work. ProofileSA is the infrastructure that makes that argument provable, not just sayable.

---

## Target User (Be Specific)

**Primary — The Career Builder**
South African professional, 22–35, working in tech, marketing, finance, design, or creative industries. Has changed jobs at least once. Suspects their CV doesn't do them justice. Would love to show their real track record but has no credible way to do it. Already uses LinkedIn but knows it's a self-reported fiction.

**Secondary — The Hiring Manager**
HR manager or team lead, 28–45. Has been burned by a fake CV or a candidate who interviewed brilliantly but couldn't do the job. Would pay for a signal they could actually trust. Currently pays LinkedIn R8,000–R15,000/month and gets keyword matching, not truth.

**The Viral Growth User — The Proud Manager**
A manager who has built a great team and wants to publicly vouch for the people they've developed. When a manager leaves a review, they share it too — "I just verified [Name]'s work on ProofileSA — this person is exceptional." That's a two-sided viral loop.

---

## The Viral Mechanic

Unlike Parcelicious where the user posts content themselves, ProofileSA has a built-in two-sided viral loop:

```
User creates profile
       ↓
User invites manager to review them
       ↓
Manager receives email → completes review
       ↓
Manager sees their name publicly attached to a strong review
       ↓
Manager is proud → shares it → creates their own profile
       ↓
Manager now invites their own reviewers
       ↓
Graph grows in both directions
```

Every review request is a marketing touch for someone who has never heard of Proofile. The product markets itself through the review request email — every single time.

---

## Success Metrics for MVP (First 90 Days)

**Trust Graph Metrics (primary — these prove the thesis):**

| Metric | Target | What It Proves |
|---|---|---|
| Profiles created | 2,000 | Demand for the product |
| Review requests sent | 5,000 | Users believe in the value enough to ask |
| Review completion rate | 40%+ | The review flow is not too painful |
| Verified reviews published | 2,000+ | The graph is actually building |
| Profiles shared externally | 30% of users | People are using it as a CV replacement |
| Reviewers who create own profile | 20% | The viral loop works |
| D30 retention | 30%+ | People keep their profile updated |

**Acquisition Funnel Metrics (feed wedge health):**

| Metric | Target | What It Proves |
|---|---|---|
| Feed visitors (unique/month) | 5,000 | Feed is driving top-of-funnel |
| Feed visitor → signup | 15%+ | Feed has hook value |
| Feed visitor → review request sent (30 days) | 8%+ | Wedge is converting to core behaviour |

> **Red flag:** If feed views are high but review request conversion is below 8%, you have a job board, not a trust platform. Stop adding feed features and fix the apply gate.

---

## Launch Strategy (No Budget Required)

**Week 1 — The Founder's Story**
Post on LinkedIn and Twitter/X: "I'm a Wits CS dropout. My CV says that. But my GitHub has 500 contributions, two managers who'd vouch for me in a heartbeat, and clients who got results. The CV system can't show any of that. So I built something that can."

This is not marketing copy. This is your real story. It will travel.

**Week 1 (parallel) — Seed the Feed**
Before launch, secure commitments from 10–15 SA employers and hiring managers willing to share verified open roles. These do not need to be Proofile customers. They need to be real roles with real people behind them. The feed must not be empty on day one — an empty feed is an empty room, and nobody fills an empty room.

Post the first 20 curated opportunities manually. Prioritise roles in tech, design, and marketing — the sectors your founding 100 users work in. The feed and the founding profiles must overlap. If your first users don't see roles relevant to them, the wedge doesn't work.

**Week 2–4 — The Founding 100**
Personally reach out to 100 SA professionals with strong reputations but weak LinkedIn presence — developers active on GitHub, designers with good portfolios, marketers known by reputation. Offer them a founding profile. Help them set it up. Get their first reviews in place.

**Month 2 — The Manager Campaign**
Target SA hiring managers and team leads specifically. Proposition: "Your team's reputation is only as visible as their CVs. Give them something credible." When a manager publicly vouches for five people on ProofileSA, they become a node in the graph — and they bring their whole network.

**Month 3 — The Bootcamp & University Channel**
WeThinkCode, HyperionDev, CodeSpace, Umuzi — bootcamp graduates are exactly the people Proofile is built for. They have real skills and no formal credentials. Partner with bootcamps to offer every graduate a ProofileSA profile as part of their graduation package.

---

## Build Timeline (Realistic)

| Week | Milestone |
|---|---|
| 1–2 | Wireframes. Profile page and review form to pixel perfection. |
| 3–4 | Auth, profile creation, work history entries |
| 5–6 | Review request system — email sending, review submission form |
| 7 | Verified review display on profile. Proofile Score v1 calculation |
| 8 | Skills verification layer |
| 9 | GitHub signal integration (URL-based, public API) |
| 10 | Public profile, OG image generation, QR code |
| 11 | Review request dashboard (pending / completed / resend) |
| 12 | PWA packaging, performance, mobile optimisation |
| 13 | Soft launch — 100 founding profiles |
| 14–16 | Iterate, fix friction, prepare public launch |

---

## The Conspiracy Beneath the MVP

Nobody creating their profile in Phase 1 needs to know this. But you do.

Every verified review builds edges in a graph:
- Who managed whom (hierarchy)
- Who worked alongside whom (peer network)
- Who was a client of whom (market network)
- Which companies produce the most trusted talent
- Which skills are actually proven vs. which are claimed

By the time you have 10,000 verified profiles and 30,000 verified reviews, you have the most accurate map of professional South Africa ever assembled. Not the stated map (LinkedIn). The real one.

That graph is worth more than the profile product built on top of it.

You are not building a CV replacement. You are building the verified professional trust graph of South Africa — with a beautiful profile page as the trojan horse.

---

*Document version: 1.0 — Proofile Founding Session*
*Brand note: proofile.co.za, getproofile.com and getproofile.app  are the operating names until proofile.com + proofile.app domains are acquired*
*Next document: Product Requirements Document (PRD)*
