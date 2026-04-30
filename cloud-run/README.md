# ReBoost Citations Submission Engine

Automated business listing submission engine for ReBoost Hub. Submits your NAP (Name, Address, Phone) + business info to 300+ local business directories using Playwright + Chromium.

## Architecture

### Flow

```
1. User clicks "Start Submission" in Hub frontend
   ↓
2. startCitationsJob Cloud Function creates a batch doc in Firestore
   ↓
3. Cloud Function triggers Cloud Run via HTTP POST
   ↓
4. Cloud Run polls for 'queued' batches every 30 seconds
   ↓
5. For each batch:
   - Mark status as 'running'
   - Loop through each directory
   - Use Playwright to navigate and fill forms
   - Use 2Captcha to solve CAPTCHAs
   - Use Gmail API to intercept + click verification emails
   - Update Firestore status (live/pending/failed)
   ↓
6. Mark batch as 'completed'
```

### Key Files

| File | Purpose |
|------|---------|
| `src/index.js` | Main entry point. Express server + job poller |
| `src/gmailHandler.js` | Gmail API integration. Watches for verification emails, extracts links, auto-clicks them |
| `src/captchaHandler.js` | 2Captcha REST API wrapper. Solves image/reCAPTCHA/hCaptcha |
| `src/directoryHandlers.js` | Directory-specific Playwright scripts (Yelp, Yellow Pages, Manta, etc.) |
| `Dockerfile` | Node 22 + Playwright + Chromium |

### Firestore Data Model

**Batch Document:** `citations/{batchId}`
```js
{
  userId,                 // User who initiated
  packageId,              // 'citations_starter' | 'citations_pro' | 'citations_premium'
  packageTier,            // 'starter' | 'pro' | 'premium'
  targetCount,            // Number of directories to submit (100/200/300)
  total,                  // Total directories in batch
  status,                 // 'queued' → 'running' → 'completed' | 'failed'
  submitted,              // Count: submitted (pending verification)
  live,                   // Count: live and verified
  pending,                // Count: awaiting verification
  failed,                 // Count: failed to submit
  businessData: {
    businessName,
    address, city, state, zip,
    phone, email, website,
    description, businessHours,
    // Phase 2: socials, descriptions
    // Phase 3: license, certifications, service areas
  },
  createdAt,
  startedAt,
  completedAt,
  errorMessage,           // If failed
}
```

**Directory Sub-Document:** `citations/{batchId}/directories/{docId}`
```js
{
  name,                   // 'Yelp', 'Yellow Pages', etc.
  url,                    // Directory website
  category,               // 'General', 'Social', 'Home Services', etc.
  priority,               // 1, 2, or 3 (submission order)
  
  status,                 // 'pending' → 'live' | 'pending' (verification) | 'failed'
  submittedAt,            // When submission was attempted
  liveAt,                 // When listing went live
  liveUrl,                // Direct link to the live listing
  emailUsed,              // Which email was used for account creation
  errorMessage,           // If failed
}
```

## Environment Variables

See `.env.example`. Required:

- `FIREBASE_PROJECT_ID` — Google Cloud project ID (set to `reboost-hub`)
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN` — Gmail API auth
- `TWO_CAPTCHA_API_KEY` — 2Captcha API key

Optional:
- `PORT` — Server port (default: 8080, set by Cloud Run)

## Directory Handlers

Each directory needs a handler class. Handlers use Playwright to automate form submission.

### Adding a New Handler

1. Create a class extending `DirectoryHandler` in `src/directoryHandlers.js`
2. Implement the `submit()` method
3. Register it in the `HANDLERS` object

Example:

```javascript
class MyDirectoryHandler extends DirectoryHandler {
  async submit({ directory, businessData, gmailHandler, captchaHandler }) {
    console.log(`[MYDIRECTORY] Starting submission for ${businessData.businessName}...`)

    try {
      const browser = await this.getBrowser()
      const page = await browser.newPage()

      // Navigate to directory
      await page.goto('https://example.com')

      // Fill form fields
      await page.fill('input[name="business_name"]', businessData.businessName)
      await page.fill('input[name="phone"]', businessData.phone)
      await page.fill('input[name="address"]', businessData.address)

      // Handle CAPTCHA if present
      const hasCaptcha = await page.$('g-recaptcha') !== null
      if (hasCaptcha && captchaHandler) {
        const sitekey = await page.getAttribute('g-recaptcha', 'data-sitekey')
        const token = await captchaHandler.solveRecaptchaV2(sitekey, page.url())
        await page.evaluate((t) => {
          document.getElementById('g-recaptcha-response').value = t
        }, token)
      }

      // Submit form
      await page.click('button[type="submit"]')
      await page.waitForNavigation()

      // Check if live (optional)
      const liveUrl = page.url()
      const isLive = await page.$('h1:has-text("Success")') !== null

      // Wait for verification email if Gmail handler available
      if (gmailHandler && businessData.email) {
        gmailHandler.watchAlias(businessData.businessName, businessData.email)
        // Wait up to 5 minutes for verification email
        for (let i = 0; i < 30; i++) {
          const links = gmailHandler.getPendingLinks(businessData.email)
          if (links.length > 0) {
            const verifyPage = await browser.newPage()
            await verifyPage.goto(links[0])
            await verifyPage.waitForNavigation()
            await verifyPage.close()
            break
          }
          await new Promise(r => setTimeout(r, 10000))
        }
      }

      await page.close()

      return {
        status: isLive ? 'live' : 'pending',
        liveUrl: isLive ? liveUrl : null,
        emailUsed: businessData.email,
      }
    } catch (err) {
      return {
        status: 'failed',
        errorMessage: err.message,
      }
    }
  }
}

