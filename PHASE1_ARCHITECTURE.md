# Phase 1 Architecture Diagram

## 🏗️ System Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     Proofile Application                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ├─── Anonymous Users
                              │    (No Authentication Required)
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐     ┌──────────────┐
│ Build Resume │      │Upload Resume │     │  AI Build    │
│  /resume/    │      │  /resume/    │     │  /resume/    │
│   build      │      │   upload     │     │  ai-build    │
└──────────────┘      └──────────────┘     └──────────────┘
        │                     │                     │
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────┐
│              PaywallModal Component                       │
│  Triggers: save | download | improvements                │
└──────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  User Decision   │
                    └──────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌──────────────┐            ┌──────────────┐
        │   Register   │            │  Close Modal │
        │   /register  │            │  (Continue)  │
        └──────────────┘            └──────────────┘
                │
                ▼
        ┌──────────────┐
        │ Authenticated│
        │    Access    │
        └──────────────┘
```

---

## 🔄 User Flow Diagram

### Anonymous User Journey

```
START
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ User lands on resume tool page                          │
│ • No login required                                     │
│ • Full access to interface                             │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ User builds/uploads resume                              │
│ • Fills in all fields                                   │
│ • Sees live preview                                     │
│ • Invests time and effort                              │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ User wants to save/download                             │
│ • Clicks Save button                                    │
│ • Clicks Download button                                │
│ • Clicks Apply Improvements                             │
└─────────────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────────────────┐
│ PaywallModal appears                                    │
│ • Shows value proposition                               │
│ • Lists 6 key benefits                                  │
│ • Clear CTA: "Create Your Proofile"                    │
└─────────────────────────────────────────────────────────┘
  │
  ├─────────────────┬─────────────────┐
  ▼                 ▼                 ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Sign Up  │  │  Sign In │  │  Close   │
│ (Convert)│  │ (Existing)│  │ (Later)  │
└──────────┘  └──────────┘  └──────────┘
  │                 │                 │
  ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────┐
│ Authenticated Access                                    │
│ • Can save resumes                                      │
│ • Can download PDFs                                     │
│ • Can use all features                                  │
│ • Gets living profile                                   │
└─────────────────────────────────────────────────────────┘
  │
  ▼
END
```

---

## 🎯 Paywall Trigger Points

### Build Page (`/resume/build`)

```
┌─────────────────────────────────────────────────────────┐
│                    Resume Builder                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Template Selection] ✅ Anonymous Access                │
│  [Personal Info Form] ✅ Anonymous Access                │
│  [Experience Form]    ✅ Anonymous Access                │
│  [Education Form]     ✅ Anonymous Access                │
│  [Skills Form]        ✅ Anonymous Access                │
│  [Summary Form]       ✅ Anonymous Access                │
│  [Live Preview]       ✅ Anonymous Access                │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Actions (Require Auth)                       │     │
│  │  • [Save] ────────────────► PaywallModal      │     │
│  │  • [Download] ────────────► PaywallModal      │     │
│  │  • [AI Assistant] ────────► PaywallModal      │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Upload Page (`/resume/upload`)

```
┌─────────────────────────────────────────────────────────┐
│                   Upload & Analyze                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [File Upload]        ✅ Anonymous Access                │
│  [Text Paste]         ✅ Anonymous Access                │
│  [View Analysis]      ✅ Anonymous Access                │
│  [See Scores]         ✅ Anonymous Access                │
│  [View Suggestions]   ✅ Anonymous Access                │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Actions (Require Auth)                       │     │
│  │  • [Apply Improvements] ──► PaywallModal      │     │
│  │  • [Save Enhanced]  ──────► PaywallModal      │     │
│  │  • [Download]  ───────────► PaywallModal      │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Analysis Preview (`/resume/analysis/preview`)

```
┌─────────────────────────────────────────────────────────┐
│                  Analysis Results                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Overall Score]      ✅ Anonymous Access                │
│  [Score Breakdown]    ✅ Anonymous Access                │
│  [Key Insights]       ✅ Anonymous Access                │
│  [Detailed Analysis]  ✅ Anonymous Access                │
│  [Improvement Ideas]  ✅ Anonymous Access                │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │  Actions (Require Auth)                       │     │
│  │  • [Apply Fix] ───────────► PaywallModal      │     │
│  │  • [Generate Summary] ────► PaywallModal      │     │
│  │  • [Add Keywords] ────────► PaywallModal      │     │
│  │  • [Use AI Tools] ────────► PaywallModal      │     │
│  │  • [Save & Export] ───────► PaywallModal      │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Structure

### PaywallModal Component

```
PaywallModal
├── Props
│   ├── isOpen: boolean
│   ├── onClose: () => void
│   └── trigger: 'save' | 'download' | 'improvements'
│
├── State
│   └── (None - Controlled by parent)
│
├── Content Variations
│   ├── 'save' trigger
│   │   ├── Title: "🎉 Your Professional Resume is Ready!"
│   │   ├── Subtitle: "But there's something even better..."
│   │   └── Benefits: [6 items]
│   │
│   ├── 'download' trigger
│   │   ├── Title: "🎉 Your Professional Resume is Ready!"
│   │   ├── Subtitle: "But there's something even better..."
│   │   └── Benefits: [6 items]
│   │
│   └── 'improvements' trigger
│       ├── Title: "📊 Ready to Apply AI Improvements?"
│       ├── Subtitle: "We found ways to improve your resume!"
│       └── Benefits: [6 items]
│
└── Actions
    ├── Close (X button)
    ├── Close (Click outside)
    ├── "Create Your Proofile" → /register
    └── "Sign In" → /login
```

