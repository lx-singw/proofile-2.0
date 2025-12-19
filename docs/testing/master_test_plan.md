# Proofile Master Test Plan & User Journeys

This document outlines the comprehensive test strategy for Proofile, organized by User Journey. It covers the lifecycle of a user from anonymous explorer to power user, ensuring all key features and integrations work as expected.

## 🟢 Phase 1: The Anonymous Explorer (Public Access)
**Goal:** Verify that public-facing pages are accessible, performant, and drive conversion without requiring login.

### 1.1 Landing Page (`/`)
- [ ] **Load & Performance:** Page loads under 2s. Hero section animations play smoothly.
- [ ] **Responsiveness:** Layout adapts to Mobile (stacked), Tablet, and Desktop.
- [ ] **Navigation:** Header links work (Features, Jobs, Sign In).
- [ ] **CTA:** "Get Started" / "Join Now" buttons redirect to `/register`.

### 1.2 Job Portal (`/portal`)
- [ ] **Job Listing:**
    - [ ] Displays list of active jobs (populated via scrapers).
    - [ ] Infinite scroll or pagination loads more jobs.
    - [ ] Job cards show key info (Title, Company, Location, Salary).
- [ ] **Search & Filter:**
    - [ ] Keywords filter results dynamically.
    - [ ] Filters for Location, Remote, and Category work.
    - [ ] "Clear Filters" resets the view.
- [ ] **Job Details (`/portal/[id]` or `/portal/[slug]`):**
    - [ ] Page loads with correct job details from URL.
    - [ ] "Apply" button logic:
        - [ ] **Guest:** Opens "Create Account to Apply" modal.
        - [ ] **Logged In:** Records "Apply Click" event and redirects to source URL.
    - [ ] SEO: Meta tags (Title, Description) match the job content.

---

## 🟡 Phase 2: The Newcomer (Onboarding)
**Goal:** Verify the friction-free signup process and initial profile personalization.

### 2.1 Authentication
- [ ] **Registration (`/register`):**
    - [ ] Validates email format and password strength.
    - [ ] Successful submit redirects to login or auto-logs in.
    - [ ] Duplicate email shows clear error.
- [ ] **Login (`/login`):**
    - [ ] Accepts valid credentials.
    - [ ] "Forgot Password" flow triggers email (mock or real).
    - [ ] Redirects to `/home` (or intended protected route) after success.

### 2.2 Onboarding Wizard
- [ ] **Persona Selection:**
    - [ ] User can select a persona (e.g., Engineer, Designer, Founder).
    - [ ] Selection saves to user profile.
- [ ] **Initial Setup:**
    - [ ] Skipping optional steps works.
    - [ ] Completing setup redirects to `/home`.

---

## 🔵 Phase 3: The Active Professional (Dashboard & Feed)
**Goal:** Verify the core value loop—consuming relevant content and interacting with the ecosystem.

### 3.1 Home Feed (`/home`)
- [ ] **Feed Loading:**
    - [ ] Loads mixed content (Posts, Job Cards, Agent Cards).
    - [ ] Infinite scroll fetches next batch without jumping.
- [ ] **Agentic Cards:**
    - [ ] **Hunter Agent:** Shows relevant job matches. "Dismiss" hides card; "Save" saves job.
    - [ ] **Network Agent:** Suggests relevant connections. "Connect" sends request.
- [ ] **Interactions:**
    - [ ] Like/React to posts.
    - [ ] Comments expand/collapse correctly.
    - [ ] Share button copies link or opens modal.

### 3.2 Sidebars (Desktop)
- [ ] **Left Sidebar (Profile):**
    - [ ] Shows current user's mini-profile (Avatar, Name, Stats).
    - [ ] Links to Profile and Settings work.
- [ ] **Right Sidebar (Discovery):**
    - [ ] "Who to Follow" list is populated.
    - [ ] "Trending Jobs" list is populated.

---

## 🟣 Phase 4: The Profile Builder (Identity)
**Goal:** Verify users can build a verifiable reputation.

### 4.1 Profile View (`/u/[username]`)
- [ ] **Public View:**
    - [ ] Profile accessible via unique username URL.
    - [ ] Shows Bio, Skills, Experience, Portfolio.
    - [ ] "Connect" button works for visitors.
- [ ] **Edit Mode:**
    - [ ] Owner sees "Edit Profile" controls.
    - [ ] Updating Avatar/Cover image reflects immediately.
    - [ ] Editing Bio saves and persists.

### 4.2 Portfolio & Experience
- [ ] **Add Experience:** Add Role, Company, Dates. Saves correctly.
- [ ] **Add Project:** Upload image, add title/desc, tag skills.
- [ ] **Verifications:**
    - [ ] "Request Verification" triggers P2P flow.
    - [ ] Verified items show "Verified" badge.

---

## 🟠 Phase 5: The Networker (Social Layer)
**Goal:** Verify social graph building and communication.

### 5.1 Connections
- [ ] **Send Request:** Can send connection request to another user.
- [ ] **Accept/Ignore:** Receiver sees request in Notifications/Network tab. Can Accept or Ignore.
- [ ] **Status:** Profile button changes from "Connect" to "Pending" to "Message".

### 5.2 Notifications
- [ ] **Real-time/Polling:** New notifications appear (red badge).
- [ ] **Types:**
    - [ ] "User liked your post"
    - [ ] "User commented on your post"
    - [ ] "User viewed your profile"
- [ ] **Click Action:** Clicking notification navigates to relevant resource.

---

## 🔴 Phase 6: Settings & Administration
**Goal:** Verify account control and monetization features.

### 6.1 Account Settings
- [ ] **Preferences:** Change theme (Light/Dark), notification frequency.
- [ ] **Security:** Change password.
- [ ] **Data:** "Export Data" or "Delete Account" flows (if implemented).

### 6.2 Payments (Stripe)
- [ ] **Stripe Connect:** User can link Stripe account for payouts (if creator/bounty hunter).
- [ ] **Subscription:** User can view/manage billing status.

---

## 🧪 Testing Workflows (How to Run)

### Manual Verification
1.  **Open Browser:** Navigate to `http://localhost:3000`.
2.  **Open DevTools:** Keep Console and Network tabs open to spot errors (4xx/5xx).
3.  **Run Scenario:** Pick a phase above and walk through steps sequentially.

### Automated Checks (If Available)
- **Backend Tests:** `pytest` in `backend/`
- **Frontend Tests:** `npm run test` in `frontend/`
