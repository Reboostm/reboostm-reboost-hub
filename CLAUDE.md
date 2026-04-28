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
- **First-login forces profile** — User must select niche + fill business info before accessing tools. Admins are EXEMPT from this check.
- **Content pre-loads by niche** — When Celebrity Content user signs up, ALL plumbing content loads. HVAC user gets all HVAC content. They never see irrelevant niches.
- **Every feature asks:** "Does this move them toward DFY?" If not, it's probably scope creep.

---

## Technical Stack

**Live repo:** https://github.com/Reboostm/reboostm-reboost-hub
**Deployed on:** Vercel (frontend, auto-deploys `main` branch) + Firebase (backend/functions)
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

## Deployment Architecture

### Vercel (Frontend)
- Auto-deploys `main` branch to production
- All changes must be pushed to `main` to go live
- Claude work happens in worktree branches (`claude/xxx`), then merged to `main`
- `vercel.json` has SPA rewrites: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`

### Firebase Rules Auto-Deploy (GitHub Actions)
- File: `.github/workflows/deploy-firebase.yml`
- Triggers automatically when `firestore.rules` changes on `main`
- Uses `google-github-actions/auth@v2` with `FIREBASE_SERVICE_ACCOUNT` secret

**⚠️ ONE-TIME SETUP NEEDED (browser-only, no terminal):**
1. Firebase Console → `reboost-hub` project → gear icon → **Project Settings** → **Service accounts** tab → **Generate new private key** → downloads JSON
2. Copy entire JSON content
3. GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret** → name: `FIREBASE_SERVICE_ACCOUNT` → paste JSON → Save

Until this is done, Firestore rules must be deployed manually via Firebase CLI.

---

## Project Structure

```
src/
  App.jsx                        # All routes
  config.js                      # HUB_NAME='ReBoost Marketing HUB', NICHES[], US_STATES[]
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
      ImageEditor.jsx            # Custom canvas-based image editor (NOT Fabric.js)
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
    ranktracker/   Keywords.jsx, RankingsReport.jsx
    calendar/      CelebrityContent.jsx
    agency/        AgencyServices.jsx  (TerritoryChecker embedded inside)
    settings/      Profile.jsx, Billing, Integrations
    support/       TrainingAndSupport.jsx
    admin/
      Dashboard.jsx, Users.jsx (combined Users+Clients), ApiKeys.jsx,
      Offers.jsx, Territories.jsx, ContentManager.jsx

functions/src/index.js           # All Cloud Functions (CommonJS only)
.github/workflows/
  deploy-firebase.yml            # Auto-deploy Firestore rules on push to main
firestore.rules                  # Security rules (deployed via GitHub Actions)
```

---

## Critical Patterns — Read Before Touching Code

### NICHES config
`NICHES` in `src/config.js` is an array of `{ value, label }` objects — NOT strings.
```js
{ value: 'plumber', label: 'Plumber' }
```
Always use `niche.value` for keys/queries/filters and `niche.label` for display. Passing a NICHES object directly as a React child causes Error #31.

### Sidebar navigation
Two patterns in `Sidebar.jsx`:
- **Direct sections** (single link, no dropdown): use `direct: '/path'` + `items: []`
- **Dropdown sections** (expandable): use `items: [{ label, path }]`, no `direct` property
- Celebrity Content and DFY Services use `direct` pattern.

### Role hierarchy
`admin` > `staff` > `client`. `isStaff()` = admin OR staff. Admins bypass billing checks and profile force.

### Firestore rules
Rules file is at `firestore.rules`. Changes push to GitHub but only auto-deploy if FIREBASE_SERVICE_ACCOUNT secret is set up. Until then, manually run `firebase deploy --only firestore:rules`.

### URL validation
`src/utils/validators.js` uses `z.preprocess` to auto-prepend `https://` to website URLs that don't have a protocol. Do not change this pattern.

---

## Firestore Data Model

### `users/{uid}`
```js
{
  email, displayName, businessName, niche, phone, address, city, state, zip,
  website, tagline, currentOffer, role,
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

### `content/{id}` — Celebrity Content templates
```js
{
  niche: 'plumber',        // matches NICHES[n].value
  title: 'Spring Tips',
  description: '...',
  imageUrl: 'https://...',
  month: 'April',
  year: 2026,
  createdAt,
}
```

### `offers/{id}` — Dynamic pricing
```js
{
  name: 'Scheduler Pro',
  description: '10 accounts, unlimited posts',
  price: 99,
  stripePriceId: 'price_xxx',
  type: 'subscription' | 'payment',
  unlocksFeature: 'scheduler' | 'reviewManager' | 'rankTracker' | 'citations' | 'leadCredits' | 'calendar',
  tier: 'basic' | 'pro' | '',
  active: true,
}
```

### `trainingVideos/{id}` — Training videos
```js
{
  section: 'Citations',      // groups videos into sections
  description: '...',
  youtubeUrl: 'https://youtube.com/watch?v=xxx',
  createdAt,
}
// Special doc: trainingVideos/_sectionOrder = { order: ['Section A', 'Section B', ...] }
// Stores staff-defined section ordering. Filtered out when loading videos.
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
| `supportTickets/{id}` | User support tickets (staff read, user create) |
| `helpArticles/{id}` | Help articles (staff write, auth read) |

