# 🎭 Dual-Experience Platform Strategy: One Platform, Two Souls

## 🎯 Vision
Proofile operates as a **bimodal platform** that seamlessly switches its "soul" based on the user's session state. This strategy maximizes **Acquisition** (Anonymous) and **Retention** (Authenticated) by tailoring every view to the user's current intent.

---

## 📍 Route Mapping Matrix

| Feature | Anonymous Route | Account User Route | Notes |
|---------|-----------------|-------------------|-------|
| **Jobs** | `/portal` (Browse All) | `/jobs` (Personalized Matches) | Different experience |
| **Job Detail** | `/portal/[id]` (External Apply) | `/opportunities/[id]` (Quick Apply) | Auth gates apply |
| **Profile** | `/p/[username]` (Public View) | `/profile` (Management) | Owner vs Viewer |
| **Ratings** | `/p/[username]#ratings` (View) | `/reputation` (Manage) | Auth-protected for management |
| **Tools** | Redirect → `/login` | `/tools` (Full Access) | Auth-protected |
| **Verification** | `/home#verification` (Value Prop) | `/verification` (Active Hub) | Auth-protected |
| **Resume** | Redirect → `/login` | `/resume/*` (Full Suite) | Auth-protected |
| **Settings** | Redirect → `/login` | `/settings` (Full Access) | Auth-protected |
| **Dashboard** | Redirect → `/login` | `/dashboard` (Analytics) | Auth-protected |

---

## 🔘 Click-by-Click User Flow

### 🟢 1. Anonymous (Guest) State: The Acquisition Flow
When a user lands on `/home` or `/portal` without an account.

#### A. Header (HomeHeader) Interactions
| Element | Action | Outcome |
|---------|--------|---------|
| **Proofile Logo** | Click | Refresh `/home` (Landing/Portal view) |
| **"Product" Dropdown** | Hover | Opens dropdown with Verification, Peer Ratings |
| **→ Verification** | Click | Smooth scroll to `/#verification` section |
| **→ Peer Ratings** | Click | Smooth scroll to `/#ratings` section |
| **"Jobs" (Briefcase)** | Click | Navigate to `/portal` (Browse all listings) |
| **"Companies"** | Click | Navigate to `/companies` (Directory) |
| **Theme Toggle** | Click | Switch Light/Dark/System modes |
| **"Sign In"** | Click | Navigate to `/login` |
| **"Get Started"** | Click | Navigate to `/start` (Onboarding wizard) |
| **Mobile Menu Button** | Click | Toggle mobile navigation panel |

#### B. Homepage (`/home`) Guest View Interactions
| Element | Action | Outcome |
|---------|--------|---------|
| **Hero "Create Free Profile" CTA** | Click | Navigate to `/start` |
| **Hero "Sign In" Secondary** | Click | Navigate to `/login` |
| **Trust Badge Pills** | View | Social proof (no action) |
| **Opportunity Filter Tabs** | Click | Filter job grid by category (Jobs/Gigs/Internships) |
| **"View All" Link** | Click | Navigate to `/portal` |
| **Job Card (Compact Variant)** | Click | Opens **Job Detail Side-panel** |
| **→ "Apply" Button** | Click | Triggers **AuthGateModal** ("Sign up to apply with your verified identity") |
| **→ "Save" (Heart Icon)** | Click | Triggers **AuthGateModal** ("Sign up to track your applications") |
| **→ Skill Tag** | Click | Filters job grid by that skill |
| **Filter Sidebar Checkboxes** | Toggle | Updates job grid results |
| **"Get Matched" CTA Card** | Click | Navigate to `/register` |
| **Footer Links (Product/Company)** | Click | Navigate to respective landing pages |

#### C. Portal Page (`/portal`) Interactions - Guest
| Element | Action | Outcome |
|---------|--------|---------|
| **Search Input (Job Title)** | Type + Enter | Submits search query, updates results |
| **Location Input** | Type + Enter | Filters by location |
| **"Search Jobs" Button** | Click | Executes search with all filters |
| **Quick Filter Tags ("Remote Jobs" etc)** | Click | Pre-fills filter and searches |
| **Work Type Checkboxes** | Toggle | Updates filter state, re-fetches jobs |
| **Experience Level Checkboxes** | Toggle | Updates filter state, re-fetches jobs |
| **Category Checkboxes** | Toggle | Updates filter state, re-fetches jobs |
| **"Clear All" Filters** | Click | Resets all filters to default |
| **Job Card** | Click | Navigate to `/portal/[slug]` (Job Detail) |
| **→ "Apply" Button (on card)** | Click | Navigate to `/portal/[slug]` |
| **Sort Dropdown** | Change | Re-sorts results (Most Recent/Highest Salary/Most Views) |
| **"Load More Jobs" Button** | Click | Appends next page of results |
| **"Create Free Account" CTA** | Click | Navigate to `/register` |
| **Footer "Create Free Account"** | Click | Navigate to `/register` |
| **Footer "Sign In"** | Click | Navigate to `/login` |

