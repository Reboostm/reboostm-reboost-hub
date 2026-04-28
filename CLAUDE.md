# ReBoost Hub — Claude Project Context

## 🎯 What This Actually Is

**ReBoost Hub is a Marketing & Sales Funnel Hub** — not a generic SaaS toolkit. It's the **entry point & sales engine** for converting local service businesses into Done-For-You (DFY) clients.

### The Business Model
- **Free lead magnet** (SEO Audit) drives discovery → no PDF emails, account login only
- **Free user gets into the Hub** and experiences the full funnel
- **Sales process begins immediately:** Citations, Content Calendar, Scheduler, AI Creator, upsells
- **Monthly subscriptions + one-time purchases** = recurring revenue
- **End goal:** User hires us for DFY services ($500-2000/mo recurring)

### The Funnel (User Journey)
1. **Free Entry** → SEO Audit (shows how broken their site is)
2. **Lead Gen** → Buy leads for their niche in their city (test & learn)
3. **Citations** → Build authority (serious users invest here)
4. **Celebrity Content** → 12-month pre-planned daily content (their niche only)
5. **Content Scheduler** → Automate posts to social media
6. **AI Creator** → Generate captions & images with their branding
7. **Rank Tracker** → Monitor SEO results & show ROI
8. **Done-For-You Services** → White-label HVAC SEO, plumbing citations, etc.

### Key Design Principles
- **Niche is everything** — Plumber sees plumbing content only. Realtor sees realtor content only. No confusion.
- **First-login forces profile** — User must select niche + fill business info before accessing tools. This auto-populates all content/images with their branding.
- **Content pre-loads by niche** — When Celebrity Content user signs up, ALL plumbing content loads. HVAC user gets all HVAC content. They never see irrelevant niches.
- **Every feature asks:** "Does this move them toward DFY?" If not, it's probably scope creep.

---

## Technical Stack

**Live repo:** https://github.com/Reboostm/reboostm-reboost-hub  
**Deployed on:** Vercel (frontend) + Firebase (backend/functions)  
**Firebase project:** `reboost-hub`

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | TailwindCSS v4 — CSS-first, `@theme` block in `src/index.css`. NO `tailwind.config.js`. |
| Icons | lucide-react v1 |
| Routing | React Router DOM v7 (SPA, hash-free) |
| Auth | Firebase Auth v12 |
| Database | Firestore v12 (modular SDK) |
| Functions | Firebase Cloud Functions v5, Node.js 22, **CommonJS only** |
| Image Editor | Custom proprietary (HTML5 Canvas + React wrapper, NOT Fabric.js) |
| Payments | Stripe API + webhooks |
| Social posting | Zernio API ($49/mo Accelerate plan) |

---

## Project Structure

```
src/
  App.jsx                        # All routes
  config.js                      # HUB_NAME, NICHES[], US_STATES[]
  index.css                      # Tailwind v4 @theme block
  contexts/
    AuthContext.jsx              # user, userProfile, isAdmin, isStaff
    BillingContext.jsx           # hasScheduler, hasCalendar, etc.
  hooks/
    useAuth.js, useBilling.js, useToast.js
  services/
    firebase.js, firestore.js, functions.js, stripe.js
  components/
    ui/
      Button, Card, Input, Textarea, Select, Modal, Badge, Spinner, EmptyState, ToolGate, Toast
      ImageEditor.jsx            # NEW: Custom canvas-based image editor
    layout/
      Sidebar.jsx, HubLayout.jsx, ProtectedRoute.jsx, AdminRoute.jsx
  pages/
    auth/          Login, Signup, ForgotPassword
    setup/         Setup (one-time admin claim)
    audit/         AuditHome, AuditNew, AuditResults
    citations/     CitationsHome, CitationsDirs, CitationsJobs, CitationsAnalytics
    leads/         LeadFinder, MyLeads, OutreachTemplates
    scheduler/     CalendarView, SchedulePost, ConnectedAccounts
    creator/       GenerateContent, GenerateImage
    reviews/       AllReviews, ReviewRequests
    ranktracker/   Keywords, RankingsReport
    calendar/      CelebrityContent.jsx  ✅ NEW: 12-month calendar + library + editor
    agency/        TerritoryChecker, AgencyServices
    settings/      Profile, Billing, Integrations
    admin/
      Dashboard, Users, Clients, ApiKeys (editable), Offers, Territories, ContentManager

functions/src/index.js         # All Cloud Functions (CommonJS)
```