---

## Firestore Security Rules Summary

All rules are in `firestore.rules`. Key patterns:
- `isAuth()` = any signed-in user
- `isOwner(uid)` = document belongs to this user
- `isAdmin()` = role == 'admin'
- `isStaff()` = role == 'admin' OR 'staff'

| Collection | Read | Write |
|---|---|---|
| `users` | owner OR staff | owner (create/update), admin (delete) |
| `content` | isAuth | isStaff |
| `offers` | isAuth | isStaff |
| `trainingVideos` | isAuth | isStaff |
| `helpArticles` | isAuth | isStaff |
| `supportTickets` | isStaff | isAuth (create only) |
| `trackedKeywords` | owner OR staff | isAuth (create), owner OR admin (delete) |
| `settings` | isAdmin | isAdmin |
| `territories` | public | isAdmin |

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

## Cloud Functions (`functions/src/index.js`)

All use `onCall`. CommonJS only. Never use ES module syntax.

| Function | Purpose | Env Var |
|---|---|---|
| `runSeoAudit` | PageSpeed + GMB check | `PAGESPEED_API_KEY`, `GOOGLE_PLACES_KEY` |
| `startCitationsJob` | Create citations batch | — |
| `searchLeads` | Google Maps search + key rotation | `GOOGLE_PLACES_KEY` |
| `generateAIContent` | Generate captions via Claude | `ANTHROPIC_API_KEY` |
| `generateAIImage` | Generate images via DALL-E 3 | `OPENAI_API_KEY` |
| `schedulePost` | Call Zernio to schedule | `ZERNIO_API_KEY` |
| `fetchReviews` | Google reviews cache | `GOOGLE_PLACES_KEY` |
| `sendReviewRequest` | Email reviews via SendGrid/Resend | `SENDGRID_API_KEY` or `RESEND_API_KEY` |
| `checkKeywordRank` | Rank check via SerpAPI | `SERPAPI_KEY` |
| `getGoogleKeywordSuggestions` | Real Google autocomplete via SerpAPI | `SERPAPI_KEY` |

---

## Module Build Status

| Module | Status | Notes |
|---|---|---|
| SEO Audit | ✅ Complete | PageSpeed + GMB |
| Citations | ✅ Complete | All 3 phases |
| Lead Generator | ✅ Basic | Needs package redesign (credits → packages) |
| Content Scheduler | ✅ Complete | Zernio integration |
| AI Creator | ✅ Complete | Claude captions + DALL-E 3 images |
| Review Manager | ✅ Complete | Google reviews + email |
| Rank Tracker | ✅ Enhanced | Mobile/desktop tracking + Google keyword suggestions |
| Celebrity Content | ✅ Built | Calendar + library + image editor. Needs categories + bulk upload |
| Training & Support | ✅ Built | Videos (section ordering), Articles, Support Tickets |
| Admin Panel | ✅ Enhanced | Users+Clients combined, Dashboard timeframe, API Keys |
| Billing & Stripe | ✅ Complete | Checkout, portal, webhooks, dynamic offers |
| DFY Services / Agency | ✅ Built | Territory checker embedded, strategy CTA |

---

## Session History

### Sessions 1–5 (pre-context)
Core build: all major modules, Stripe integration, Firebase setup, basic admin panel.

### Session 6 (April 2026)
- Built Celebrity Content system (calendar + content library + image editor)
- Built ContentManager admin (niche/month tagging, image URL upload)
- Built proprietary ImageEditor.jsx (HTML5 Canvas, NOT Fabric.js)
- First-login profile force (ProtectedRoute redirects to /settings)
- Added RESEND_API_KEY support in ApiKeys admin

### Session 7 (April 2026) — THIS SESSION
**Completed:**
1. App renamed from "ReBoost Hub" → **"ReBoost Marketing HUB"** (config.js `HUB_NAME`)
2. Admin Users + Clients tabs merged into single `Users.jsx` page with role filtering + Manage Access modal
3. `TrainingAndSupport.jsx` — full page built: YouTube video sections with ↑↓ reordering, help articles, support tickets
4. Admin Dashboard — signup timeframe filter (7d / 30d / 90d / all)
5. ProtectedRoute — admins bypass profile force check
6. ContentManager — fixed React Error #31 (NICHES objects rendered as children)
7. Firestore rules — expanded with: citations, reviewRequests, trackedKeywords, supportTickets, trainingVideos, helpArticles, offers/content write changed to isStaff()
8. DFY Services / Agency — renamed sidebar to "DFY Services", Territory Checker embedded in AgencyServices
9. URL validation — `z.preprocess` auto-prepends https:// to website URLs
10. Celebrity Content — admin bypass (no niche required for staff)
11. Modal — fixed scrollability (max-h + overflow-y-auto)
12. Profile page — cleaned up, removed Citations Info section
13. Rank Tracker — keyword suggestions overhauled: 50+ niche-aware suggestions (service-specific + universal local patterns)
14. Rank Tracker — `getGoogleKeywordSuggestions` Cloud Function added (SerpAPI autocomplete → real Google searches)
15. Rank Tracker keyword modal — niche selector dropdown + city/state auto-fill from profile
16. GitHub Actions workflow — `.github/workflows/deploy-firebase.yml` auto-deploys `firestore.rules` on push to main
17. Vercel auto-deploy fixed — all changes now push to `main` directly (Vercel auto-promotes)

