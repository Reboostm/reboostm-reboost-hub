# ReBoost Hub — Claude Project Context

## 🎯 What This Actually Is (Business Model)

**ReBoost Hub is NOT a generic SaaS toolkit.** It's a **revenue funnel** for local service businesses to discover and outreach to other businesses they can serve.

### The Real Problem It Solves
- **Plumber** (user) → wants to find **Contractors** in their city → buy leads, send outreach, book appointments
- **Pest Control** (user) → wants to find **Property Managers** in their area → similar flow
- **HVAC Contractor** → wants to find **Builders & Real Estate Companies** → same pattern

### The Funnel (User Journey)
1. **Free Entry** → SEO Audit (no paywall, shows them how broken their site is)
2. **Lead Gen** → Buy leads for their niche in their city (discover what's available, test if it works)
3. **Citations** → Build authority (only serious users invest here)
4. **Content Calendar** → Pre-done 12-month niche-specific daily content (social proof + nurture)
5. **Content Scheduler** → Automate posts (maximize their investment)
6. **Rank Tracker** → Monitor results (show ROI)
7. **Done-For-You Services** → White-label HVAC SEO, plumbing citations, etc. ($500-2000/mo recurring)

### Key Distinction: NOT Generic
- **Lead Gen** is NOT "bulk scrape all businesses for resale" → it's "help the user find their target customer"
- **Content Calendar** is NOT "generic content library" → it's "12-month pre-planned daily content tailored to their niche" (plumber posts about seasonal maintenance, HVAC posts about seasonal tune-ups, etc.)
- **Each tool** auto-detects their niche and surfaces only relevant content/features

---

## Technical Stack

**Live repo:** https://github.com/Reboostm/reboostm-reboost-hub  
**Deployed on:** Vercel (frontend) + Firebase Cloud Functions (backend)  
**Firebase project:** `reboost-hub`

### Why This Matters When Building
When adding features, ask: "Does this move the user closer to hiring our DFY services?" If not, it's probably not on the roadmap. Every tool should be best-in-class for that funnel stage, not mediocre at everything.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite 8 |
| Styling | TailwindCSS v4 — CSS-first, `@theme` block in `src/index.css`. NO `tailwind.config.js`. |
| Icons | lucide-react v1 — NO Facebook/Instagram/LinkedIn icons. Use Share2, Image, Briefcase, MapPin instead. |
| Routing | React Router DOM v7 (SPA, hash-free) |
| Auth | Firebase Auth v12 |
| Database | Firestore v12 (modular SDK on frontend) |
| Functions | Firebase Cloud Functions v5, Node.js 22, **CommonJS** (NOT ESM) |
| Admin SDK | firebase-admin v12 |
| Hosting | Vercel (frontend) / Firebase (functions) |

---

## Project Structure

```
src/
  App.jsx                        # All routes defined here
  config.js                      # HUB_NAME, NICHES[], US_STATES[]
  index.css                      # Tailwind v4 @theme block — all CSS vars
  contexts/
    AuthContext.jsx               # user, userProfile, isAdmin, isStaff, isClient
    BillingContext.jsx            # hasScheduler, hasReviewManager, etc.
  hooks/
    useAuth.js                   # re-exports AuthContext
    useBilling.js                # re-exports BillingContext
    useToast.js                  # toast(message, type) — 'success'|'error'|'warning'|'info'
  services/
    firebase.js                  # Firebase app init (reads VITE_FIREBASE_* env vars)
    firestore.js                 # All Firestore helpers
    functions.js                 # All CF callables (call wrapper)
    stripe.js                    # redirectToCheckout, PRICES map
  components/
    layout/
      Sidebar.jsx                # Nav sidebar with section groups + admin links
      HubLayout.jsx              # Main app shell (sidebar + outlet)
      ProtectedRoute.jsx         # Redirects unauthenticated → /login
      AdminRoute.jsx             # Redirects non-staff → /audit
    ui/
      Button.jsx                 # variant: 'primary'|'secondary'|'ghost'|'accent', size: 'sm'|'md'|'lg', loading
      Card.jsx                   # + CardHeader, CardTitle exports
      Input.jsx                  # label, value, onChange, placeholder, type
      Textarea.jsx               # label, rows, value, onChange
      Select.jsx                 # label, value, onChange, options:[{value,label}], placeholder
      Modal.jsx                  # isOpen, onClose, title, size, footer (JSX), children
      Badge.jsx                  # variant: 'success'|'error'|'warning'|'info'|'gray'|'free'|'paid'|'orange', size: 'sm'
      Spinner.jsx                # size: 'sm'|'md'|'lg'
      EmptyState.jsx             # icon, title, description, action (JSX node)
      ToolGate.jsx               # tool: key from TOOL_INFO map — shows lock screen + buy buttons
      Toast.jsx                  # used internally by useToast
  pages/
    auth/        Login, Signup, ForgotPassword
    setup/       Setup (one-time admin claim via claimAdminRole CF)
    audit/       AuditHome, AuditNew, AuditResults
    citations/   CitationsHome, CitationsDirs, CitationsJobs, CitationsAnalytics
    leads/       LeadFinder, MyLeads, OutreachTemplates, outreachData.js
    scheduler/   CalendarView, SchedulePost, ConnectedAccounts
    creator/     GenerateContent, GenerateImage
    reviews/     AllReviews, ReviewRequests
    ranktracker/ Keywords, RankingsReport
    calendar/    ContentLibrary, TemplateEditor          ← PLACEHOLDER (not built)
    agency/      TerritoryChecker, AgencyServices
    settings/    Profile, Billing, Integrations
    admin/
      Dashboard.jsx
      Users.jsx          # Create User modal, role dropdown, reset password link
      Clients.jsx        # Manage Access modal — unlock any tool per client
      ApiKeys.jsx        # Google Maps key pool + all env vars reference
      Packages.jsx       # PLACEHOLDER
      Territories.jsx    # PLACEHOLDER
      ContentManager.jsx # PLACEHOLDER

functions/src/index.js  # All Cloud Functions (CommonJS)
```

---

## Roles & Access

```
admin > staff > client
```

- **admin/staff**: `isStaff = true` in AuthContext. BillingContext `isAdmin` flag bypasses ALL ToolGates — admin/staff get every tool for free.
- **client**: Sees only unlocked tools (based on purchases + subscriptions in Firestore).
- **AdminRoute**: wraps admin/* routes — redirects non-staff to /audit.

---

## Firestore Data Model

### `users/{uid}`
```js
{
  email, displayName, businessName, niche, role,  // 'client'|'staff'|'admin'
  subscriptions: {
    scheduler:      { active: bool, tier: 'basic'|'pro'|null, stripeSubId },
    reviewManager:  { active: bool, stripeSubId },
    rankTracker:    { active: bool, stripeSubId },
  },
  purchases: {
    citationsPackageId: null | 'starter'|'pro'|'premium',
    calendarNiches: [],
    leadCredits: 0,
    outreachTemplates: false,
  },
  connectedAccounts: {             // Content Scheduler
    facebook:  { connected, accountName, zernioAccountId, connectedAt },
    instagram: { connected, accountName, zernioAccountId, connectedAt },
    linkedin:  { connected, accountName, zernioAccountId, connectedAt },
    gmb:       { connected, accountName, zernioAccountId, connectedAt },
  },
  reviewProfile: {                 // Review Manager
    placeId, businessName, rating, reviewCount,
    reviewLink, googleMapsUrl, reviews: [...], lastFetchedAt,
  },
  createdAt, updatedAt,
}
```

### Other collections
| Collection | Description |
|---|---|
| `settings/googleMapsKeys` | `{ keys:[{key,label,usageThisMonth,limit,active}], lastResetMonth }` |
| `settings/adminClaimed` | `{ uid, claimedAt }` — lock for claimAdminRole |
| `auditResults/{id}` | SEO audit results per user |
| `citations/{batchId}` | Citations jobs; sub-collection `directories/{id}` |
| `leads/{batchId}` | Lead search batches; sub-collection `items/{id}` |
| `scheduledPosts/{id}` | Scheduled social posts |
| `reviewRequests/{id}` | Review request email history |
| `trackedKeywords/{id}` | Rank tracker keywords per user |
| `rankChecks/{id}` | Per-check history for rank tracking |
| `territories/{id}` | Agency territory claims |

---

## BillingContext Flags

```js
const isAdmin          = role === 'admin' || role === 'staff'
const hasScheduler     = isAdmin || subscriptions.scheduler?.active
const hasReviewManager = isAdmin || subscriptions.reviewManager?.active
const hasRankTracker   = isAdmin || subscriptions.rankTracker?.active
const hasCitations     = isAdmin || !!purchases.citationsPackageId
const leadCredits      = isAdmin ? 9999 : purchases.leadCredits
const hasLeadCredits   = isAdmin || leadCredits > 0
const hasOutreachTemplates = isAdmin || purchases.outreachTemplates
const hasCalendar      = isAdmin || calendarNiches.length > 0
const hasAICreator     = isAdmin || (hasScheduler && scheduler.tier === 'pro')
```

---

## Cloud Functions (all in `functions/src/index.js`)

All functions use `onCall` (HTTPS callable). CommonJS only.

| Function | Purpose | Key Env Var |
|---|---|---|
| `runSeoAudit` | PageSpeed + GMB check, saves auditResults | `PAGESPEED_API_KEY`, `GOOGLE_PLACES_KEY` |
| `startCitationsJob` | Creates citations batch in Firestore | — |
| `getCitationsJobStatus` | Returns batch progress | — |
| `searchLeads` | Google Maps Places TextSearch + Details, key rotation | `GOOGLE_PLACES_KEY` |
| `generateOutreachSequence` | Legacy stub (templates are now hardcoded frontend) | — |
| `claimAdminRole` | One-time: first caller becomes admin | — |
| `setUserRole` | Admin/staff: change another user's role | — |
| `resetUserPassword` | Admin/staff: generate password reset link | — |
| `adminCreateUser` | Admin/staff: create Auth user + Firestore profile | — |
| `adminUpdateAccess` | Admin/staff: update purchases/subscriptions for a client | — |
| `connectZernioAccount` | Store Zernio platform connection in user doc | — |
| `schedulePost` | Call Zernio API to schedule post, save to scheduledPosts | `ZERNIO_API_KEY` |
| `cancelPost` | Cancel scheduled post in Zernio + Firestore | `ZERNIO_API_KEY` |
| `generateAIContent` | Generate social caption via Claude Haiku | `ANTHROPIC_API_KEY` |
| `generateAIImage` | Generate image via DALL-E 3 | `OPENAI_API_KEY` |
| `fetchReviews` | Google Places Details → cache reviews in user doc | `GOOGLE_PLACES_KEY` |
| `sendReviewRequest` | Send review request emails via SendGrid | `SENDGRID_API_KEY` |
| `checkKeywordRank` | Check Google rank via SerpAPI, update trackedKeywords | `SERPAPI_KEY` |

---

## Required Environment Variables

Set in **Firebase Console → Functions → [function name] → Edit → Runtime environment variables**.

| Var | Required | Used By |
|---|---|---|
| `GOOGLE_PLACES_KEY` | ✅ Yes | SEO Audit, Lead Generator, Review Manager |
| `PAGESPEED_API_KEY` | Optional | SEO Audit (raises quota 400→25k/day) |
| `ZERNIO_API_KEY` | For Scheduler | schedulePost, cancelPost |
| `ANTHROPIC_API_KEY` | For AI Creator | generateAIContent |
| `OPENAI_API_KEY` | For AI Creator | generateAIImage |
| `SENDGRID_API_KEY` | For Reviews | sendReviewRequest |
| `SERPAPI_KEY` | For Rank Tracker | checkKeywordRank |

All env vars are visible and documented in the **Admin → API Keys** tab of the app.

---

## Frontend Environment Variables

Set in Vercel (or `.env.local` for local dev):

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

## Module Build Status

| Module | Status | Phase | Notes |
|---|---|---|---|
| SEO Audit | ✅ Built | Done | PageSpeed + GMB check, reports UI |
| Citations Manager | ✅ Expanded | Phase 2b | **NEW:** Form expansion (Phase 1/2/3 all built). Profile + dedicated CitationsSetup page with logo upload, descriptions, social media, advanced options |
| Lead Generator | ✅ Basic | Phase 2 | Google Maps Places search, key rotation, CSV export. NEEDS: lead preview before purchase, lead packages instead of credits |
| Content Scheduler | ✅ Built | Done | Calendar view, post composer, platform connections via Zernio |
| AI Content Creator | ✅ Built | Done | Caption gen (Claude), image gen (DALL-E 3), "Use in Scheduler" flow |
| Review Manager | ✅ Built | Done | Google reviews display, review request emails via SendGrid |
| Local Rank Tracker | ✅ Enhanced | Phase 2 | **DONE:** Mobile/desktop simultaneous tracking with grouped display. Keyword suggestions. NEEDS: auto-detect keywords from domain |
| Agency & Services | ✅ Built | Done | Territory checker (Firestore), DFY services page |
| Content Calendar (Celebrity) | ❌ Placeholder | Phase 2 | Niche-specific 12-month pre-planned templates. NEEDS: full rebuild (ContentLibrary.jsx + TemplateEditor.jsx + fabric.js) + Scheduler integration |
| Admin Panel | ✅ Built | Phase 1 | Users (create/role/reset), Clients (manage access), API Keys (editable) |
| Billing & Pricing | ✅ Built | Phase 1 | Offers management, pricing page, Stripe checkout + portal |
| Stripe Integration | ✅ Complete | Phase 1 | createCheckoutSession, createPortalSession, webhook handlers. Needs: env vars in Firebase |

### Phase Legend
- **Done** = Production ready, no major refactor needed
- **Phase 1** (COMPLETE) = Core infrastructure: billing, admin, API management
- **Phase 2** (NEXT) = Feature redesigns: Lead Gen, Content Calendar, Rank Tracker improvements
- **Phase 3** (POLISH) = UX refinements: upgrade buttons throughout, refined niches list

---

## Key Design Decisions

### Lead Generator Limitation
Google Maps Places API hard limit is **20 leads per page × 3 pages = 60 max per query**. The user's vision is state-wide bulk scraping (ALL plumbers in Utah = hundreds). This requires a multi-city loop approach or an alternative data source (Outscraper, etc.). Current build does 20–60/search with key rotation. **Needs redesign before shipping to clients.**

### AI Outreach Templates
Outreach email templates are hardcoded niche-specific sequences in `src/pages/leads/outreachData.js` — NOT AI-generated. 14 niches supported. Templates are written from the **client's perspective** (client reaching out to their leads) but **need content review** — currently placeholder copy.

### Content Hold
All marketing copy (email templates, service descriptions, CTAs) is placeholder. Do not finalize content until user explicitly requests it.

### Zernio Integration
Content Scheduler uses Zernio ($49/mo Accelerate plan) as the social posting backend. Users connect their social accounts in Zernio, copy their Zernio account IDs, paste them into Connected Accounts page. Master `ZERNIO_API_KEY` is set as a CF env var.

### Citations Cloud Run
The `startCitationsJob` function creates a Firestore batch doc but the actual submission automation (Playwright + 2Captcha) runs in a separate Cloud Run service at github.com/Reboostm/ReBoost-Citations. That service polls for 'queued' batches and updates status in real-time.

---

## Tailwind CSS Variables (from `src/index.css`)

All colors use `hub-*` prefix:
```
hub-bg, hub-sidebar, hub-card, hub-input, hub-border
hub-text, hub-text-secondary, hub-text-muted
hub-blue, hub-green, hub-red, hub-yellow, hub-orange
```

---

## Where I Got Confused (For Next Claude)

**The CLAUDE.md had the tech but was missing the business logic. Here's what I misunderstood:**

### ❌ Wrong Understanding
- Lead Gen = "Bulk scraper to resell leads to many agencies" → Actually: "Help plumber find contractors in their city"
- Content Calendar = "Generic content library users browse" → Actually: "Pre-done 12-month niche-specific daily content auto-loaded on signup"
- Offers/Credits = "Users understand crypto-like 'credits'" → Actually: "Simple: Buy 50 leads for $47, not 'spend 1 credit for ~60 leads'"
- The whole system = "Standalone tools" → Actually: "Each tool is an upsell stepping stone to DFY services"

### ✅ What to Remember
- **Every feature should ask: "Does this move them toward DFY?"** Plumber buys leads → gets low response → upgrades to scheduler + content → sees better results → hires us for full service.
- **The niche is EVERYTHING.** A plumber sees plumbing content, HVAC contractor sees HVAC content. Not generic.
- **The funnel is the business model.** It's not "let's build cool tools" — it's "let's build the perfect sequence to convert a plumber → DFY client."
- **Marketing first, tech second.** The reason for technical decisions should be clear (e.g., "we use Zernio so we don't have to build social APIs").

---

## Admin Bootstrap (First-Time Setup)

1. Create account at `/signup`
2. Navigate to `/setup`
3. Click "Claim Admin Role" → calls `claimAdminRole` CF
4. CF sets `role: 'admin'` in user doc and locks `settings/adminClaimed`
5. Only works once — subsequent attempts throw `already-exists`

---

## Latest Session Summary (April 28, 2026)

### ✅ Completed This Session

1. **Rank Tracker Mobile/Desktop Simultaneous Tracking**
   - Changed from radio button (single device) to multi-select checkboxes (mobile + desktop)
   - Keywords now grouped by (keyword, domain, city, state) — shows one card with both ranks side-by-side
   - Individual check buttons per device
   - Single delete button removes both entries
   - Added keyword auto-suggestions based on domain + city

2. **Citations Backend Expansion (All 3 Phases Built)**
   - **Phase 1 (MVP):** businessHours + description fields added to Profile Settings
   - **Phase 2 (Full Submission):** New `/citations/setup` page with:
     - Logo upload (up to 5MB)
     - Short/long business descriptions
     - Public email option
     - All social profiles (Facebook, Instagram, LinkedIn, Twitter, YouTube, TikTok)
   - **Phase 3 (Optimization):** Advanced fields in expandable sections:
     - Service areas, year established, license number & state, certifications, payment methods
   - **Backend:** Expanded validators, updated startCitationsJob() CF, integrated with Firestore
   - **UI:** Added "Configure Info" button in CitationsHome linking to CitationsSetup

3. **UI/UX Polish**
   - Widened HUB sidebar (w-60 → w-72) for better label breathing room
   - Renamed "Content Calendar" to "Celebrity Content" throughout:
     - Sidebar.jsx, TopBar.jsx, CalendarView.jsx
   - Also widened separate Citations app sidebar (w-64 → w-80)

4. **Documentation**
   - Created `CITATIONS_BACKEND_ANALYSIS.md` — investigation of what's missing
   - Created `CITATIONS_EXPANSION_COMPLETE.md` — rollout guide with testing checklist
   - Updated this CLAUDE.md with current status

### 🔧 Technical Details

**Files Modified:** 10  
**New Files:** 1 (CitationsSetup.jsx)  
**Lines Added:** 700+  
**Commits:** 4

**Key Changes:**
- `src/utils/validators.js` — Added profileSchema + citationsSetupSchema
- `src/pages/citations/CitationsSetup.jsx` — NEW comprehensive form (350+ LOC)
- `functions/src/index.js` — Expanded businessData object for all 3 phases
- `src/App.jsx` — Added `/citations/setup` route
- `src/pages/citations/CitationsHome.jsx` — Added "Configure Info" button
- `src/pages/ranktracker/Keywords.jsx` — Grouped mobile/desktop display

### ⏳ Known Issues

1. **Vercel Deployment Stuck**
   - Recent commits aren't showing as "Current" deployment
   - Need to trigger redeploy or check Vercel project settings
   - Local build works; `npm run dev` ready for testing

2. **Cloud Run Status Unknown**
   - `startCitationsJob` creates queued batches
   - Awaiting confirmation: Is separate Cloud Run service deployed?
   - Is it polling Firestore and processing batches?

### 🎯 Next Session Priorities

1. **Fix Vercel Build**
   - Confirm current branch deployed as "Production"
   - Verify no build errors

2. **Test Citations End-to-End**
   - Fill Profile → businessHours + description
   - Navigate to `/citations/setup` → fill form
   - Click "Start Submission"
   - Check Firestore batch status
   - Verify Cloud Run picks up queued batches

3. **Phase 2b: Content Calendar with Scheduler Integration**
   - Add "Add to Scheduler" button in Content Library
   - Modal for scheduling WITHOUT leaving page
   - Upgrade messaging for non-subscribers

---

## Phase 1 Complete ✅

- [x] Offers management (admin creates/edits offers dynamically, no code changes needed)
- [x] Pricing page (shows active offers, clients buy from `/pricing`)
- [x] Stripe integration (checkout sessions, billing portal, webhooks)
- [x] API Keys admin page (fully editable, added 2Captcha support)
- [x] Better error handling (clear messages when Stripe customer ID missing, etc.)

---

## Phase 2 (NEXT) — Feature Redesigns

1. **Lead Generator Redesign**
   - Add Google Maps preview (show found leads before purchase)
   - Replace "credits" with "lead packages" (50 leads - $47, 150 leads - $97, etc.)
   - Show lead volume estimate before charging
   - Support state-wide multi-city search as premium option

2. **Content Calendar (Celebrity Content)**
   - Full rebuild of ContentLibrary.jsx + TemplateEditor.jsx
   - Fetch niche-specific templates from admin Content Manager
   - Fabric.js editor for clients to customize templates
   - Export to Scheduler or download as images

3. **Rank Tracker Improvements**
   - Mobile/Desktop simultaneous tracking (one keyword, both metrics)
   - Auto-detect keywords from business URL + niche
   - Scheduled weekly rank checks (Firebase Scheduled Function)

---

## Phase 3 (POLISH) — UX Refinements

1. Add "Upgrade" buttons throughout (Billing tab, Content Calendar page, etc.)
2. Refine NICHES list (remove non-service businesses: restaurants, retail, gyms)
3. Pre-populate niche content when user signs up
4. Finalize all placeholder copy (outreach templates, service descriptions)