---

## First-Login Profile Force

When a user signs up and logs in:
1. `ProtectedRoute.jsx` checks if profile is complete (niche, businessName, phone, address required)
2. If missing → redirects to `/settings` before accessing any tools
3. User fills profile with their business details
4. **System recognizes niche** → pre-loads all matching content
5. **All downloaded/edited content auto-applies** their name, phone, logo to images

**Why:** Ensures every piece of content they interact with is branded with their info automatically.

---

## Celebrity Content System (Complete Architecture)

### Admin Side: `Content Manager` (`/admin/content`)
- Upload niche-specific templates (images with editable text)
- Tag by niche (Plumber, Realtor, HVAC, Pest Control, etc.)
- Tag by month/year (for seasonal content)
- Store in Firestore `content` collection
- Organize by niche in admin UI

### User Side: `Celebrity Content` (`/calendar`)
- **12-month Calendar Grid:** Interactive month view showing which days have content
- **Content Library:** Search/scroll through all content for their niche
- **Image Editor:** Proprietary canvas-based editor (NOT Fabric.js)
  - Load image
  - Add text layers (name, business, phone, email)
  - Drag/position/scale text and logos
  - Auto-injected from user's profile on first load
  - Download as PNG
  - Send to Scheduler ("Use in Scheduler" button)
- **Upgrade Prompt:** If no Scheduler subscription, show "Schedule this" button with upsell
- **Video Upsell:** Locked section for video package (unlock if purchased)

### Flow
1. User signs up as "Plumber"
2. First login → redirects to `/settings` → fills profile
3. Navigates to `/calendar` → sees ONLY plumbing content (12+ months pre-planned)
4. Clicks day or searches → grabs content
5. Editor auto-fills their name/phone/logo
6. Downloads or schedules to social

---

## Image Editor (Proprietary)

**File:** `src/components/ui/ImageEditor.jsx`

**Tech Stack:**
- HTML5 Canvas API (NOT Fabric.js — custom, proprietary build)
- React wrapper for state management
- Layer system: text layers with position, size, color, font-weight
- Real-time canvas rendering

**Features:**
- Load image from URL
- Add/edit/delete text layers
- Position layers (X/Y coordinates)
- Font size, color, font-weight per layer
- Download canvas as PNG
- "Use in Scheduler" button to save/schedule

**Used in:**
- Celebrity Content page (edit pre-made templates)
- Scheduler "Upload Content" (edit user-uploaded images)
- AI Creator (edit generated images)

---

## Firestore Data Model

### `users/{uid}`
```js
{
  email, displayName, businessName, niche, phone, address, role,
  logo: null | '<url>',
  subscriptions: {
    scheduler: { active, tier: 'basic'|'pro', stripeSubId },
    reviewManager: { active, stripeSubId },
    rankTracker: { active, stripeSubId },
  },
  purchases: {
    citationsPackageId: null | 'starter'|'pro'|'premium',
    leadCredits: 0,
    videoPackage: { unlocked: bool },
  },
  connectedAccounts: { facebook, instagram, linkedin, gmb, ... },
  reviewProfile: { placeId, rating, reviews, ... },
  createdAt, updatedAt,
}
```

### `content/{id}` — NEW
Niche-specific content templates
```js
{
  niche: 'Plumber',
  title: 'Spring Maintenance Tips',
  description: 'Post about spring plumbing maintenance',
  imageUrl: 'https://...',
  month: 'April',
  year: 2026,
  createdAt,
}
```

### `offers/{id}` — NEW
Dynamic pricing management
```js
{
  name: 'Scheduler Pro',
  description: '10 accounts, unlimited posts',
  price: 99,
  stripePriceId: 'price_xxx',
  type: 'subscription',
  unlocksFeature: 'scheduler',
  tier: 'pro',
  active: true,
}
```

