# Home + Portal Page Combination Plan

## 🎯 Objective

Combine the rich header from `/home` with the job portal content from `/portal` to create a unified homepage experience.

---

## 📋 Structure Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER (from /home)                                            │
│  - Proofile Logo + tagline                                      │
│  - Nav dropdowns: Product, Solutions, Explore, Pricing, Resources│
│  - Theme toggle, Sign in, Get started buttons                   │
├─────────────────────────────────────────────────────────────────┤
│  INCLUSIVE BANNER (from /home) - optional                       │
│  "For students, graduates, professionals..."                    │
├─────────────────────────────────────────────────────────────────┤
│  PORTAL CONTENT (from /portal)                                  │
│  - Hero with search bar (green theme)                           │
│  - Quick filter buttons                                         │
│  - Filters sidebar + Job listings grid                          │
│  - Signup CTA section                                           │
│  - Load more jobs button                                        │
├─────────────────────────────────────────────────────────────────┤
│  FOOTER (from /portal or /home)                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Approach

### Option A: Extract Header as Shared Component (Recommended)

**Pros:** Reusable, maintainable, consistent across pages
**Cons:** Requires refactoring

#### Files to Create/Modify:

| Action | File | Description |
|--------|------|-------------|
| **CREATE** | `components/layout/HomeHeader.tsx` | Extract header from /home |
| **MODIFY** | `app/portal/layout.tsx` | Import and use HomeHeader |
| **MODIFY** | `app/home/page.tsx` | Import HomeHeader instead of inline |

---

### Option B: Merge Portal Content into Home Page

**Pros:** Single page, no component extraction needed
**Cons:** Large file, duplicated content

#### Files to Modify:

| Action | File | Description |
|--------|------|-------------|
| **MODIFY** | `app/home/page.tsx` | Replace hero section with portal job search/listings |
| **DELETE** | `app/portal/` | Redirect /portal → /home |

---

## 📁 Recommended File Structure (Option A)

```
frontend/src/
├── components/
│   └── layout/
│       ├── HomeHeader.tsx       # NEW - Extracted header
│       ├── HomeFooter.tsx       # NEW - Extracted footer (optional)
│       └── index.ts             # Exports
├── app/
│   ├── home/
│   │   └── page.tsx             # Uses HomeHeader + existing content
│   └── portal/
│       ├── layout.tsx           # Uses HomeHeader (no duplicate header)
│       └── page.tsx             # Job search content only
```

---

## 🛠️ Implementation Steps

### Step 1: Extract Header Component

Create `components/layout/HomeHeader.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, Flame, TrendingUp, Trophy, Building2, DollarSign, Users } from "lucide-react";
import ProofileLogo from "@/components/branding/ProofileLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function HomeHeader() {
  const [productOpen, setProductOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
      {/* ... header content from /home lines 18-183 ... */}
    </header>
  );
}
```

### Step 2: Update Portal Layout

Modify `app/portal/layout.tsx`:

```tsx
import React from "react";
import HomeHeader from "@/components/layout/HomeHeader";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <HomeHeader />
      <main className="flex-1">{children}</main>
      {/* Footer */}
    </div>
  );
}
```

### Step 3: Update Home Page (Optional)

Refactor `app/home/page.tsx` to use the shared component.

---

## 🎨 Design Considerations

### Header Theming
The `/home` header uses blue/purple accents while `/portal` uses green. Options:

1. **Keep as-is**: Header stays blue/purple, portal content is green
2. **Unify to green**: Update header button colors to match portal
3. **Prop-based theming**: Pass `theme="green"` to `<HomeHeader />`

### Inclusive Banner
The green inclusive banner from `/home` (line 185-192) could be:
- Included above portal content
- Removed for cleaner look
- Made dismissible

---

## 📊 Route Changes

| Current Route | After Implementation |
|---------------|---------------------|
| `/home` | Keep as-is OR redirect to `/` |
| `/portal` | Uses HomeHeader + portal content |
| `/` | Redirect to `/portal` or `/home` |

---

## ⏱️ Estimated Effort

| Step | Time |
|------|------|
| Extract HomeHeader component | 30 min |
| Update portal layout | 10 min |
| Update home page | 15 min |
| Test & adjust styling | 20 min |
| **Total** | **~75 min** |

---

## ✅ Acceptance Criteria

- [ ] `/portal` displays the full Proofile header with dropdowns
- [ ] Navigation dropdowns work correctly
- [ ] Theme toggle works
- [ ] Sign in/Get started buttons link correctly
- [ ] Portal job search and listings display below header
- [ ] Responsive design works on mobile
- [ ] No duplicate headers or styling conflicts
