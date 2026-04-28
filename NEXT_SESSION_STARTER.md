# ReBoost Hub — Next Session Starter Message

## 📁 File Location (IMPORTANT)
```
C:\Users\justi\Desktop\Claude Main Folder\ReBoost HUB\pedantic-mclean-9e85f5
```

**⚠️ DO NOT CREATE NEW FOLDERS.** All work is in the above directory. This is a git worktree, so it's isolated from main.

---

## 🎯 Copy-Paste Starter for Next Claude Session

```
Hi! I'm continuing work on ReBoost Hub. Here's the situation:

**Project:** ReBoost Hub (SaaS funnel for local service businesses)
**Branch:** claude/pedantic-mclean-9e85f5 (git worktree)
**Repo:** https://github.com/Reboostm/reboostm-reboost-hub

**Last Session Completed:**
- ✅ Rank Tracker: Mobile/desktop simultaneous tracking (grouped display)
- ✅ Citations: All 3 phases of form expansion built (Phase 1/2/3)
  - Phase 1: businessHours + description in Profile
  - Phase 2: CitationsSetup page with logo, descriptions, social media
  - Phase 3: Advanced fields (license, service areas, certifications)
- ✅ UI polish: Wider sidebar, "Content Calendar" → "Celebrity Content"
- ✅ Documentation: CITATIONS_BACKEND_ANALYSIS.md + CITATIONS_EXPANSION_COMPLETE.md

**BLOCKER: Vercel Deployment**
- Latest commits not showing as "Current" deployment
- Local `npm run dev` works fine
- Need to trigger redeploy or check Vercel project settings

**NEXT TASKS (Priority Order):**
1. Fix Vercel deployment (trigger redeploy of latest branch)
2. Test Citations end-to-end:
   - Fill Profile → save businessHours + description
   - Go to /citations/setup → fill form
   - Click "Start Submission"
   - Verify Firestore batch appears
   - Check if Cloud Run picks it up (critical unknown)
3. Phase 2b: Content Calendar + Scheduler integration (future)

**Key Files to Know:**
- CLAUDE.md — Project context, tech stack, phases
- CITATIONS_BACKEND_ANALYSIS.md — What's missing in Citations
- CITATIONS_EXPANSION_COMPLETE.md — What was just built + rollout checklist
- src/pages/citations/CitationsSetup.jsx — New form (350 LOC, all 3 phases)
- src/utils/validators.js — New citationsSetupSchema

**Critical Unknown:**
- Is the separate Cloud Run service (github.com/Reboostm/ReBoost-Citations) deployed?
- Is it polling Firestore for 'queued' batches and processing them?
- This blocks full Citations submission testing.
```

---

## 📋 What's in the Repo

### Recent Commits
```
83dd40b docs: Update CLAUDE.md with Phase 2b Citations expansion & session summary
4f93d70 docs: Citations expansion completion guide & rollout checklist
7ace781 feat: Citations backend expansion - all 3 phases built
21ddd76 ui: Widen sidebar & rename Content Calendar to Celebrity Content
095fcbe feat: Rank Tracker grouped display for mobile/desktop simultaneous tracking
```

### Branch Status
- **Current Branch:** claude/pedantic-mclean-9e85f5 (feature branch, git worktree)
- **Main Branch:** Has older code, don't work there
- **All changes:** Pushed and ready to merge when approved

### Documentation Files Created
1. `CLAUDE.md` — Updated with Phase 2b status + session summary
2. `CITATIONS_BACKEND_ANALYSIS.md` — Investigation of Citations form expansion needs
3. `CITATIONS_EXPANSION_COMPLETE.md` — Complete rollout guide for all 3 phases

---

## 🔧 What's Built (This Session)

### Phase 2b: Citations Backend Expansion (COMPLETE)

**Phase 1 (MVP - In Profile):**
- `businessHours` — Preset or custom business hours
- `description` — Free-text business description

**Phase 2 (Full Submission - New Page):**
- New route: `/citations/setup`
- Logo upload (up to 5MB)
- Short description (160 chars, for directory listings)
- Long description (2000 chars, detailed info)
- Public email (separate from account email)
- Social media profiles: FB, IG, LinkedIn, Twitter, YouTube, TikTok

**Phase 3 (Optimization - Advanced):**
- Service areas (cities/regions)
- Year established (date picker)
- License number & license state
- Certifications & accreditations
- Payment methods (multi-select)

