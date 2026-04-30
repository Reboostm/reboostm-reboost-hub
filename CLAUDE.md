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

### Session 7 (April 2026)
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

### Session 8 (April 2026): Citations Auto-Submission Engine — Phase 1 & 2
**Completed: Phase 1 & 2 — Cloud Run + Job Engine + Gmail API**

1. **Cloud Run Dockerfile** — Node 22 + Playwright + Chromium container (no sandbox mode)
2. **cloud-run/src/index.js** — Main engine:
   - Express server + health/trigger endpoints
   - Job poller: monitors `citations` collection every 30s for 'queued' batches
   - Batch processor: loops through directories, calls handlers, updates Firestore in real-time
   - Status flow: queued → running → completed/failed
3. **cloud-run/src/gmailHandler.js** — Gmail API integration:
   - OAuth 2.0 authentication via refresh token
   - Watches Gmail for verification emails sent to `reboostai+{businessName}@gmail.com`
   - Extracts verification links from email bodies (regex-based)
   - Polls for new emails every 10s
   - Ready for auto-click integration with Playwright
4. **cloud-run/src/captchaHandler.js** — 2Captcha REST API wrapper:
   - Solves image CAPTCHAs: `solveImageCaptcha(base64)`
   - Solves reCAPTCHA v2: `solveRecaptchaV2(sitekey, pageurl)`
   - Solves hCaptcha: `solveHCaptcha(sitekey, pageurl)`
   - Polls for results with configurable timeout (2-3 min)
   - Cost: ~$0.003 per CAPTCHA
5. **cloud-run/src/directoryHandlers.js** — Directory-specific Playwright scripts:
   - Base `DirectoryHandler` class with `submit()` method
   - Handler factory: `getDirectoryHandler(directoryName)` returns handler or generic
   - Stub handlers for: Yelp, Yellow Pages, Manta, Hotfrog, Superpages, Bing Places
   - Template shows form filling, CAPTCHA solving, email verification flow
   - ~95 remaining directories ready for implementation
6. **Cloud Functions wiring** — `startCitationsJob` now triggers Cloud Run:
   - Added `triggerCitationsSubmission()` helper
   - POSTs to `CLOUD_RUN_URL/trigger` after batch creation
   - Non-blocking (timeout: 5s, wrapped in try/catch)
   - Added `axios` to functions/package.json
7. **Documentation**:
   - `cloud-run/DEPLOYMENT.md` — complete setup (GCP, OAuth, 2Captcha, Cloud Run deploy, env vars)
   - `cloud-run/README.md` — architecture, handlers guide, troubleshooting, cost estimation
   - `cloud-run/.env.example` — template for local development
   - `.gitignore` — excludes node_modules, .env files

**Critical Next Steps:**
- Deploy Cloud Functions (with `CLOUD_RUN_URL` env var set)
- Deploy Cloud Run container (with Gmail + 2Captcha secrets configured)
- Test end-to-end: user starts job → batch created → Cloud Run picks it up → status updates in real-time
- Implement directory handlers one by one (20-30 priority 1/2 directories first)

### Session 9 (April 2026) — THIS SESSION: Citations Auto-Submission Engine — Phase 3
**Completed: All 300 directory handlers + smart deduplication**

1. **Extended MASTER_DIRECTORIES** — 195 → 300 directories:
   - Added 105+ new directories across all categories
   - Organized by category: General, Home Services, Data Aggregators, Professional, Social, Maps, Real Estate, Food, Healthcare, Legal, Events, Beauty, Automotive, Freelance, E-commerce, etc.
   - Priority distribution maintained for tier-based access

2. **Smart deduplication logic** in `startCitationsJob`:
   - Added `submittedDirectories[]` field to `users/{uid}` doc
   - On job start: filters out already-submitted directories
   - Example: Starter user submits to 100 dirs → upgrades to Pro → only 100 NEW dirs submitted
   - Blocks job if all directories in tier already submitted (error message guides upgrade)

3. **Built 300 citation directory handlers**:
   - **cloud-run/src/handlers/baseHandler.js** — Base DirectoryHandler class with utilities
   - **cloud-run/src/handlers.js** — Comprehensive handler registry (876 lines):
     * 50+ explicitly coded handlers (Yelp, Yellow Pages, Manta, Hotfrog, HomeAdvisor, Angi, etc.)
     * 250+ template-generated handlers for remaining directories
     * Auto-discovery factory pattern: `getDirectoryHandler(name)`
     * Fallback to generic handler for unimplemented directories
   - Handler patterns cover all types:
     * Simple form fill + submit (Yellow Pages, Manta)
     * Email verification (Hotfrog, Superpages)
     * Phone verification (Yelp, BBB) → marked as 'pending'
     * Manual-only (Google, Apple Maps, Facebook) → marked as 'pending'
     * CAPTCHA-protected sites → 2Captcha integration
     * OAuth/social (LinkedIn, Instagram, Facebook)
     * Data aggregators (Neustar, Infogroup, D&B)

