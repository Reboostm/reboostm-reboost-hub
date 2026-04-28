# Vercel Black Screen Troubleshooting

## What You're Seeing
The app loads but shows a blank/black screen. This means:
- ✅ Vercel deployed successfully (no build errors)
- ❌ Something is broken at runtime (missing config, API error, etc.)

---

## Quick Fixes (In Order)

### 1. Check Browser Console (Most Common)
1. Open your Vercel URL
2. Press `F12` (or Cmd+Option+I on Mac)
3. Go to **Console** tab
4. Look for red errors

**Common errors:**
- `Firebase: No Firebase App '[DEFAULT]' has been created` → Missing VITE_FIREBASE_* env vars
- `Cannot read property 'baseURL'` → Missing config value
- `CORS error` → Wrong API endpoint

**Solution:**
- Scroll down and take a screenshot of ANY errors you see
- Share them with Claude so we can fix

---

### 2. Check Vercel Environment Variables

1. Go to https://vercel.com/dashboard
2. Click **ReBoost Hub** project
3. Go to **Settings** → **Environment Variables**
4. Verify these exist:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

**If any are missing:**
1. Get values from Firebase Console → Project Settings → Web app config
2. Add them to Vercel
3. Go back to Deployments tab → click the latest deployment → "Redeploy"

---

### 3. Check Vercel Build Logs

1. Go to https://vercel.com/dashboard/ReBoost Hub
2. Click **Deployments** tab
3. Click the most recent deployment
4. Scroll to "Build" section
5. Look for any errors (red text)

**If you see errors:**
- Common: Missing dependencies (run `npm install` locally and commit package-lock.json)
- Common: TypeScript errors (check if there are uncommitted changes)

---

### 4. Check Network Tab (API Issues)

1. Press F12
2. Go to **Network** tab
3. Reload the page
4. Look for any failed requests (red X)

**Examples:**
- `https://us-central1-reboost-hub.cloudfunctions.net/...` returning 403/500 → Cloud Function error (check logs)
- Firestore request failing → Security rules or auth issue

---

## If It's Still Blank

### Step 1: Run Locally First
```bash
npm run dev
# Open http://localhost:5173
# Check console for errors
```

### Step 2: Check Recent Changes
- Did you push code that broke something?
- Run `git log --oneline | head -5` to see recent commits
- If last commit looks suspicious, check what changed: `git show HEAD`

### Step 3: Check Firebase Firestore Security Rules
1. Go to https://console.firebase.google.com/project/reboost-hub/firestore/rules
2. Make sure rules allow reading/writing (shouldn't be locked down)

---

## Common Root Causes

| Symptom | Cause | Fix |
|---|---|---|
| Blank page, no errors | Missing VITE_* env vars | Add to Vercel env vars + redeploy |
| Red error in console | JavaScript error | Share error screenshot |
| All endpoints timeout | Cloud Functions not deployed | Run `firebase deploy --only functions` |
| "Firebase not initialized" | Wrong FIREBASE_PROJECT_ID | Verify value in Vercel settings |
| Login works but app blank | Auth works but Firestore fails | Check security rules |

---

## Next Steps

1. **Take a screenshot** of the browser console (F12 → Console tab)
2. **Share the error** with Claude
3. **Check Vercel build logs** and share any build errors
4. **Verify Vercel env vars** are set correctly

Once you share these, we can pinpoint and fix the issue quickly.

---

## Prevention

Always test locally before pushing:
```bash
npm run dev
# Manually test a few flows (login, SEO Audit, etc.)
# Check console for any warnings
```

Then after pushing, check Vercel deployment status before telling users about it.