// Register
HANDLERS['My Directory'] = MyDirectoryHandler
```

### Playwright Tips

- Use `page.goto()` to navigate
- Use `page.fill()` for text inputs, `page.click()` for buttons
- Use `page.waitForSelector()` to wait for elements
- Use `page.evaluate()` to run JavaScript on the page
- Use `page.screenshot()` for debugging (saved to Cloud Run logs)
- Always handle timeouts gracefully — directories go down, forms change

### CAPTCHA Handling

The engine supports:
- **Image CAPTCHA** — `captchaHandler.solveImageCaptcha(base64Image)`
- **reCAPTCHA v2** — `captchaHandler.solveRecaptchaV2(sitekey, pageUrl)`
- **hCaptcha** — `captchaHandler.solveHCaptcha(sitekey, pageUrl)`

Cost: ~$0.003 per solve with 2Captcha.

### Email Verification

If a directory requires email verification:

1. Use the Gmail alias: `reboostai+${businessName}@gmail.com`
2. Start watching: `gmailHandler.watchAlias(businessName, businessEmail)`
3. Get pending links: `gmailHandler.getPendingLinks(businessEmail)`
4. Click the verification link with Playwright
5. Stop watching: `gmailHandler.stopWatching(businessEmail)`

## Manual-Only Directories

These require phone/postcard verification or human review. **Don't automate:**
- Google Business Profile
- Yelp (requires phone verification)
- Facebook
- Apple Maps
- BBB

Users must verify these manually.

## Deployment

See `DEPLOYMENT.md` for:
- Google Cloud setup
- Cloud Run deployment
- Environment variable configuration
- Testing and monitoring

## Status Codes

| Status | Meaning |
|--------|---------|
| `queued` | Batch waiting to be processed |
| `running` | Submission in progress |
| `live` | Listing is live and verified |
| `pending` | Listing submitted, awaiting email verification |
| `failed` | Submission failed (see errorMessage) |
| `completed` | Entire batch finished |

## Cost

- **Cloud Run:** ~$0.0000025 per CPU-second (~$2.25 for 300 dirs)
- **2Captcha:** ~$0.003 per CAPTCHA (~$1-5 per batch depending on dirs)
- **Firestore:** Negligible (a few hundred reads/writes)
- **Gmail API:** Free

Total per batch: ~$3-7

## Troubleshooting

### Playwright fails to launch
- Ensure Dockerfile installs all Chromium dependencies
- Increase Cloud Run memory allocation
- Check logs: `gcloud run logs read reboost-citations-engine --tail=50`

### Gmail API not finding emails
- Verify refresh token is fresh (expires after 6 months of disuse)
- Check that email address is correct
- Test manually: `gmailHandler.extractVerificationLinks('reboostai+test@gmail.com')`

### 2Captcha not solving
- Verify API key is active and has balance
- Check that image/reCAPTCHA format is supported
- Test manually with 2captcha.com dashboard

### Batch stuck in 'running'
- Check logs for errors
- Manually mark as failed in Firestore if needed
- Monitor Cloud Run memory/CPU usage

## Future Enhancements

1. **Parallel processing** — Submit multiple directories simultaneously (with rate-limiting)
2. **Retry logic** — Retry failed submissions after 1 hour
3. **Smart CAPTCHA routing** — Only use 2Captcha for certain directories
4. **Niche-specific handlers** — Different form logic for plumbers vs realtors
5. **Phone verification** — Auto-dial verification calls using Twilio
6. **Listing management** — Update existing listings instead of just creating new ones