### Other collections
| Collection | Description |
|---|---|
| `settings/googleMapsKeys` | Google Maps API key pool + usage tracking |
| `settings/functionEnvVars` | Firebase Function env vars (editable from admin) |
| `settings/adminClaimed` | Lock for one-time admin claim |
| `auditResults/{id}` | SEO audit results per user |
| `citations/{batchId}` | Citations batches with Phase 1/2/3 data |
| `leads/{batchId}` | Lead search batches |
| `scheduledPosts/{id}` | Social media scheduled posts |
| `reviewRequests/{id}` | Review request history |
| `trackedKeywords/{id}` | Rank tracker keywords |
| `territories/{id}` | Agency territory claims |

---

## Firestore Security Rules

**Key rule:** Admin-only write, authenticated users read

```
match /offers/{id} { allow read: if isAuth(); allow write: if isAdmin(); }
match /content/{id} { allow read: if isAuth(); allow write: if isAdmin(); }
match /settings/{doc} { allow read, write: if isAdmin(); }
```

---

## BillingContext Flags

```js
const isAdmin          = role === 'admin' || role === 'staff'
const hasScheduler     = isAdmin || subscriptions.scheduler?.active
const hasReviewManager = isAdmin || subscriptions.reviewManager?.active
const hasRankTracker   = isAdmin || subscriptions.rankTracker?.active
const hasCitations     = isAdmin || !!purchases.citationsPackageId
const hasCalendar      = isAdmin || !!purchases.videoPackage?.unlocked
const leadCredits      = isAdmin ? 9999 : purchases.leadCredits
```

---

## Cloud Functions (in `functions/src/index.js`)

All use `onCall` (HTTPS callable). CommonJS only.

| Function | Purpose | Env Var |
|---|---|---|
| `runSeoAudit` | PageSpeed + GMB check | `PAGESPEED_API_KEY`, `GOOGLE_PLACES_KEY` |
| `startCitationsJob` | Create citations batch | — |
| `searchLeads` | Google Maps search + key rotation | `GOOGLE_PLACES_KEY` |
| `generateAIContent` | Generate captions via Claude | `ANTHROPIC_API_KEY` |
| `generateAIImage` | Generate images via DALL-E 3 | `OPENAI_API_KEY` |
| `schedulePost` | Call Zernio to schedule | `ZERNIO_API_KEY` |
| `fetchReviews` | Google reviews cache | `GOOGLE_PLACES_KEY` |
| `sendReviewRequest` | Email reviews via SendGrid | `SENDGRID_API_KEY` |
| `checkKeywordRank` | Rank check via SerpAPI | `SERPAPI_KEY` |

---

## Module Build Status

| Module | Status | Notes |
|---|---|---|
| SEO Audit | ✅ Built | PageSpeed + GMB |
| Citations | ✅ Built | All 3 phases: Profile, Setup form, Advanced fields |
| Lead Generator | ✅ Basic | Google Maps search. NEEDS: lead packages instead of credits |
| Content Scheduler | ✅ Built | Zernio integration, post composer |
| AI Creator | ✅ Built | Claude captions + DALL-E 3 images |
| Review Manager | ✅ Built | Google reviews + SendGrid email |
| Rank Tracker | ✅ Enhanced | Mobile/desktop simultaneous tracking, keywords |
| **Celebrity Content** | ✅ **BUILT** | **NEW:** 12-month calendar + library + image editor |
| Admin Panel | ✅ Built | Users, Clients, API Keys (editable), Offers, Content Manager |
| Billing & Stripe | ✅ Built | Checkout, portal, webhooks, dynamic offers |

---

## Latest Session (April 2026, Session 6)

### ✅ Completed

1. **Fixed Firestore Rules**
   - Added `offers` collection rule (admin write, auth read)
   - Added `content` collection rule (admin write, auth read)
   - Fixes "Missing or insufficient permissions" error on Offers page

2. **Built Custom Image Editor** (`ImageEditor.jsx`)
   - Proprietary canvas-based editor (NOT Fabric.js)
   - Text layer system with position/size/color/font-weight
   - Download as PNG
   - "Use in Scheduler" integration
   - Used by Celebrity Content + Scheduler

3. **Rebuilt Content Manager** (`/admin/content`)
   - Upload niche-specific templates
   - Organize by niche
   - Month/Year tagging for seasonal content
   - Store in `content` Firestore collection