---

## ⚠️ Known Issues & Pending Work

### CRITICAL — One-Time Setup Required
**Firestore Rules are NOT deployed to Firebase yet.** The rules file is correct in the repo, but Firebase is still using old rules. This causes permission errors for:
- Creating/editing Offers (`/admin/offers`)
- Adding Training Videos and Help Articles (`/support`)
- Adding Rank Tracker keywords
- Submitting Support Tickets

**Fix:** Set up `FIREBASE_SERVICE_ACCOUNT` GitHub secret (see Deployment Architecture section above). Once set, GitHub Actions auto-deploys rules on every `main` push.

**Also:** `getGoogleKeywordSuggestions` Cloud Function needs to be deployed to Firebase Functions. Until then, the "Real Google Searches" section in Rank Tracker keyword suggestions won't appear (fails silently — other suggestions still work).

### Content Manager — Bulk Upload
- Currently uses an "Image URL" field — admin must paste image URLs
- User has bulk Canva content (organized by niche: real estate, plumber, HVAC, etc.)
- **Needs:** Firebase Storage upload integration so images can be uploaded directly
- **Canva workflow:** User exports images from Canva → uploads directly in ContentManager → tagged by niche/month

### Celebrity Content — Categories
- User has content organized by type: "funny posts", "elegant stories", "checklists", etc.
- **Needs:** Add a `category` field to content documents + filter UI in Celebrity Content page
- Categories to support: funny, educational, promotional, checklist, story, seasonal

### Lead Generator — Package Redesign
- Currently uses a simple credit system
- **Needs:** Redesign to sell lead packages (e.g., "50 leads for $X") instead of individual credits
- Packages should map to Offers in Firestore

### Stripe Webhook — Funnel Integration
- When someone purchases via external sales funnel, Hub doesn't know
- **Needs:** `handleStripeWebhook` Cloud Function that maps product purchase → user access update → sends welcome email with login link
- Architecture planned, not yet built

### Future / Phase 3
- [ ] Video Package upsell unlock mechanism (content not filmed yet)
- [ ] Scheduler integration from Celebrity Content ("Schedule This" button → Scheduler)
- [ ] Upgrade upsell buttons throughout app (locked tools → buy modal)
- [ ] First-time user onboarding flow / welcome tour

---

## Key Design Notes

### No Fabric.js
Custom canvas editor for image editing. Simpler for text-only use case, no external dependencies.

### Niche value vs label
NICHES has `{ value: 'plumber', label: 'Plumber' }`. The `niche` field stored in user profiles = the `value` (lowercase). The `content` collection also uses `value`. Always use `niche.value` when querying/filtering.

### Training video section order
Stored in `trainingVideos/_sectionOrder` as `{ order: string[] }`. This special doc is filtered out when loading video list. Staff can reorder sections with ↑↓ buttons in the UI.

### YouTube URL regex
Handles all formats: `youtube.com/watch?v=`, `youtu.be/`, `youtube.com/embed/`, `youtube.com/shorts/`
```js
/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/
```

---

## Starter Message for Next Session

Copy this into the next Claude chat:

---

**Session 8 — ReBoost Marketing HUB**

We're building a marketing & sales funnel hub for local service businesses. This is a React 19 + Vite + Firebase app deployed on Vercel. Everything lives at `C:\Users\justi\Desktop\ReBoost HUB`. The CLAUDE.md in that directory has full context — read it before doing anything.

**Quick status:**
- App name: "ReBoost Marketing HUB"
- All code is up to date on `main` branch (Vercel auto-deploys from main)
- Firestore rules are in `firestore.rules` but NOT deployed to Firebase yet — need the GitHub Actions secret set up (instructions in CLAUDE.md)
- Several Cloud Functions need deployment too

**Priority tasks for this session:**
1. Content Manager bulk upload — replace Image URL field with Firebase Storage upload so owner can upload Canva images directly
2. Celebrity Content categories — add category field (funny, educational, promotional, checklist, story, seasonal) + filter UI
3. Stripe webhook / funnel integration — when someone buys via external funnel, grant Hub access automatically
4. OR: whatever the owner brings up

**Critical rules:**
- NICHES is `{ value, label }` objects — never render them directly as React children
- Firestore rules changes auto-deploy via GitHub Actions once the FIREBASE_SERVICE_ACCOUNT secret is set
- Push all changes to `main` — Vercel auto-promotes
- No Fabric.js — custom canvas editor only
- CommonJS only in Cloud Functions (no ES module syntax)

---