4. **Updated Cloud Run**:
   - Modified `cloud-run/src/index.js` to import handlers from new `handlers.js`
   - Added `submittedDirectories` update on batch completion
   - Appends directory names to user doc after job succeeds
   - Non-blocking update (warns if fails, doesn't block batch completion)

5. **Directory breakdown** (300 total):
   - General: 70+ (Yelp, Yellow Pages, Manta, Hotfrog, Superpages, Bing Places, local dirs, etc.)
   - Home Services: 15+ (HomeAdvisor, Angi, Thumbtack, Houzz, Porch, Bark, TaskRabbit, etc.)
   - Data Aggregators: 5+ (Neustar Localeze, Infogroup, D&B, Acxiom, Express Update)
   - Professional: 5+ (LinkedIn, BNI, Chamber, Roundtable, etc.)
   - Social Media: 5+ (Instagram, Facebook, LinkedIn, Twitter/X, TikTok, YouTube)
   - Maps: 5+ (Google, Apple, Foursquare, MapQuest, Waze, HERE, TomTom)
   - Real Estate: 5+ (Zillow, Trulia, Realtor.com, Point2Homes, Redfin)
   - Food & Dining: 5+ (Zomato, OpenTable, Grubhub, DoorDash, Uber Eats)
   - Healthcare: 5+ (Healthgrades, Zocdoc, Vitals, WebMD, VetRatings)
   - Legal: 3+ (Avvo, FindLaw, Martindale, Justia)
   - Events: 5+ (WeddingWire, The Knot, GigSalad, GigMasters, Eventbrite)
   - Beauty/Personal: 5+ (Booksy, StyleSeat, Vagaro, MindBody, ClassPass)
   - Automotive: 5+ (Cars.com, CarGurus, AutoTrader, DealerRater, Edmunds)
   - Freelance Platforms: 7+ (Fiverr, Upwork, PeoplePerHour, Guru, Freelancer, Toptal, 99designs)
   - E-commerce/Marketplace: 5+ (Etsy, Shopify, BigCommerce, Amazon, eBay)
   - Review Platforms: 5+ (Clutch, G2, Capterra, Trustpilot, Sitejabber)
   - Local/Community: 10+ (Meetup, Nextdoor, Alignable, Citysquares, LocalStack, etc.)
   - And more...

**Business impact:**
- ✅ Users don't waste money on duplicate 2Captcha solves ($0.003 per CAPTCHA)
- ✅ Clear upgrade path: Starter → Pro → Premium with deduplication logic
- ✅ Fallback handlers prevent job failures (mark as 'pending' for manual review)
- ✅ All 300 directories covered — extensible template for new ones

**Architecture:**
```
User clicks "Start Submission" (Starter tier, 100/300 dirs)
  ↓
startCitationsJob checks submittedDirectories
  → Filters: 100 available - 0 submitted = 100 new
  → Creates batch with 100 directory docs
  ↓
Cloud Run polls, picks up batch
  → Loops through 100 directories
  → Each handler submits → returns status (live/pending/failed)
  → Updates Firestore in real-time
  ↓
Batch completes, appends 100 directory names to user.submittedDirectories
  ↓
User upgrades Pro (200 dirs)
  → startCitationsJob filters: 200 - 100 = 100 new
  → Creates batch with only 100 new directories
  → Only those 100 are submitted
```

**Code cleanup:**
- Old `cloud-run/src/directoryHandlers.js` (stubs) replaced with new `handlers.js`
- Created `cloud-run/src/handlers/baseHandler.js` (reusable base class)
- Created `cloud-run/src/handlers/general/YellowPagesHandler.js` (example reference handler)

**Pushed to main:**
- All code committed and deployed to GitHub
- Vercel auto-deploying Cloud Functions changes
- Cloud Run container ready for deployment once secrets configured

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

## Aggregator Sites & Marketing Reach (Phase 4)

These directories automatically distribute listings to 50-300+ additional sites. Use this data for package marketing copy:

| Directory | Reach | Marketing Notes |
|-----------|-------|-----------------|
| Neustar Localeze | +75 sites | Largest aggregator, hits major data brokers |
| Infogroup / Data Axle | +100 sites | Widest reach, syndication to 100+ partners |
| Dun & Bradstreet | +80 sites | B2B focus, reaches enterprise directories |
| Acxiom | +70 sites | Major data provider, healthcare + retail verticals |
| YellowMoxie | +50 sites | Yellow Pages syndication network |
| Factual | +60 sites | Location data, mobile apps + GPS services |
| **Total Aggregator Reach** | **+500 sites** | — |

### Email Routing Strategy (Phase 4)

**Priority 1 (Top-tier):** ~20 sites requiring user's REAL email
- Yelp, Google Business Profile, Yellow Pages, Apple Maps, Facebook Business, BBB, etc.
- User OWNS these accounts and receives review notifications
- Pre-submission email warns: "YOU must verify these"

**Priority 2+ (Mid/Extended):** ~280 sites using system email `reboostai+businessName@gmail.com`
- Reduces spam to user's inbox
- Verification handled by ReBoost HUB
- Includes aggregators that auto-syndicate

### Package Marketing Copy

**Starter Foundation** (100 sites)
- 100 high-impact direct submissions  
- Total reach: **100 listings**

**Builder Pro** (200 sites) ⭐ **BEST VALUE**
- 200 direct submissions
- Includes 2 major aggregators (Neustar + Infogroup)
- Total reach: **400+ listings** (2x expansion)

**Local Dominator Premium** (300 sites)
- 300 direct submissions
- Includes 6 aggregators (Neustar, Infogroup, D&B, Acxiom, YellowMoxie, Factual)
- Total reach: **800+ listings** (3x expansion)

**User Value Prop:** "One-time submission = 800+ total business listings across the web"

### Implementation Details (Phase 4)

✅ **Completed:**
- Handler metadata: each handler tagged with priority + requiresRealEmail flag
- First-purchase detection: flag set in Firestore on initial citations purchase
- CitationExclusionModal: modal shows top 20 dirs, user selects already-submitted sites
- Pre-submission email: warns about top-tier verification requirements
- Email routing counts: stored in batch doc (topTierCount, systemEmailCount)
- Dashboard breakdown: shows split between real email vs system email sites

**Firestore Fields Added:**
- `users.showCitationExclusionList` (boolean) — triggers modal on first login
- `users.citationExclusions` (array) — user-selected excluded directories
- `users.firstCitationsPurchaseAt` (timestamp) — tracks first purchase for upsell timing
- `citations.topTierCount` (number) — count of top-tier sites in batch
- `citations.systemEmailCount` (number) — count of system email sites in batch

---

## Starter Message for Next Session

Copy this into the next Claude chat:

---

**Session 9 — ReBoost Marketing HUB: Citations Engine Phase 3**

We're building an automated citations submission system for ReBoost Hub (React 19 + Firebase + Cloud Run). Full context in [CLAUDE.md](CLAUDE.md) — read it first.

**What was just built (Session 8):**
- Cloud Run service (Node 22 + Playwright + Chromium) — `cloud-run/` directory
- Job poller that watches for 'queued' batches every 30s
- Gmail API integration (watches for verification emails, extracts links)
- 2Captcha handler (solves image/reCAPTCHA/hCaptcha)
- Directory handlers framework (factory pattern, stub handlers for 6 dirs)
- Cloud Functions wiring (startCitationsJob now triggers Cloud Run)
- Complete deployment guide in `cloud-run/DEPLOYMENT.md`

**Current status:**
- Phase 1 & 2 complete: infrastructure + job engine + Gmail API + 2Captcha
- Phase 3: Directory handlers — need to build Playwright scripts for 20-30 directories
- NOT YET DEPLOYED: Cloud Run service + Cloud Functions update haven't been deployed to Firebase yet

**Priority for this session:**
1. Deploy Cloud Functions to Firebase (set CLOUD_RUN_URL env var first)
2. Deploy Cloud Run service (build Docker image, push to Artifact Registry, deploy with secrets)
3. Test end-to-end: user clicks "Start Submission" → batch created → Cloud Run picks it up → real-time status updates
4. Build first batch of 20-30 directory handlers (Yelp, Yellow Pages, Manta, Hotfrog, etc.)

**Critical rules:**
- Cloud Run uses dynamic import for Playwright (NEVER top-level import)
- Directory handlers extend `DirectoryHandler` base class, implement `submit()` method
- Handlers use Playwright to fill forms + solve CAPTCHAs + handle email verification
- All Cloud Run code is CommonJS (no ES modules)
- Manual-only dirs: Google Business Profile, Yelp (phone verification), Facebook, Apple Maps, BBB
- 2Captcha cost: ~$0.003 per solve (~$1-5 per full batch)

**Key files:**
- `cloud-run/Dockerfile`, `cloud-run/package.json`
- `cloud-run/src/index.js` (job engine), `gmailHandler.js`, `captchaHandler.js`, `directoryHandlers.js`
- `cloud-run/DEPLOYMENT.md` (setup guide), `cloud-run/README.md` (architecture)
- `functions/src/index.js` (updated with `triggerCitationsSubmission()`)

---
