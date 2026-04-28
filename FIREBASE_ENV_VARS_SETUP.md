# Firebase Environment Variables Setup Guide

## Why This Matters
The Cloud Functions (Stripe, Google Maps, SendGrid, etc.) need API keys to work. These are set as **runtime environment variables** in Firebase Console, not in code.

---

## Step 1: Go to Firebase Console

1. Open https://console.firebase.google.com/project/reboost-hub/functions
2. You'll see a list of all Cloud Functions (runSeoAudit, searchLeads, createCheckoutSession, etc.)

---

## Step 2: For EACH Function, Add Environment Variables

**You only need to do this once per variable.** If multiple functions use the same variable (e.g., `GOOGLE_PLACES_KEY` is used by 3 functions), you still only set it once per function that needs it.

### Example: Setting `GOOGLE_PLACES_KEY`

1. Click on **createCheckoutSession** (or any function)
2. Click the **pencil icon** to Edit
3. Scroll down to "Runtime environment variables" section
4. Click **+ Add variable**
5. Key: `STRIPE_SECRET_KEY` (exact spelling matters!)
6. Value: Your Stripe secret key (starts with `sk_live_` or `sk_test_`)
7. Click **Save**

---

## Step 3: Which Functions Need Which Vars

| Function | Variables |
|---|---|
| `createCheckoutSession` | `STRIPE_SECRET_KEY`, `CLIENT_URL` |
| `createPortalSession` | `STRIPE_SECRET_KEY`, `CLIENT_URL` |
| `handleStripeWebhook` | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| `runSeoAudit` | `GOOGLE_PLACES_KEY`, `PAGESPEED_API_KEY` (optional) |
| `searchLeads` | `GOOGLE_PLACES_KEY` |
| `fetchReviews` | `GOOGLE_PLACES_KEY` |
| `checkKeywordRank` | `SERPAPI_KEY` |
| `schedulePost` | `ZERNIO_API_KEY` |
| `generateAIContent` | `ANTHROPIC_API_KEY` |
| `generateAIImage` | `OPENAI_API_KEY` |
| `sendReviewRequest` | `SENDGRID_API_KEY` |

---

## Step 4: Get Your API Keys

### Stripe Keys
- Go to https://dashboard.stripe.com/apikeys
- Copy **Secret key** (starts with `sk_live_...` or `sk_test_...`)
- This is `STRIPE_SECRET_KEY`

### Stripe Webhook Secret
- Go to https://dashboard.stripe.com/webhooks
- Create a new endpoint pointing to: `https://us-central1-reboost-hub.cloudfunctions.net/handleStripeWebhook`
- Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
- Click your endpoint → reveal **Signing secret**
- This is `STRIPE_WEBHOOK_SECRET`

### Google Places API Key
- Go to https://console.cloud.google.com/apis/credentials
- Create → API Key
- Enable **Places API** and **Maps JavaScript API**
- This is `GOOGLE_PLACES_KEY`

### CLIENT_URL
- If deployed on Vercel: `https://hub.reboostm.com` (or your domain)
- If local dev: `http://localhost:5173`

### Other APIs
- **SerpAPI**: https://serpapi.com → Dashboard → copy API key
- **Zernio**: From your Zernio account settings
- **Anthropic** (Claude): https://console.anthropic.com → API keys
- **OpenAI**: https://platform.openai.com → API keys
- **SendGrid**: https://app.sendgrid.com → API Keys
- **PageSpeed** (optional): https://cloud.google.com/docs/authentication/provide-credentials-adc

---

## Common Issues

### "Could not create billing portal session"
- Check: Is `STRIPE_SECRET_KEY` set on `createPortalSession` function?
- Check: Did the user complete a purchase? (They need `stripeCustomerId` in their doc)

### "Search failed" on Lead Generator
- Check: Is `GOOGLE_PLACES_KEY` set on `searchLeads` function?
- Check: Do you have at least one Google Maps API key configured in the Admin panel?

### Webhook not firing
- Check: Is the webhook URL correct? (https://us-central1-reboost-hub.cloudfunctions.net/handleStripeWebhook)
- Check: Is `STRIPE_WEBHOOK_SECRET` set on `handleStripeWebhook` function?
- Check: Stripe Dashboard → Webhooks → click your endpoint → "Recent deliveries" tab to see if events are failing

---

## Testing Stripe Locally (After Setting Env Vars)

1. Set `CLIENT_URL` = `http://localhost:5173`
2. Create a test offer with a test Stripe price ID
3. Go to `/pricing`, click Buy
4. Use Stripe test card: `4242 4242 4242 4242`, expiry `12/25`, CVC `123`
5. Should redirect to billing on success
6. Check Firebase Firestore → users → your uid → should have `stripeCustomerId` now

---

## Quick Checklist

- [ ] STRIPE_SECRET_KEY set on createCheckoutSession
- [ ] STRIPE_SECRET_KEY set on createPortalSession
- [ ] STRIPE_SECRET_KEY set on handleStripeWebhook
- [ ] STRIPE_WEBHOOK_SECRET set on handleStripeWebhook
- [ ] CLIENT_URL set on all Stripe functions
- [ ] GOOGLE_PLACES_KEY set on runSeoAudit, searchLeads, fetchReviews
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] At least one Google Maps API key added in Admin panel