**Backend Updates:**
- Updated `startCitationsJob()` Cloud Function to capture all 3 phases
- Expanded validators (profileSchema + citationsSetupSchema)
- All data flows to Cloud Run for intelligent directory selection

---

## 🚨 Known Issues

### 1. Vercel Deployment Stuck
- Latest commits pushed successfully
- Vercel shows recent deployments as "Ready"
- But "Production/Current" deployment seems old
- **Action:** Check Vercel dashboard, trigger redeploy, or merge to main

### 2. Cloud Run Status Unknown
- `startCitationsJob` creates Firestore batch with status='queued'
- Separate service (github.com/Reboostm/ReBoost-Citations) should pick these up
- **Unknown:** Is Cloud Run deployed? Polling? Updating batch status?
- **Action:** Verify Cloud Run service status before testing end-to-end

---

## ✅ Testing Checklist (Next Session)

- [ ] Vercel deployment fixed and pointing to latest code
- [ ] Local `npm run dev` works without errors
- [ ] Navigate to /settings → fill Profile with businessHours & description
- [ ] Navigate to /citations/setup → form loads (CitationsSetup page)
- [ ] Fill CitationsSetup form completely (Phase 1/2/3)
- [ ] Click "Save & Continue"
- [ ] Check Firestore: `citations/{batchId}` batch created with all businessData
- [ ] Verify Cloud Run picks up batch (status changes from 'queued' → 'running')

---

## 📚 Useful Commands

```bash
# Start dev server
npm run dev

# View latest commits
git log --oneline | head -20

# Check git status
git status

# View diffs from last commit
git diff HEAD

# Read CLAUDE.md to understand project context
cat CLAUDE.md | head -100

# View what's in Citations expansion
cat CITATIONS_EXPANSION_COMPLETE.md

# Check if CitationsSetup.jsx is built
cat src/pages/citations/CitationsSetup.jsx | head -50
```

---

## 🎯 Phase 2b Priority

**Why Citations Expansion Matters:**
- Phase 1 (Profile) = minimal data for job queue enablement
- Phase 2 (CitationsSetup) = full submission info (logo, descriptions, socials)
- Phase 3 (Advanced) = optimization (license, service areas, certifications)
- Comprehensive businessData → Cloud Run can make smarter directory choices → higher approval rates

**Success Criteria:**
- User fills Profile → businessHours + description appear in Firestore batch
- User fills CitationsSetup → all Phase 2/3 data appears in batch
- Cloud Run picks up batch and begins submission
- Real-time status updates in CitationsDirs.jsx

---

## 🔗 Links

- **GitHub Repo:** https://github.com/Reboostm/reboostm-reboost-hub
- **Firebase Project:** `reboost-hub` (check Cloud Functions for env vars)
- **Vercel Project:** https://vercel.com/dashboard/reboostm-projects/reboostm-reboost-hub
- **Separate Citations App:** C:\Users\justi\Desktop\ReBoost Citations

---

## 💡 Key Context (From CLAUDE.md)

**Business Model:** Revenue funnel for local service businesses
1. Free → SEO Audit
2. Lead Gen → Buy leads (test & learn)
3. **Citations** → Build authority (you're here)
4. Content Calendar → Pre-done 12-month templates
5. Content Scheduler → Automate posting
6. Rank Tracker → Track ROI
7. Done-For-You Services → Recurring revenue

**Architecture:**
- Frontend: React 19 + Vite + TailwindCSS (Vercel)
- Backend: Firebase Cloud Functions (Node 22, CommonJS)
- Database: Firestore
- Payments: Stripe
- Content: Zernio (social automation)
- Citations: Separate Cloud Run service (Playwright + 2Captcha)

---

## ⚠️ Important Notes

1. **DO NOT** create new folders/files in unexpected places. Use original ReBoost Hub structure:
   ```
   C:\Users\justi\Desktop\Claude Main Folder\ReBoost HUB\pedantic-mclean-9e85f5
   ```

2. **DO** read CLAUDE.md first — it has the full context (business model, tech stack, modules)

3. **Cloud Run is separate** — even if backend code is perfect, submissions won't work without Cloud Run deployed

4. **All placeholder copy** — Don't finalize outreach templates or marketing copy until explicitly requested

---

## 🎬 Ready to Start

You have:
- ✅ All Phase 2b work complete
- ✅ Documentation updated
- ✅ Code tested locally
- ✅ Branch pushed to GitHub

Just need to:
1. Fix Vercel deployment
2. Test end-to-end
3. Verify Cloud Run status

Let's go! 🚀
