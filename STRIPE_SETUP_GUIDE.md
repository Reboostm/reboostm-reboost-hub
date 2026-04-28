# Stripe Integration Setup Guide

## Overview
Complete Stripe checkout system with admin-configurable offers, webhook auto-unlock, and dynamic pricing management.

---

## What Was Built

### 1. **Admin Offers Management** (`/admin/offers`)
- ✅ Create, edit, delete pricing offers without touching code
- ✅ Configure offer type (subscription or one-time purchase)
- ✅ Select which feature/tool the offer unlocks
- ✅ Set pricing and description
- ✅ Paste Stripe Price IDs when ready

### 2. **Cloud Functions** (Firebase)
- `createCheckoutSession(offerId)` — Create Stripe checkout session
- `createPortalSession()` — Open Stripe billing portal
- `handleStripeWebhook()` — Listen for payment events & auto-unlock tools

### 3. **Public Pricing Page** (`/pricing`)
- ✅ Dynamically fetches offers from Firestore
- ✅ Grouped by feature
- ✅ "Coming soon" badge for offers without Stripe IDs

### 4. **ToolGate Lock Screen** (when user tries locked tool)
- ✅ Shows available offers for that tool
- ✅ Dynamically updated from Firestore
- ✅ "Get Started" buttons trigger checkout

### 5. **Auto-Unlock on Payment**
- ✅ Webhook listener detects successful payment
- ✅ Automatically unlocks tool in Firestore
- ✅ User sees tool immediately after payment

---

## Setup Steps (In Order)

### Step 1: Set Firebase Environment Variables

Go to **Firebase Console → Functions → Runtime environment variables**

Add these three variables:
```
STRIPE_SECRET_KEY = sk_live_YOUR_STRIPE_KEY
STRIPE_WEBHOOK_SECRET = whsec_YOUR_WEBHOOK_SECRET
CLIENT_URL = https://hub.reboostm.com
```

### Step 2: Install Stripe Package

In `functions/` directory:
```bash
npm install stripe
```

(Already added to package.json, just need npm install)

### Step 3: Create Stripe Products & Prices

**Do this in Stripe Dashboard:**

1. Go to **Products**
2. Create products with meaningful names (e.g., "Content Scheduler Basic")
3. For each product, create a price:
   - **One-time purchases:** Set type to "One-time"
   - **Subscriptions:** Set type to "Recurring" → choose billing period
4. Copy the Price ID (starts with `price_`)

**Keep a list of Price IDs:** You'll paste these into the admin panel later.

### Step 4: Set Up Webhook Endpoint

**In Stripe Dashboard:**

1. Go to **Developers → Webhooks**
2. Click **Add Endpoint**
3. Paste your webhook URL:
   ```
   https://us-central1-reboost-hub.cloudfunctions.net/handleStripeWebhook
   ```
   (Region may vary — check your Firebase Functions region)
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
5. Copy the Webhook Secret (`whsec_...`)
6. Paste into Firebase env var: `STRIPE_WEBHOOK_SECRET`

### Step 5: Create Offers in Admin Panel

1. Go to **Admin → Offers & Pricing** (`/admin/offers`)
2. Click **New Offer**
3. Fill in:
   - **Name:** e.g., "Content Scheduler Basic"
   - **Description:** e.g., "3 accounts, 30 posts/month"
   - **Price:** e.g., `49` (cents are automatic in Stripe, so this becomes $49)
   - **Type:** Select "Subscription (recurring)" or "One-time Purchase"
   - **Feature:** Select which tool unlocks (e.g., `scheduler`)
   - **Tier:** Optional, e.g., "basic" or "pro"
   - **Stripe Price ID:** Paste the `price_...` ID from Stripe
   - **Active:** Toggle ON

4. Repeat for each pricing tier

**Example Offers to Create:**

| Name | Price | Type | Feature | Stripe ID |
|------|-------|------|---------|-----------|
| Scheduler Basic | 49 | Subscription | scheduler | price_XXX |
| Scheduler Pro | 99 | Subscription | scheduler | price_XXX |
| Citations Starter | 97 | One-time | citations | price_XXX |
| Rank Tracker Basic | 29 | Subscription | rankTracker | price_XXX |

### Step 6: Test the Flow

**As a regular user:**

1. Go to `/pricing` → Click "Get Started" on an offer
2. Should redirect to Stripe checkout
3. Use Stripe test card: `4242 4242 4242 4242` (expiry: any future date, CVC: any 3 digits)
4. Complete checkout
5. Should redirect back to `/settings/billing?success=true`
6. Check your Firestore user doc → `subscriptions.scheduler.active` should be `true`

**Check webhook delivery:**
1. Stripe Dashboard → Webhooks → Click endpoint
2. Scroll to **Recent Events** → See payment events
3. Expand each to verify payload + response

---

## How It Works (Architecture)

