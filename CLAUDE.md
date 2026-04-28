# ReBoost Hub — Claude Project Context

## What This Is

ReBoost Hub is a multi-tool SaaS platform for local businesses, built and operated by ReBoost Marketing (Justin's agency). Clients log in to access SEO, leads, content, and reputation tools. Justin (admin/staff) can unlock tools per client from the admin panel.

**Live repo:** https://github.com/Reboostm/reboostm-reboost-hub  
**Deployed on:** Vercel (frontend) + Firebase Cloud Functions (backend)  
**Firebase project:** `reboost-hub`

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

| Module | Status | Notes |
|---|---|---|
| SEO Audit | ✅ Built | PageSpeed + GMB check, reports UI |
| Citations Manager | ✅ Built | Batch submission system; Cloud Run automation engine is separate |
| Lead Generator | ✅ Built | Google Maps Places search, key rotation, CSV export, outreach templates |
| Content Scheduler | ✅ Built | Calendar view, post composer, platform connections via Zernio |
| AI Content Creator | ✅ Built | Caption gen (Claude), image gen (DALL-E 3), "Use in Scheduler" flow |
| Review Manager | ✅ Built | Google reviews display, review request emails via SendGrid |
| Local Rank Tracker | ✅ Built | Keyword tracking, SerpAPI rank checks, history + sparklines |
| Agency & Services | ✅ Built | Territory checker (Firestore), DFY services page |
| Celebrity Content Calendar | ⏳ Placeholder | ContentLibrary.jsx, TemplateEditor.jsx not yet built |
| Admin Panel | ✅ Built | Users (create/role/reset), Clients (manage access), API Keys tab |
| Settings | ✅ Built | Profile, Billing (Stripe portal), Integrations pages exist |
| Stripe Integration | ⏳ Stub | createCheckoutSession + createPortalSession CFs exist; webhook auto-unlock not wired |

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

## Admin Bootstrap (First-Time Setup)

1. Create account at `/signup`
2. Navigate to `/setup`
3. Click "Claim Admin Role" → calls `claimAdminRole` CF
4. CF sets `role: 'admin'` in user doc and locks `settings/adminClaimed`
5. Only works once — subsequent attempts throw `already-exists`

---

## Pending / Next Steps

1. **Lead Generator redesign** — state-wide bulk scraping, lead count before purchase, charge per batch size. Current 60-lead limit is insufficient for the vision.
2. **Celebrity Content Calendar** — `ContentLibrary.jsx` + `TemplateEditor.jsx` placeholders. Fabric.js editor for niche content templates.
3. **Stripe webhooks** — auto-unlock tools on successful payment. `createCheckoutSession` + `createPortalSession` CFs are stubbed.
4. **Admin Packages + Territories pages** — Packages.jsx and Territories.jsx are placeholders in the admin panel.
5. **Content copy review** — all placeholder text (outreach templates, service descriptions) needs final copy pass.
6. **Rank Tracker scheduled checks** — currently on-demand only; add Firebase Scheduled Function to auto-check weekly.
