# ReBoost Hub - Issues & Roadmap

**Last Updated:** 2026-04-28  
**Status:** Multiple features need architectural fixes, not just tweaks

---

## 🔴 CRITICAL ISSUES (Blocking Functionality)

### 1. Lead Generator: Credits System is Overcomplicating Things
**Problem:** 
- User doesn't want a "credits" system. It's confusing.
- Should be: "Buy 50 leads for $47" (direct package purchase)
- Current: "Spend 1 credit for ~60 leads" (requires understanding credits = leads)

**Impact:** Users don't understand what they're buying or why.

**Fix Required:**
- Rethink billing: Lead packages (50, 150, 500 leads) as **one-time purchases**, not credits
- Remove "credits" concept entirely from Lead Generator
- Pricing page shows: "50 Leads - $47" (not "Lead Credits 50")
- Billing tab shows: "50 Lead Credits Remaining" → "50 Leads Remaining"
- Lead Generator shows: "This search will use 1 of your 50 leads" (not credit cost)

**Effort:** Medium (affects Lead Generator, Billing context, offers schema)

---

### 2. Billing Portal Broken ("Could not open portal")
**Problem:** When user clicks "Manage" button in Billing tab, error says "Could not open billing portal"

**Likely Cause:** 
- `stripeCustomerId` not being set on user doc when first purchase completes
- OR createPortalSession CF is failing silently

**Fix Required:**
- Check if webhook is firing and setting `stripeCustomerId`
- Debug createPortalSession function in Cloud Functions
- Add error logging

**Effort:** Low (debugging + minor fixes)

---

### 3. Rank Tracker: Can't Add Keywords (Failed to add keyword)
**Problem:** User clicks "Add Keyword" and gets "Failed to add keyword" error

**Likely Cause:** Validation requiring SerpAPI key to exist before keyword can be created

**Fix Required:**
- Allow adding keywords WITHOUT SerpAPI key (for setup)
- Only require SerpAPI key when actually checking rank
- Remove SerpAPI key requirement from keyword creation validation

**Effort:** Low (remove validation check)

---

### 4. Google Maps Reviews: Getting Internal Error
**Problem:** User gets error when trying to use Google Maps Reviews feature

**Unknown:** What exact error/feature they're trying to use

**Fix Required:**
- Need to know which specific action is failing
- Check if GOOGLE_PLACES_KEY is set in Functions env vars
- Might be Places API quota issue

**Effort:** Low (debugging)

---

## 🟡 MAJOR ARCHITECTURAL ISSUES (Need Rethinking)

### 5. Content Manager Purpose Was Misunderstood
**Original (Wrong):**
- Generic content library with month/year filters
- Upload any content, all clients see all content

**Actual Purpose:**
- Upload **niche-specific marketing templates** (plumber images, HVAC images, etc.)
- Tag images with niche + content type (social post, email footer, facebook banner)
- When client buys "Celebrity Content Calendar" for their niche (plumber), they ONLY see plumber templates
- Clients edit/customize these templates for their business
- Can export to social scheduler OR download + upload manually

**Fix Required:**
- Complete redesign of Content Manager admin:
  - Remove month/year selection
  - Add **niche dropdown** when uploading
  - Add **content type tags** (social post, email footer, banner, etc.)
  - Preview showing which niche/types are uploaded

- Redesign ContentLibrary client page:
  - Shows only templates for their niche
  - Edit/preview before downloading
  - "Add to Scheduler" button if they have Scheduler subscription
  - "Upgrade to Scheduler" button if they don't

**Effort:** High (complete refactor of 2 pages + data schema)

---

### 6. Lead Generator: Missing Lead Preview
**Problem:** Users buying leads are "blind and confused" — they don't know:
- How many leads are in their area
- What the actual lead data looks like
- If it's worth buying

**Fix Required:**
- Add **Google Maps preview** when searching:
  - User types "Plumbers, Salt Lake City" 
  - Shows live map pins of matching businesses
  - Shows count: "Found 47 plumbers in Salt Lake City"
  - Shows sample leads (first 5-10) with details
  - Then user can decide: "OK, I'll buy this search"

- Refactor Lead Generator to preview before charging:
  - Preview step: "Here's what we found. Cost will be X"
  - Confirm step: "Buy now?"
  - Results step: "Here are all 47 leads"

**Effort:** High (requires Google Maps API integration, new workflow)

---