### User Purchases Flow:
```
User clicks "Get Started" on /pricing or lock screen
    ↓
redirectToCheckout(offerId)
    ↓
createCheckoutSession Cloud Function
    ├─ Fetch offer from Firestore
    ├─ Create Stripe checkout session
    ├─ Pass metadata: { uid, offerId, unlocksFeature }
    ↓
Stripe checkout page (user enters card)
    ↓
Payment succeeds
    ↓
Stripe sends webhook: checkout.session.completed
    ↓
handleStripeWebhook Cloud Function
    ├─ Verify webhook signature
    ├─ Extract uid, offerId from metadata
    ├─ Determine if subscription or one-time purchase
    ├─ Call unlockSubscription() or unlockPurchase()
    ├─ Update Firestore: subscriptions.{feature}.active = true
    ↓
User's BillingContext refreshes
    ↓
Tool unlocked instantly
```

### Firestore Schema:

**offers/{offerId}**
```js
{
  name: "Content Scheduler Basic",
  description: "3 accounts, 30 posts/month",
  price: 49,                          // in dollars
  stripePriceId: "price_...",         // from Stripe
  type: "subscription",               // or "payment"
  unlocksFeature: "scheduler",        // scheduler, reviewManager, rankTracker, etc.
  tier: "basic",                      // optional
  active: true,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**users/{uid}** (additions)
```js
{
  stripeCustomerId: "cus_...",        // added by webhook
  subscriptions: {
    scheduler: {
      active: true,                   // set by webhook
      tier: "basic",
      stripeSubId: "sub_..."
    }
  }
}
```

---

## Managing Offers Later

### Add a new offer:
1. Go to **Admin → Offers & Pricing**
2. Click **New Offer**
3. Fill form → Save
4. Create price in Stripe → Paste ID

### Edit existing offer:
1. Click edit icon next to offer
2. Change any fields
3. Save

### Delete offer:
1. Click trash icon
2. Confirm

### Change price:
- Do NOT edit the offer in the hub
- **In Stripe:** Create a new Price for the same Product
- **In hub:** Update the offer with the new Price ID
- Old price becomes "inactive" in Stripe

### Enable/disable offer:
- Toggle "Active" checkbox
- Inactive offers don't show on `/pricing` page
- Existing customers still have access

---

## Troubleshooting

### "No Stripe customer ID" error
- User completed checkout but webhook didn't fire
- Go to Stripe Webhooks → check Recent Events
- If webhook shows error: check Firebase logs for `handleStripeWebhook` function
- Resend webhook from Stripe dashboard

### Webhook not firing
- Check endpoint URL is correct in Stripe Dashboard
- Check `STRIPE_WEBHOOK_SECRET` is set in Firebase env vars (exactly matches Stripe)
- Check webhook events include `checkout.session.completed`
- Firebase Functions logs: search for `handleStripeWebhook`

### Offer doesn't show on `/pricing` page
- Check `active: true` in offer document
- Check offer was saved (refresh page)
- Firestore permissions: `offers` collection must be readable

### Checkout button says "Coming soon"
- Offer doesn't have a Stripe Price ID
- Edit offer → paste `price_...` ID from Stripe
- Refresh browser (may be cached)

### Test card rejected
- Use Stripe test card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits
- In production: use real card

---

## Stripe Keys Location

**Test Mode (development):**
- Stripe Dashboard → Developers → API Keys
- Copy `pk_test_...` (frontend, though we use hosted checkout)
- Copy `sk_test_...` (backend — set in Firebase env vars)

**Live Mode (production):**
- Stripe Dashboard → Developers → API Keys (toggle Live)
- Copy `sk_live_...` (set in Firebase env vars)
- Webhook Secret changes between test and live

---

## Cost Estimates

- **Stripe fee:** 2.9% + $0.30 per transaction
- **SerpAPI (rank checking):** $50/mo for 5,000 searches
- **Firebase Functions:** Included in usage, small invocations cheap
- **Firestore:** Pay per read/write (offers stored in one collection)

---

## Next Steps After Setup

1. ✅ Test checkout flow with test card
2. ✅ Verify webhook fires and unlocks tools
3. ✅ Test multiple offer types (sub + one-time)
4. ✅ Switch Stripe to Live mode
5. ✅ Update Firebase env vars with live keys
6. ✅ Test live checkout with real payment method
7. ✅ Monitor Stripe Dashboard for transactions
8. ✅ Check Firebase Firestore for updated `subscriptions` fields

---

## Files Changed

**Backend (Cloud Functions):**
- `functions/src/index.js` — Added Stripe functions + webhook handler
- `functions/package.json` — Added `stripe` dependency

**Frontend:**
- `src/pages/admin/Offers.jsx` — NEW: Admin offer management page
- `src/pages/Pricing.jsx` — NEW: Public pricing page
- `src/services/stripe.js` — Updated to use offer IDs + getActiveOffers()
- `src/services/firestore.js` — Added offer CRUD helpers
- `src/App.jsx` — Added routes: `/admin/offers`, `/pricing`
- `src/components/layout/Sidebar.jsx` — Added "Offers & Pricing" nav link
- `src/components/ui/ToolGate.jsx` — Updated to fetch offers dynamically

---

## Support

If webhook issues occur:
1. Check Firebase Functions logs: Filter by `handleStripeWebhook`
2. Check Stripe Webhooks dashboard: Recent Events section
3. Enable verbose logging in the webhook handler if needed

You're fully ready to go live! 🚀
