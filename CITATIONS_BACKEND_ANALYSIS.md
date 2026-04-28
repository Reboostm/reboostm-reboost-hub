# Citations Backend Investigation

## Current Architecture Overview

The ReBoost Citations system is split into **two parts:**

1. **Frontend (This Repo)** — User interface for viewing batches, directories, and job progress
2. **Backend Automation (Separate Repo)** — Cloud Run service that actually submits to directories

---

## What We Have: The Frontend Flow

### User Journey:
1. User purchases a Citations package (Starter=100, Pro=200, Premium=300 directories)
2. User fills in business info in Settings → Profile (name, phone, address, city, state, zip, website, email, niche)
3. User clicks "Start Submission" in `/citations`
4. Frontend calls `startCitationsJob()` Cloud Function
5. Batch document created in Firestore with status='queued'
6. Job progress displays in `/citations/jobs` and `/citations/directories`
7. User sees real-time submission status (live/submitted/pending/failed)

### Frontend Components (What's Built):
- **CitationsHome.jsx** — Job overview, start button, stats
- **CitationsJobs.jsx** — Job history & real-time progress tracking
- **CitationsDirs.jsx** — Per-directory status table (live, submitted, pending, failed, skipped)
- **CitationsAnalytics.jsx** — Citation analytics dashboard

### Firestore Data Structure:
```
citations/{batchId}
  ├─ userId, packageId, packageTier
  ├─ status: 'queued' | 'running' | 'paused' | 'completed' | 'failed'
  ├─ submitted: 0, live: 0, pending: 100, failed: 0
  ├─ businessData: { businessName, address, city, state, zip, phone, website, email, niche }
  ├─ createdAt, startedAt, completedAt, errorMessage
  └─ directories/{dirId}
     ├─ name: 'Yelp', url: 'https://www.yelp.com'
     ├─ category: 'General', priority: 1
     ├─ status: 'pending' | 'submitted' | 'live' | 'failed' | 'skipped'
     ├─ submittedAt, liveAt, errorMessage
     └─ [Cloud Run updates these in real-time]
```

### Directory Master List:
- **300 total directories** (hardcoded in Cloud Function)
- Sorted by priority (1=highest DA, most impactful)
- Categories: General, Home Services, Social, Business, Data Aggregator, Professional, Local

---

## What's Missing: Backend Automation

### The Cloud Run Service (Separate Repo):
**Location:** github.com/Reboostm/ReBoost-Citations

**What It Does:**
1. Polls Firestore for batches with status='queued'
2. For each batch:
   - Sets status='running'
   - Spins up Playwright browser automation
   - For each directory, submits business info using 2Captcha for CAPTCHA solving
   - Updates directory status in real-time (pending → submitted → live)
   - Handles failures and retries
3. When all directories done, sets status='completed'

**Current State:** TODO comment in `startCitationsJob()` CF indicates this is NOT YET DEPLOYED
```javascript
// Line 533-535 in functions/src/index.js
// TODO: Trigger Cloud Run job here — Cloud Run polls for 'queued' batches,
//       uses Playwright + 2Captcha to submit, and updates status/counts in real-time.
//       See: github.com/Reboostm/ReBoost-Citations for the automation engine.
```

**This means:** Jobs created in frontend are queued but NEVER executed unless Cloud Run service is deployed

---

## What Needs to Be Expanded: Citations Form

### Current Business Info Fields (from Profile Settings):
- displayName ✅
- businessName ✅
- phone ✅
- website ✅
- address ✅
- city ✅
- state ✅
- zip ✅
- email ✅ (auto from auth)
- niche ✅
- tagline (extra branding)
- currentOffer (extra branding)

### Missing Fields for Full Submission:
Based on what directories need, the form likely needs expansion for:

| Field | Why | Which Directories | Current Status |
|---|---|---|---|
| Business hours | Yelp, Google, BBB, local sites | Most general + services | ❌ Not in form |
| Business description/About | BBB, Yelp, Angi, HomeAdvisor | All | ❌ Not in form |
| Service areas/Coverage area | ServiceScape, HomeAdvisor, Angi | Home services, local | ❌ Not in form |
| Business license / License #s | BBB, licensing boards | Some verticals | ❌ Not in form |
| Year established | Reputation scoring | Most | ❌ Not in form |
| Number of employees | Dun & Bradstreet, B2B | Business directories | ❌ Not in form |
| Social media handles | Facebook, Instagram, LinkedIn, Twitter | Social directories | ❌ Not in form |
| Service categories (multi-select) | HomeAdvisor, Angi, vertical sites | Categorization | ❌ Niche is single-select |
| Photos | Yelp, Google, Houzz, Porch | Visual directories | ❌ No photo upload |
| Videos | YouTube, Vimeo links | Some directories | ❌ Not in form |