4. **Built Celebrity Content** (`/calendar`)
   - **12-month interactive calendar** (shows content count per day)
   - **Content library** (search + scroll)
   - **Image editor** (auto-fills user info from profile)
   - **Download + Schedule** options
   - **Niche filtering** (users see only their niche content)

5. **First-Login Profile Force** (`ProtectedRoute.jsx`)
   - Redirects incomplete profiles to `/settings`
   - Requires: niche, businessName, phone, address
   - Auto-populates content editing

6. **Enhanced Admin API Keys** (`ApiKeys.jsx`)
   - Edit Google Maps keys (preserved)
   - **NEW:** Edit Firebase Function env vars
   - All 8 keys editable (GOOGLE_PLACES_KEY, ZERNIO_API_KEY, etc.)
   - Firestore persistence (settings/functionEnvVars)

7. **Fixed Admin Routing**
   - Sidebar: "Packages" → "Offers" (correct path `/admin/offers`)

### Files Changed
- `firestore.rules` — Added offers + content rules
- `src/components/ui/ImageEditor.jsx` — **NEW** custom editor
- `src/pages/admin/ContentManager.jsx` — Rewritten
- `src/pages/calendar/CelebrityContent.jsx` — **NEW** calendar + library
- `src/pages/admin/ApiKeys.jsx` — Enhanced with env var editing
- `src/components/layout/ProtectedRoute.jsx` — Added profile force
- `src/components/layout/Sidebar.jsx` — Fixed Offers link
- `src/App.jsx` — Updated calendar import + route

### Build Status
✅ Vercel push successful  
✅ Production build passes (no errors)  
✅ All Firestore rules deployed  

---

## Key Design Notes

### Why Not Fabric.js?
Claude #1 wanted a proprietary, slick editor. Custom canvas implementation is simpler for this use case (text only, no advanced shape drawing) and avoids external dependencies.

### Why First-Login Profile Force?
- Ensures every piece of content is branded with user's info
- No confusion about which niche they belong to
- Auto-fills image editor with their name/phone/logo
- One-time friction pays off in usability

### Why Pre-Load Content by Niche?
- Users see ONLY relevant content
- No decision fatigue
- Plumber doesn't see HVAC posts
- Realtor doesn't see Pest Control calendar

### Why Firestore Rules for Offers + Content?
- Admins manage offerings without code deploys
- Users read offers dynamically (for checkout)
- Content admins upload templates, users fetch
- Separation of concerns: UI ↔ Data

---

## Phase Roadmap

### Phase 1 (COMPLETE) ✅
- [x] Offers management (dynamic, no code needed)
- [x] Stripe integration (checkout + portal + webhooks)
- [x] Admin panel (Users, Clients, API Keys)
- [x] Firestore rules + Firestore data model

### Phase 2 (IN PROGRESS)
- [x] Citations expansion (all 3 phases)
- [x] Rank Tracker improvements (mobile/desktop tracking)
- [x] Celebrity Content (calendar + editor + library)
- [ ] Add upgrade buttons throughout app (Scheduler, Video, etc.)
- [ ] Lead Generator redesign (packages instead of credits)

### Phase 3 (NEXT)
- [ ] Video Package upsell unlock mechanism
- [ ] Scheduler integration from Celebrity Content
- [ ] Finalize placeholder copy (outreach templates, CTAs)
- [ ] First-time user onboarding flow

---

## Known Unknowns

1. **Cloud Run Citations Service** — Separate repo (Playwright + 2Captcha automation). Is it deployed? Polling Firestore? Status unknown.
2. **Video Package** — Placeholder in code. Content not filmed yet. Unlock mechanism ready, just needs assets.
3. **Scheduler Upsell** — When user tries to schedule from Celebrity Content without subscription, show upsell modal. Ready to implement.

---

## Important Context For Next Chat

This is **Session 6** on this project. Prior chats encountered token limits and context loss. Key points:

1. **This is a Sales Funnel, not a dev toolkit**
2. **Niche is everything** — no generic content
3. **First-login forces profile** — auto-populates everything
4. **Each tool is an upsell** → Lead Gen → Citations → Scheduler → AI Creator → Content Calendar → DFY Services
5. **No Fabric.js** — custom canvas editor (proprietary)
6. **Firestore rules + dynamic offers** — admins manage without code changes
7. **Image editor used by 3 places:** Celebrity Content, Scheduler, AI Creator

---