### 7. Rank Tracker: Mobile vs Desktop Tracking
**Current:** One keyword = one track. If you want both mobile + desktop, create 2 keywords.

**Problem:** Annoying UX. User wants one keyword with both tracked simultaneously.

**Fix Required:**
- When creating keyword: **toggle both "Mobile" and "Desktop"** (not one or the other)
- In Results view: Show 2 columns side-by-side (Mobile Rank | Desktop Rank)
- Update CF to track both simultaneously using separate SerpAPI queries
- Results stored as: `{ keyword, mobile_rank, mobile_in_local_pack, desktop_rank, desktop_in_local_pack }`

**Also Add:**
- **Auto-detect keywords** from business URL + niche:
  - User enters website URL + niche (plumber)
  - System suggests: "Plumber near [city]", "Emergency plumbing [city]", "24/7 plumber"
  - User can add/remove suggestions

**Effort:** High (schema change + CF update + UI redesign)

---

## 🟢 QUICK FIXES (Low Effort)

### 8. API Keys Page: Not Editable
**Problem:** Can only view keys, can't edit/add them

**Fix:**
- Make each key row editable (click to edit)
- Add "Add New Key" button
- **Add 2Captcha API key field** for Citations Builder
- Allow edit/delete

**Effort:** Low (UI updates)

---

### 9. Rank Tracker: Can't Add Keywords Without SerpAPI
**Problem:** Button disabled or shows error if SERPAPI_KEY not set

**Fix:**
- Allow adding keyword even without SerpAPI key
- Show warning: "You can add keywords now, but rank checking requires SERPAPI_KEY to be configured"
- Only disable "Check Rank Now" button, not "Add Keyword"

**Effort:** Low (remove validation)

---

### 10. Billing Tab: Add Upgrade Buttons
**Current:** Shows what's subscribed/purchased, only has "Manage" button

**Fix:**
- Add "Upgrade" button next to each subscription/purchase
- If already have it: hide upgrade button (or show "Subscribed" badge)
- Each upgrade button points to `/pricing` filtered to that product
- From ContentLibrary: Show "Upgrade to Scheduler" button at top if no Scheduler subscription

**Effort:** Low (UI buttons)

---

### 11. Lead Generator: Misleading Service List
**Problem:** Niches list includes restaurants, retail, fitness — not just "services"

**Fix:**
- Keep service-based businesses (plumber, HVAC, electrician, contractor, painter, etc.)
- Remove: Restaurants, Retail, Gyms, Yoga (not local service businesses)
- Or separate dropdown: "Service Type" vs "Business Type"

**Effort:** Low (config update)

---

## 📋 Priority Order to Fix

### Phase 1 (This week) - Critical Blockers:
1. ✅ Offers form: Make Stripe ID optional (DONE)
2. 🔧 Billing portal error (debug)
3. 🔧 Rank tracker: Remove SerpAPI key requirement for adding keywords
4. 🔧 Google Maps Reviews error (identify issue)
5. 🔧 API Keys: Make editable

### Phase 2 (Next) - Architectural:
6. 🔄 Lead Generator: Rethink "credits" as "lead packages"
7. 🔄 Content Manager: Niche-specific redesign
8. 🔄 Lead preview with Google Maps
9. 🔄 Rank tracker: Mobile/Desktop toggle + auto-detect

### Phase 3 (Polish):
10. 💅 Billing tab: Add upgrade buttons
11. 💅 Rank tracker: Can add keywords anytime
12. 💅 Service list: Refine niches

---

## Questions for You

Before we start rebuilding, I need clarification:

### Lead Packages:
- **Pricing model:** Should it be tiered?
  - [ ] 50 leads - $47 (1-time)
  - [ ] 150 leads - $97 (1-time)
  - [ ] 500 leads - $197 (1-time)
  - [ ] Different pricing?

### Content Manager:
- **Content types to tag:** (beyond social post, email footer, banner)
  - Stories?
  - Carousels?
  - Reels/TikTok?
  - Which ones matter most?

### Rank Tracker:
- **Auto-detect keywords:** Want me to build this, or handle manually?
- **Who should set it up** — you (in admin) or client (when creating keywords)?

---

## Summary

**The good news:** Most of these are fixable.  
**The reality:** Some need architecture changes, not just UI tweaks.

The **biggest lesson:** I should have asked you to clarify the actual business model before building. My assumptions about "credits" and "content library" didn't match your vision.

Let me know which phase to tackle first and answer those clarification questions above.