#### D. Job Detail Page (`/portal/[id]`) - Guest
| Element | Action | Outcome |
|---------|--------|---------|
| **Back Arrow** | Click | Navigate back to `/portal` |
| **"Apply Now" Primary CTA** | Click | Triggers **AuthGateModal** or external apply link |
| **"Save Job" Button** | Click | Triggers **AuthGateModal** |
| **Company Name Link** | Click | Navigate to `/companies/[slug]` |
| **Skill Tags** | Click | Navigate to `/portal?skill=[tag]` |
| **"Similar Jobs" Cards** | Click | Navigate to respective job detail |
| **Share Button** | Click | Opens native share dialog or copy link |

---

### 🔵 2. Account User (Authenticated) State: The Utility Flow
When a user is logged in and lands on `/home` (Smart Feed).

#### A. Header (HomeHeader) Interactions - Authenticated
| Element | Action | Outcome |
|---------|--------|---------|
| **Proofile Logo** | Click | Refresh `/home` (Smart Feed view) |
| **"Feed" (Dashboard Icon)** | Click | Navigate to `/home` (Active feed) |
| **"Matches" (Briefcase Icon)** | Click | Navigate to `/jobs` (Personalized AI matches) |
| **"Explore" (Compass Icon)** | Click | Navigate to `/explore` (Network & Trends) |
| **"Tools" (Zap Icon)** | Click | Navigate to `/tools` (Resume/AI/Verification toolkit) |
| **Theme Toggle** | Click | Switch Light/Dark/System modes |
| **Notifications Bell** | Click | Opens **Notification Side-panel** |
| **→ Notification Item** | Click | Navigate to relevant page (job/profile/message) |
| **→ "Mark All Read"** | Click | Clears notification badges |
| **User Avatar** | Hover/Click | Opens **User Dropdown Menu** |
| **→ Dashboard** | Click | Navigate to `/dashboard` |
| **→ Profile** | Click | Navigate to `/p/[username]` |
| **→ Settings** | Click | Navigate to `/settings` |
| **→ Sign Out** | Click | Clears session, redirects to `/home` (Guest view) |

#### B. Homepage (`/home` - Smart Feed) Interactions
| Element | Action | Outcome |
|---------|--------|---------|
| **UserProfileCard Avatar** | Click | Navigate to `/p/[username]` |
| **Trust Score Ring** | Click | Navigate to `/verification` |
| **"View Profile" Link** | Click | Navigate to `/p/[username]` |
| **"Generate from Profile"** | Click | Navigate to `/resume/build` |
| **"Upload & Analyze"** | Click | Navigate to `/resume/upload` |
| **"AI Build Resume"** | Click | Navigate to `/resume/ai-build` |
| **"View All Tools"** | Click | Navigate to `/tools` |
| **Live Activity User Name** | Click | Navigate to `/p/[clicked-username]` |
| **"Find Opportunities" CTA** | Click | Navigate to `/jobs` |
| **Feed Post "Like" Button** | Click | Toggles like state (API call) |
| **Feed Post "Comment" Button** | Click | Expands comment input/section |
| **Feed Post "Share" Button** | Click | Opens share dialog/menu |
| **Agentic Card "View Match"** | Click | Navigate to `/jobs/[id]` or `/opportunities/[id]` |
| **Agentic Card "Apply Now"** | Click | Opens **Quick Apply Modal** |
| **Agentic Card "Dismiss"** | Click | Removes card from feed (API call) |
| **Network Suggestion "Follow"** | Click | Sends follow request (API call) |
| **Network Suggestion "Connect"** | Click | Sends connection request (API call) |
| **Topic Tags** | Click | Navigate to `/explore?tag=[topic]` |

---

### 🟣 3. Jobs Experience (`/jobs`) - Authenticated Only
Personalized AI-powered job matching for logged-in users.

