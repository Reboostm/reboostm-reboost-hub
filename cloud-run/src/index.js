const express = require('express')
const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const axios = require('axios')
const GmailHandler = require('./gmailHandler')
const CaptchaHandler = require('./captchaHandler')
const { getDirectoryHandler } = require('./handlers')

const app = express()
const PORT = process.env.PORT || 8080

// Initialize Firebase Admin SDK
// Uses FIREBASE_SERVICE_ACCOUNT_JSON env var (base64-encoded service account key)
// which allows cross-project access from reboost-citations GCP → reboost-hub Firebase
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8')
  )
  initializeApp({ credential: cert(serviceAccount) })
} else {
  initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'reboost-hub' })
}

const db = getFirestore()

// ─── Helpers ─────────────────────────────────────────────────────────────────

class SubmissionEngine {
  constructor() {
    this.gmailHandler = null
    this.captchaHandler = null
    this.isRunning = false
    this.pollInterval = 30000 // 30 seconds between polls
  }

  async initialize() {
    console.log('[ENGINE] Initializing submission engine...')

    // Read admin-dashboard keys from Firestore (settings/functionEnvVars), fall back to env vars
    let fsEnv = {}
    try {
      const snap = await db.collection('settings').doc('functionEnvVars').get()
      if (snap.exists) fsEnv = snap.data().vars || {}
      console.log('[ENGINE] Loaded runtime config from Firestore')
    } catch (err) {
      console.warn('[ENGINE] Could not read Firestore config:', err.message)
    }

    const getKey = (...names) => {
      for (const n of names) {
        if (fsEnv[n]) return fsEnv[n]
        if (process.env[n]) return process.env[n]
      }
      return null
    }

    // Initialize Gmail handler
    const gmailClientId     = getKey('GMAIL_CLIENT_ID')
    const gmailClientSecret = getKey('GMAIL_CLIENT_SECRET')
    const gmailRefreshToken = getKey('GMAIL_REFRESH_TOKEN')
    if (gmailClientId && gmailClientSecret && gmailRefreshToken) {
      this.gmailHandler = new GmailHandler(gmailClientId, gmailClientSecret, gmailRefreshToken)
      await this.gmailHandler.initialize()
      console.log('[ENGINE] Gmail handler initialized')
    } else {
      console.warn('[ENGINE] Gmail credentials not found — email verification disabled')
    }

    // Initialize Captcha handler — dashboard saves as TWOCAPTCHA_API_KEY, also accept TWO_CAPTCHA_API_KEY
    const captchaKey = getKey('TWOCAPTCHA_API_KEY', 'TWO_CAPTCHA_API_KEY')
    if (captchaKey) {
      this.captchaHandler = new CaptchaHandler(captchaKey)
      console.log('[ENGINE] Captcha handler initialized')
    } else {
      console.warn('[ENGINE] 2Captcha API key not found — CAPTCHA sites will be skipped')
    }

    this.startPoller()
  }

  startPoller() {
    if (this.isRunning) return
    this.isRunning = true
    console.log('[ENGINE] Job poller started')
    this.pollForJobs()
  }

  async pollForJobs() {
    while (this.isRunning) {
      try {
        const snap = await db.collection('citations')
          .where('status', '==', 'queued')
          .orderBy('createdAt', 'asc')
          .limit(1)
          .get()

        if (!snap.empty) {
          const batch = snap.docs[0]
          await this.processBatch(batch)
        }
      } catch (err) {
        console.error('[ENGINE] Error polling for jobs:', err)
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, this.pollInterval))
    }
  }

  async processBatch(batchDoc) {
    const batchId = batchDoc.id
    const batchData = batchDoc.data()

    console.log(`[BATCH ${batchId}] Starting submission job...`)

    try {
      // Mark as running
      await batchDoc.ref.update({
        status: 'running',
        startedAt: FieldValue.serverTimestamp(),
      })

      // Get directories to submit
      const dirSnap = await batchDoc.ref.collection('directories').get()
      const directories = dirSnap.docs

      console.log(`[BATCH ${batchId}] Processing ${directories.length} directories`)

      let submitted = 0
      let live = 0
      let failed = 0

      for (const dirDoc of directories) {
        const dirData = dirDoc.data()

        try {
          console.log(`[BATCH ${batchId}] Submitting to ${dirData.name}...`)

          // Get directory-specific handler
          const handler = getDirectoryHandler(dirData.name)

          // Perform submission (Playwright + 2Captcha if needed)
          const result = await handler.submit({
            directory: dirData,
            businessData: batchData.businessData,
            gmailHandler: this.gmailHandler,
            captchaHandler: this.captchaHandler,
          })

          // Always close the browser after each handler to free memory.
          // Without this, each Chromium process stays alive and by the 4th
          // directory the container OOMs and crashes the next browser launch.
          await handler.closeBrowser().catch(() => {})

          // Update directory doc with result
          await dirDoc.ref.update({
            status: result.status, // 'live', 'pending', or 'failed'
            submittedAt: FieldValue.serverTimestamp(),
            liveUrl: result.liveUrl || null,
            emailUsed: result.emailUsed || null,
            errorMessage: result.errorMessage || null,
            accountPassword: result.accountPassword || null,
          })

          if (result.status === 'live') live++
          else if (result.status === 'pending') submitted++
          else if (result.status === 'failed') failed++

          console.log(`[BATCH ${batchId}] ${dirData.name}: ${result.status}`)
        } catch (err) {
          console.error(`[BATCH ${batchId}] Error submitting to ${dirData.name}:`, err)
          failed++
          await dirDoc.ref.update({
            status: 'failed',
            submittedAt: FieldValue.serverTimestamp(),
            errorMessage: err.message,
          })
        }

        // Update batch progress every 5 directories
        if ((submitted + live + failed) % 5 === 0) {
          await batchDoc.ref.update({
            submitted,
            live,
            failed,
            pending: directories.length - (submitted + live + failed),
          })
        }
      }

      // Append submitted directories to user profile (for deduplication on next job)
      const submittedDirNames = directories.map(dirDoc => dirDoc.data().name)
      await db.collection('users').doc(batchData.userId).update({
        submittedDirectories: FieldValue.arrayUnion(...submittedDirNames),
      }).catch(err => {
        console.warn(`[BATCH ${batchId}] Warning: Could not update submittedDirectories:`, err.message)
      })

      // Mark batch as completed
      await batchDoc.ref.update({
        status: 'completed',
        submitted,
        live,
        failed,
        pending: 0,
        completedAt: FieldValue.serverTimestamp(),
      })

      console.log(`[BATCH ${batchId}] ✓ Completed: ${live} live, ${submitted} pending, ${failed} failed`)
    } catch (err) {
      console.error(`[BATCH ${batchId}] Fatal error:`, err)
      await batchDoc.ref.update({
        status: 'failed',
        errorMessage: err.message,
        completedAt: FieldValue.serverTimestamp(),
      })
    }
  }
}

// ─── Express Routes ──────────────────────────────────────────────────────────

const engine = new SubmissionEngine()

app.get('/health', (req, res) => {
  res.json({ status: 'ok', running: engine.isRunning })
})

app.post('/trigger', async (req, res) => {
  console.log('[API] Received manual trigger request')
  res.json({ message: 'Job poller is active', running: engine.isRunning })
})

// ─── Startup ─────────────────────────────────────────────────────────────────

app.listen(PORT, async () => {
  console.log(`[SERVER] Listening on port ${PORT}`)
  await engine.initialize()
})

module.exports = engine