### Validation Schema:
Check `src/utils/validators.js` for `profileSchema` — likely needs expansion to require these new fields when user purchases Citations.

---

## Expanded Citations Form Design

### Phase 1: Minimal Viable (Get Job Queue Working)
Just use existing fields:
- businessName ✅
- phone ✅
- address, city, state, zip ✅
- website ✅
- email ✅
- niche ✅

This is what's currently sent to Cloud Run. Cloud Run determines what each directory needs and fills in rest.

**BUT** — Cloud Run needs these additional fields for optimal submission:
- businessHours (enum: 9am-5pm, 24/7, custom)
- description (textarea)
- serviceAreas (comma-separated or multi-select cities)

### Phase 2: Full Submission (Add Missing Fields)
Add to Profile or dedicated Citations Form:
- [ ] Business hours picker (or "24/7" + custom)
- [ ] Business description (textarea)
- [ ] Service area(s) multi-select
- [ ] Year established (date picker)
- [ ] License numbers (optional fields for verified listings)
- [ ] Social handles (Facebook URL, Instagram handle, LinkedIn page)
- [ ] Photo upload (for Yelp, Google, Houzz, Porch)
- [ ] Service categories (multi-select, niche-specific options)

### Phase 3: Optional Data (Optimization)
- Videos (YouTube/Vimeo links)
- Additional phone numbers (main + support)
- Fax number
- Operating radius/service distance
- Certifications & accreditations
- Payment methods accepted

---

## Cloud Function Expectations

### What `startCitationsJob()` Currently Sends to Cloud Run:

```javascript
businessData: {
  businessName: 'Ace Plumbing',
  address: '123 Main St',
  city: 'Salt Lake City',
  state: 'UT',
  zip: '84101',
  phone: '(801) 555-1234',
  website: 'https://aceplumbing.com',
  email: 'owner@aceplumbing.com',
  niche: 'plumbing',
}
```

### What Directories Typically Require:
- **Yelp:** business name, address, phone, category, hours
- **Google Business Profile:** business name, address, phone, website, category, hours, photos
- **BBB:** business name, address, phone, email, business type, license
- **HomeAdvisor:** service categories, service area, hours, photos, description
- **Angi:** categories, area served, availability, photos
- **Social:** business name, bio/description, profile picture

---

## Next Steps to Enable Full Submissions

### Immediate (This Sprint):
1. **Verify Cloud Run Service Status**
   - Check if github.com/Reboostm/ReBoost-Citations is deployed
   - Check if it's actually polling Firestore for 'queued' jobs
   - Check Cloud Run logs for submission status

2. **Add Essential Fields to Profile Form**
   - Business hours (quick add: dropdown for 9-5, 24/7, custom)
   - Business description (textarea)
   - Service areas (if niche supports it)

3. **Update `startCitationsJob()` to Send Extra Fields**
   ```javascript
   const businessData = {
     // existing...
     hours: user.hours || '9am-5pm',
     description: user.description || '',
     serviceAreas: user.serviceAreas || [],
   }
   ```

### Later (Phase 2):
1. Create dedicated "Citations Setup" flow (separate from general Profile)
2. Add photo/video upload
3. Add social media handles
4. Improve service category selection (multi-select per niche)

---

## Quick Checklist to Enable Citations

- [ ] Verify Cloud Run service exists and is deployed
- [ ] Check if Cloud Run is polling Firestore correctly
- [ ] Check Cloud Run logs to see why jobs aren't running (if not)
- [ ] Add business hours & description fields to Profile
- [ ] Update `startCitationsJob()` to pass these to Cloud Run
- [ ] Test: Create Citations batch → Check Cloud Run processing
- [ ] Document which directories are actually working vs skipped

---

## Current Unknowns (Need Investigation)

1. **Is Cloud Run actually deployed?** — Check Firebase project settings
2. **What's the actual status of queued jobs?** — Query Firestore for any batches with status='queued' and check their age
3. **Why is CitationsAnalytics empty?** — Read that file to see what analytics queries it's trying to run
4. **What does "skipped" status mean?** — Some directories might require fields we don't have (e.g., license #)

---

## Key Files to Reference

| File | Purpose |
|---|---|
| `functions/src/index.js:450-539` | `startCitationsJob()` CF that creates batch |
| `src/pages/citations/CitationsHome.jsx` | Overview UI |
| `src/pages/citations/CitationsJobs.jsx` | Job tracking UI |
| `src/pages/citations/CitationsDirs.jsx` | Per-directory status table |
| `src/pages/settings/Profile.jsx` | Where users enter business info |
| `src/utils/validators.js` | Validation rules (check profileSchema) |
| `functions/src/index.js:243-300` | MASTER_DIRECTORIES with 300 dirs |
| (External) `github.com/Reboostm/ReBoost-Citations` | Cloud Run automation engine |