| Element | Action | Outcome |
|---------|--------|---------|
| **Match Score Ring (per card)** | View | Shows AI-calculated match percentage |
| **Job Card** | Click | Navigate to `/opportunities/[id]` |
| **"Quick Apply" Button** | Click | Opens **Quick Apply Modal** (pre-filled with profile) |
| **"Save" Heart Icon** | Click | Adds to Saved Jobs (API call) |
| **"View Saved Jobs" Link** | Click | Navigate to `/opportunities/saved` |
| **Filter by Match Score Slider** | Drag | Filters to jobs above threshold |
| **"AI Recommendations" Tab** | Click | Shows Hunter Agent top picks |
| **"All Jobs" Tab** | Click | Shows full personalized feed |
| **"Run Gap Analysis"** | Click | Navigate to `/opportunities/[id]/gap-analysis` |

---

### 🟠 4. Verification Center (`/verification`) - Authenticated Only

| Element | Action | Outcome |
|---------|--------|---------|
| **Trust Score Ring** | View | Displays overall verification score |
| **"History" Button** | Click | Navigate to `/verification/history` |
| **"Identity" Button** | Click | Navigate to `/verification/identity` |
| **"Public Profile" Button** | Click | Navigate to `/p/[username]` |
| **Email Verification Slot** | Click | Opens **VerificationModal** (type: email) |
| **→ "Verify" Button** | Click | Sends OTP to email |
| **→ OTP Input → Submit** | Click | Validates OTP, updates verification status |
| **Phone Verification Slot** | Click | Opens **VerificationModal** (type: phone) |
| **→ "Verify" Button** | Click | Sends OTP to phone |
| **Employment Verification Slot** | Click | Opens **EmploymentVerificationModal** |
| **→ "Add Employment"** | Click | Opens form to add job history entry |
| **→ "Request Peer Verification"** | Click | Sends request to peer (API call) |
| **PeerVerificationHub Card** | Click | Navigate to pending verification detail |
| **"Manage all verifications in Settings"** | Click | Navigate to `/settings?tab=verification` |

---

### 🔴 5. Tools Hub (`/tools`) - Authenticated Only

| Element | Action | Outcome |
|---------|--------|---------|
| **"My Resumes" Header Button** | Click | Navigate to `/resume` |
| **"Verification" Header Button** | Click | Navigate to `/verification` |
| **"AI Resume" Header Button** | Click | Navigate to `/resume/ai-build` |
| **Resume Tool Card "Generate from Profile"** | Click | Navigate to `/resume/build` |
| **Resume Tool Card "Upload & Analyze"** | Click | Navigate to `/resume/upload` |
| **Resume Tool Card "AI Build New Resume"** | Click | Navigate to `/resume/ai-build` |
| **My Resumes List Item** | View | Shows resume name and last updated date |
| **→ "Download" Icon** | Click | Triggers PDF export (API call) |
| **→ "Delete" Icon** | Click | Confirms and deletes resume (API call) |
| **→ "Edit" Link** | Click | Navigate to `/resume/build?id=[id]` |
| **"Manage All" Link** | Click | Navigate to `/resume` |
| **Career Tool "Job Matching"** | Click | Navigate to `/jobs` |
| **Career Tool "Skills Assessment"** | Click | Navigate to `/dashboard/verification` |
| **Career Tool "Get Verified"** | Click | Navigate to `/dashboard/verification` |

---

### 🟤 6. Resume Suite (`/resume/*`) - Authenticated Only

#### A. Resume Builder (`/resume/build`)
| Element | Action | Outcome |
|---------|--------|---------|
| **Section Add Buttons** | Click | Adds new section (Experience/Education/Skills) |
| **Drag Handle (Section)** | Drag | Reorders resume sections |
| **"Import from Profile" Button** | Click | Auto-populates from Proofile data |
| **"Save Draft" Button** | Click | Saves current state (API call) |
| **"Preview" Button** | Click | Opens live preview panel |
| **"Export PDF" Button** | Click | Generates and downloads PDF |
| **Template Selector** | Click | Changes resume template/theme |

#### B. Resume Upload (`/resume/upload`)
| Element | Action | Outcome |
|---------|--------|---------|
| **Dropzone** | Drop/Click | Opens file picker, uploads PDF/DOCX |
| **"Analyze Resume" Button** | Click | Sends to AI analysis (navigate to results) |
| **Analysis Score Card** | View | Shows overall resume score and breakdown |
| **"Improve This Section" Button** | Click | Opens AI suggestion modal for that section |

#### C. AI Resume Builder (`/resume/ai-build`)
| Element | Action | Outcome |
|---------|--------|---------|
| **Job Description Paste Area** | Paste | Pre-fills target job for optimization |
| **"Generate Resume" Button** | Click | Navigate to `/resume/ai-build/processing` |
| **Processing Page** | View | Shows AI generation progress (redirects on complete) |
| **Review Page "Accept" Button** | Click | Saves AI-generated resume |
| **Review Page "Edit" Button** | Click | Navigate to `/resume/build?id=[id]` |

