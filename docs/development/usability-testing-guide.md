# Proofile Usability Testing Guide

Based on Steve Krug's "Don't Make Me Think" principles.

## Quick Reference

| Test | Duration | What It Validates |
|------|----------|-------------------|
| 5-Second Test | 5 seconds | First impressions, value prop clarity |
| First-Click Test | < 30 seconds | Navigation intuitiveness |
| Task Completion | 2-5 minutes | End-to-end flow success |

---

## 1. 5-Second Test

**Goal:** User IMMEDIATELY understands what the page offers.

### How to Run
1. Show page for exactly 5 seconds
2. Hide the page
3. Ask: "What was this page about?"

### Success Criteria

| Page | User Should Say | Pass If |
|------|-----------------|---------|
| Home | "Resume builder" or "Job platform" | Clear about purpose |
| Dashboard | "My control panel" or "See my progress" | Knows main action |
| Start | "Choose how to create resume" | Understands the question |
| Verification | "Verify my credentials" | Knows next step |

### Red Flags
- ❌ "I don't know" or confusion
- ❌ Mentions wrong product type
- ❌ Can't name ONE thing they can do

---

## 2. First-Click Test

**Goal:** User clicks the RIGHT button first.

### How to Run
1. Give user a task (e.g., "Create a resume")
2. Record their FIRST click only
3. Note if it leads to correct destination

### Critical Paths to Test

| Task | Correct First Click | Location |
|------|---------------------|----------|
| "Create a resume" | "Create Free Profile" or "Start" | Home page |
| "I have a resume" | "Yes, I have one" option | Start page |
| "What should I do next?" | Primary CTA button | Dashboard |
| "Verify my credentials" | "Verify [Item]" button | Verification |

### Success Rate Target
- **80%+ correct first clicks** = Good
- **60-79%** = Needs improvement
- **<60%** = Critical redesign needed

---

## 3. Task Completion Test

### Test Scenarios

#### Scenario A: New User Resume Creation
```
Task: "You want to create a professional resume. 
      Start from the homepage."

Expected path:
Home → Start → Choose option → Resume builder

Time limit: 3 minutes
Success: Reaches resume builder page
```

#### Scenario B: Returning User Next Step
```
Task: "You've logged in. What should you do next?"

Expected: User identifies the next step from NextStepPrompt

Time limit: 30 seconds
Success: Clicks the primary CTA
```

#### Scenario C: Verification Flow
```
Task: "You want to get your profile verified."

Expected path:
Dashboard/Nav → Verification → Click "Verify [Item]"

Time limit: 2 minutes
Success: Clicks verification CTA
```

---

## Success Criteria Checklist

### Per Screen Requirements
- [ ] ONE primary action (green, prominent)
- [ ] Clear headline explaining page purpose  
- [ ] Progress indicator (if multi-step)
- [ ] "Skip" or back option available
- [ ] No more than 2-3 choices visible

### Overall Requirements
- [ ] User creates account in < 2 minutes
- [ ] User finds next action in < 10 seconds
- [ ] User understands value in < 5 seconds
- [ ] No dead-ends or confusion states

---

## Running Usability Tests

### Sample Size
- **Minimum:** 5 participants (finds 85% of issues)
- **Ideal:** 8-12 participants

### Participant Selection
- Mix of:
  - First-time job seekers
  - Experienced professionals
  - Non-technical users

### Recording
- Screen + voice recording (with consent)
- Note timestamps of confusion/hesitation
- Track time to completion

---

## Post-Test Actions

### If Test Fails
1. Identify confusion point
2. Check against "Don't Make Me Think" principles:
   - Is there ONE clear action?
   - Is the copy self-explanatory?
   - Can user go back easily?
3. Implement fix
4. Re-test

### Iteration Cycle
```
Test → Identify Issues → Fix → Re-test
       (aim for 1-week cycles)
```