---

## 🔐 Authentication Flow

### Auth Check Pattern

```typescript
// In every page with paywall
const { user } = useAuth();
const [showPaywall, setShowPaywall] = useState(false);
const [paywallTrigger, setPaywallTrigger] = useState<TriggerType>('save');

const handleRestrictedAction = (trigger: TriggerType) => {
  if (!user) {
    // Anonymous user - show paywall
    setPaywallTrigger(trigger);
    setShowPaywall(true);
    return;
  }
  
  // Authenticated user - proceed with action
  performAction();
};
```

### State Management

```
┌─────────────────────────────────────────────────────────┐
│                    Application State                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  useAuth() Hook                                          │
│  ├── user: User | null                                   │
│  ├── loading: boolean                                    │
│  └── isAuthenticated: boolean                            │
│                                                          │
│  Page State                                              │
│  ├── showPaywall: boolean                                │
│  ├── paywallTrigger: TriggerType                         │
│  └── resumeData: ResumeData (preserved)                  │
│                                                          │
│  LocalStorage (Anonymous Users)                          │
│  ├── publicAnalysis: AnalysisData                        │
│  └── resumeDraft: ResumeData (future)                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Anonymous User Data Flow

```
User Input
    │
    ▼
┌─────────────────┐
│  Component      │
│  State          │
│  (resumeData)   │
└─────────────────┘
    │
    ├─── Live Preview (Real-time)
    │
    └─── Paywall Trigger
         │
         ▼
    ┌─────────────────┐
    │  PaywallModal   │
    │  (No data loss) │
    └─────────────────┘
         │
         ├─── Close → Data preserved in state
         │
         └─── Sign Up → Data available for import
```

### Authenticated User Data Flow

```
User Input
    │
    ▼
┌─────────────────┐
│  Component      │
│  State          │
│  (resumeData)   │
└─────────────────┘
    │
    ├─── Live Preview (Real-time)
    │
    ├─── Auto-save (Every 30s)
    │    │
    │    ▼
    │  Backend API
    │    │
    │    ▼
    │  Database
    │
    └─── Manual Save/Download
         │
         ▼
       Backend API
         │
         ▼
       Database
```

---

## 🎨 UI Component Tree

```
App
└── ResumeBuilderPage
    ├── BuilderHeader
    │   ├── Logo
    │   ├── Save Button → handleSave() → PaywallModal
    │   └── Download Button → handleExport() → PaywallModal
    │
    ├── ProgressStepper
    │   ├── Step Navigation
    │   └── AI Button → handleAI() → PaywallModal
    │
    ├── FormContent
    │   ├── PersonalInfoForm
    │   ├── ExperienceForm
    │   ├── EducationForm
    │   ├── SkillsForm
    │   └── SummaryForm
    │
    ├── PreviewPanel
    │   └── ResumeTemplate
    │
    └── PaywallModal
        ├── Modal Overlay
        ├── Modal Content
        │   ├── Header (Title + Close)
        │   ├── Benefits Section
        │   └── CTA Buttons
        └── Event Handlers
```

---

## 🔄 Integration Points

### Frontend → Backend

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Anonymous Users                                         │
│  ├── Build Resume (Client-side only)                    │
│  ├── Upload Resume → POST /api/resume/analyze (public)  │
│  └── View Analysis (Client-side only)                   │
│                                                          │
│  Authenticated Users                                     │
│  ├── Save Resume → POST /api/resume/save                │
│  ├── Download PDF → GET /api/resume/{id}/export         │
│  ├── List Resumes → GET /api/resume/list                │
│  └── Delete Resume → DELETE /api/resume/{id}            │
│                                                          │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Public Endpoints (No Auth)                              │
│  └── POST /api/resume/analyze                            │
│                                                          │
│  Protected Endpoints (Auth Required)                     │
│  ├── POST /api/resume/save                               │
│  ├── GET /api/resume/{id}/export                         │
│  ├── GET /api/resume/list                                │
│  └── DELETE /api/resume/{id}                             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Desktop Layout (1920px)

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                  │
├──────────┬──────────────────────────┬───────────────────┤
│          │                          │                   │
│ Progress │    Form Content          │  Live Preview     │
│ Stepper  │    (Wide)                │  (Full Size)      │
│ (Fixed)  │                          │                   │
│          │                          │                   │
└──────────┴──────────────────────────┴───────────────────┘
```

### Tablet Layout (768px)

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Form Content (Full Width)                               │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Preview (Collapsible)                                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Mobile Layout (375px)

```
┌──────────────────────┐
│  Header              │
├──────────────────────┤
│                      │
│  Form Content        │
│  (Full Width)        │
│                      │
├──────────────────────┤
│  [View Preview]      │
│  (Modal)             │
└──────────────────────┘
```

---

## 🎯 Summary

### Key Architectural Decisions

1. **Reusable Component**: Single PaywallModal for all triggers
2. **Client-Side State**: Preserve data without backend calls
3. **Progressive Enhancement**: Full functionality before auth
4. **Strategic Triggers**: Paywall at high-intent moments
5. **Clear Separation**: Anonymous vs authenticated flows

### Benefits

- ✅ Minimal code duplication
- ✅ Consistent user experience
- ✅ Easy to maintain and extend
- ✅ Performance optimized
- ✅ Scalable architecture

---

**Architecture Status: ✅ COMPLETE**  
**Ready for: Production Deployment**