---

### ⚫ 7. Profile Management (`/profile` & `/p/[username]`)

#### A. Public Profile View (`/p/[username]`) - Viewer Perspective
| Element | Action | Outcome (Guest) | Outcome (Account User) |
|---------|--------|-----------------|------------------------|
| **"Endorse" Button** | Click | **AuthGateModal** | Opens endorsement form |
| **"Send Message" Button** | Click | **AuthGateModal** | Opens message composer |
| **"Connect" Button** | Click | **AuthGateModal** | Sends connection request |
| **Trust Score Badge** | Click | Shows verification tooltip | Same |
| **Skills Tags** | Click | Navigate to `/explore?skill=[tag]` | Same |
| **Employment History Item** | View | Displays verified status badge | Same |

#### B. Profile Edit (`/profile/edit`) - Owner Only
| Element | Action | Outcome |
|---------|--------|---------|
| **Avatar Upload** | Click | Opens file picker, uploads image |
| **"Update Profile" Button** | Click | Saves all changes (API call) |
| **"Copy Public Link" Button** | Click | Copies `/p/[username]` to clipboard |
| **"Request Endorsement" Button** | Click | Navigate to `/reputation/request` |
| **Bio Text Area** | Type | Updates bio (saved on submit) |
| **Add Experience Button** | Click | Opens experience form modal |
| **Add Education Button** | Click | Opens education form modal |
| **Remove Entry Button** | Click | Deletes entry after confirmation |

---

### ⚪ 8. Settings Hub (`/settings`)

| Element | Action | Outcome |
|---------|--------|---------|
| **Tab: Account** | Click | Shows account settings |
| **→ "Change Password"** | Click | Opens password change form |
| **→ "Delete Account"** | Click | Opens destructive confirmation modal |
| **Tab: Notifications** | Click | Shows notification preferences |
| **→ Email Toggles** | Toggle | Updates preferences (API call) |
| **→ Push Toggles** | Toggle | Updates preferences (API call) |
| **Tab: Privacy** | Click | Shows privacy settings |
| **→ Profile Visibility Toggle** | Toggle | Public/Private profile (API call) |
| **→ "Export My Data"** | Click | Triggers background job for data export |
| **Tab: Linked Accounts** | Click | Shows connected OAuth providers |
| **→ "Connect LinkedIn"** | Click | Opens OAuth popup |
| **→ "Disconnect [Provider]"** | Click | Removes connection (API call) |
| **Tab: Payments** | Click | Navigate to `/settings/payments` |

---

### 🟨 9. Dashboard (`/dashboard`) - Authenticated Only

| Element | Action | Outcome |
|---------|--------|---------|
| **Quick Stats Cards** | View | Shows profile views, job matches, trust score |
| **"Refresh Data" Button** | Click | Re-syncs external sources (LinkedIn/GitHub) |
| **Pinned Feature Card "Configure"** | Click | Opens **Customization Modal** |
| **→ Pin/Unpin Feature Toggles** | Toggle | Updates dashboard layout preferences |
| **"View Performance"** | Click | Navigate to `/dashboard/performance` |
| **"View Analytics"** | Click | Navigate to `/analytics` |
| **Recent Activity List Item** | Click | Navigate to relevant item (job/profile/notification) |

---

## 🏛️ Architectural Foundations

1. **Global Session-Aware Header (`HomeHeader`)**: Orchestrates navigation based on `isAccountUser` state.
2. **StateAwareWrapper**: Utility component to toggle sections between Guest (Hero) and User (Feed) views.
3. **AuthGateModal**: Universal high-conversion prompt that gates sensitive actions for guests.
4. **Quick Apply Modal**: Pre-filled application form for authenticated users.
5. **Protected Route Pattern**: `/tools`, `/resume/*`, `/verification`, `/settings`, `/dashboard` redirect to `/login?redirect=[path]` when accessed as guest.

---

## 🏗️ Implementation Phases

- [x] **Phase 1**: Header & Root Unification (Session-aware HomeHeader)
- [ ] **Phase 2**: Page Duality (Guest vs User content on `/home`)
- [ ] **Phase 3**: Interaction Gates (AuthGateModal on Apply/Save/Endorse)
- [ ] **Phase 4**: Guest Intent Persistence (Local storage → Sync post-auth)
- [ ] **Phase 5**: Analytics Tracking (Funnel: Guest View → Gate → Auth → Conversion)


---

## 📱 Mobile Experience Strategy

### 1. Navigation Differences
The mobile viewing experience shifts from a top-heavy header to a bottom-thumb navigation pattern for authenticated users.

| Feature | Desktop/Tablet | Mobile App-Like View |
|---------|----------------|----------------------|
| **Navigation** | Sticky Top Header | **Bottom Tab Bar** (Home, Jobs, Explore, Network, Profile) |
| **Search** | Expanded Header Bar | Condensed "Search" Tab or Floating Action Button |
| **Menu** | Avatar Dropdown | "Profile" Tab → Settings Icon (Top Right) |
| **Agents** | Always-visible Sidebar | **Agent Status Widget** (Collapsible Top Sheet) |

#### Mobile Bottom Nav Interactions (Authenticated)
| Tab Icon | Action | Outcome |
|----------|--------|---------|
| **Home (Home)** | Tap | Scroll to Top of Feed / Refresh |
| **Jobs (Briefcase)** | Tap | Navigate to `/portal` (Guest) or `/jobs` (User) |
| **Explore (Search)** | Tap | Navigate to `/companies` (Directory) |
| **Network (Users)** | Tap | Navigate to `/network` (Connections & Suggestions) |
| **Profile (User)** | Tap | Navigate to own profile tab (Self-view) |

### 2. Gesture Controls
- **Feed Swipe**: Swipe Left/Right on Agent Cards to "Dismiss" or "Save".
- **Modal Close**: Pull-down gesture on full-screen modals.
- **Image Gallery**: Horizontal swipe on company photo carousels.

---

## 🤖 AI Agent Interaction Flows

### 1. Hunter Agent (The Job Finder)
The persistent "co-pilot" for opportunities.
- **Trigger**: "Auto-apply" enabled or manual "Find Matches".
- **Status Indicator**: Green Pulse (Active Searching) vs Solid (Idle).
- **Notification**: "Hunter found 3 new matches" (Push/Toast).

| Interaction | UI Element | Outcome |
|-------------|------------|---------|
| **Activate Hunter** | Toggle Switch (Sidebar) | State changes to `active`, detailed log appears |
| **Review Match** | "Why this match?" Link | Expands **Match Reasoning** (Skills overlap, Culture fit) |
| **Feedback Loop** | Thumbs Up/Down | Refines preference vector (Improve future matches) |

### 2. Tailor Agent (The Resume Optimizer)
The on-demand writer.
- **Trigger**: Clicking "Tailor Resume" on a specific Job Card.
- **Process**:
    1.  **Drafting**: Spinner "Analyzing keywords..."
    2.  **Preview**: Shows Diff View (Original vs Tailored).
    3.  **Action**: "Save as New Version" or "Apply with this Version".

### 3. Agent Action Bar (In-Feed)
Context-aware buttons appearing on high-match cards.

| Button | Action | Visual Feedback |
|--------|--------|-----------------|
| **Draft Cover** | Click | Agent typing indicator → Opens Cover Letter Modal |
| **Tailor Resume** | Click | Sparkles animation → Directs to Resume Builder with job context |
| **research_company** | Click | Opens side-panel with scraped company insights (News, Funding) |

---

## 🔔 Feedback & Notifications Plan

### 1. Toast System (Immediate Feedback)
Standardized feedback for user actions.

| Action Category | Example | Toast Type | Message Pattern |
|-----------------|---------|------------|-----------------|
| **Success** | Saved Job | `success` (Green) | "Job saved to your dashboard" |
| **Agent** | Tailor Complete | `agent` (Purple) | "Tailor Agent finished optimizing your resume" |
| **Error** | Network Fail | `error` (Red) | "Could not save changes. Try again." |
| **Info** | Copy Link | `info` (Blue) | "Profile link copied to clipboard" |

### 2. Loading States & Skeletons
- **Feed Loading**: 3-card skeleton shimmer (Title + Image placeholder).
- **Match Score**: Spinner inside ring → Animates from 0% to Score%.
- **Button Action**: Replaced by `Loader2` spinner icon, button disabled.

---

## 📊 Key Metrics to Track

| Metric | Description |
|--------|-------------|
| **Gate Trigger Rate** | % of guests who click gated actions (Apply/Save/Endorse) |
| **Gate Conversion Rate** | % of gate triggers that result in signup |
| **Auth Drop-off** | % who abandon at login/register page |
| **Intent Completion Rate** | % who complete original action post-auth |
| **Time to First Match** | Time from signup to first AI job match viewed |
