const { onCall, HttpsError, onRequest } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')
const Stripe = require('stripe')
const axios = require('axios')

initializeApp()
const db = getFirestore()
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '')

// ─── Helpers ─────────────────────────────────────────────────────────────────

function scoreToGrade(score) {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 45) return 'D'
  return 'F'
}

function clamp(val, min = 0, max = 100) {
  return Math.min(max, Math.max(min, val))
}

// Trigger Cloud Run submission engine when a batch is queued
async function triggerCitationsSubmission() {
  try {
    const cloudRunUrl = process.env.CLOUD_RUN_URL
    if (!cloudRunUrl) {
      console.warn('CLOUD_RUN_URL env var not set — Cloud Run trigger disabled')
      return
    }

    await axios.post(`${cloudRunUrl}/trigger`, {}, { timeout: 5000 })
    console.log('Cloud Run submission engine triggered')
  } catch (err) {
    console.warn('Could not trigger Cloud Run:', err.message)
  }
}

// ─── runSeoAudit ─────────────────────────────────────────────────────────────
// Called from the frontend. Runs PageSpeed + GMB checks and saves to Firestore.
//
// Required env vars (Firebase Functions secrets or .env):
//   PAGESPEED_API_KEY  — Google PageSpeed Insights API key (optional but raises quota)
//   GOOGLE_PLACES_KEY  — Google Places API key (required for GMB check)

exports.runSeoAudit = onCall(
  { timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    const { url, businessName, city } = request.data
    const userId = request.auth?.uid

    if (!url || !businessName || !city) {
      throw new HttpsError('invalid-argument', 'url, businessName, and city are required.')
    }

    const PAGESPEED_KEY = process.env.PAGESPEED_API_KEY || ''
    const PLACES_KEY = process.env.GOOGLE_PLACES_KEY || ''

    const result = {
      url,
      businessName,
      city,
      userId: userId || null,
      scores: {},
      metrics: {},
      insights: [],
      overallScore: 0,
      overallGrade: 'F',
    }

    // ── 1. PageSpeed Insights (Mobile) ───────────────────────────────────────
    try {
      const psUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed')
      psUrl.searchParams.set('url', url)
      psUrl.searchParams.set('strategy', 'mobile')
      psUrl.searchParams.set('category', 'performance')
      psUrl.searchParams.append('category', 'seo')
      psUrl.searchParams.append('category', 'accessibility')
      psUrl.searchParams.append('category', 'best-practices')
      if (PAGESPEED_KEY) psUrl.searchParams.set('key', PAGESPEED_KEY)

      const psRes = await fetch(psUrl.toString(), { signal: AbortSignal.timeout(45000) })
      const psData = await psRes.json()

      if (psData.error) {
        throw new Error(psData.error.message || 'PageSpeed API error')
      }

      const lr = psData.lighthouseResult || {}
      const cats = lr.categories || {}
      const audits = lr.audits || {}

      const perfScore = clamp(Math.round((cats.performance?.score || 0) * 100))
      const seoScore = clamp(Math.round((cats.seo?.score || 0) * 100))
      const a11yScore = clamp(Math.round((cats.accessibility?.score || 0) * 100))
      const bpScore = clamp(Math.round((cats['best-practices']?.score || 0) * 100))

      result.scores.performance = { score: perfScore, grade: scoreToGrade(perfScore) }
      result.scores.seo = { score: seoScore, grade: scoreToGrade(seoScore) }
      result.scores.accessibility = { score: a11yScore, grade: scoreToGrade(a11yScore) }
      result.scores.bestPractices = { score: bpScore, grade: scoreToGrade(bpScore) }

      // Core Web Vitals
      result.metrics = {
        fcp: audits['first-contentful-paint']?.displayValue || null,
        lcp: audits['largest-contentful-paint']?.displayValue || null,
        tbt: audits['total-blocking-time']?.displayValue || null,
        cls: audits['cumulative-layout-shift']?.displayValue || null,
        si: audits['speed-index']?.displayValue || null,
        fid: audits['max-potential-fid']?.displayValue || null,
        // Scores for coloring
        fcpScore: clamp(Math.round((audits['first-contentful-paint']?.score || 0) * 100)),
        lcpScore: clamp(Math.round((audits['largest-contentful-paint']?.score || 0) * 100)),
        tbtScore: clamp(Math.round((audits['total-blocking-time']?.score || 0) * 100)),
        clsScore: clamp(Math.round((audits['cumulative-layout-shift']?.score || 0) * 100)),
      }

      // Top failing audits as improvement suggestions
      result.insights = Object.values(audits)
        .filter(a => a.score !== null && a.score < 0.9 && a.title && a.description && a.scoreDisplayMode !== 'informative')
        .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
        .slice(0, 6)
        .map(a => ({
          title: a.title,
          description: a.description?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'), // strip MD links
          score: clamp(Math.round((a.score || 0) * 100)),
          displayValue: a.displayValue || null,
        }))

    } catch (err) {
      console.error('PageSpeed error:', err.message)
      result.scores.performance = { score: null, grade: 'N/A', error: 'Could not fetch page speed data' }
      result.scores.seo = { score: null, grade: 'N/A', error: 'Could not fetch SEO data' }
    }

    // ── 2. GMB / Google Places Check ────────────────────────────────────────
    if (PLACES_KEY) {
      try {
        const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
        placesUrl.searchParams.set('query', `${businessName} ${city}`)
        placesUrl.searchParams.set('key', PLACES_KEY)

        const placesRes = await fetch(placesUrl.toString(), { signal: AbortSignal.timeout(15000) })
        const placesData = await placesRes.json()

        if (placesData.status === 'OK' && placesData.results?.length > 0) {
          const place = placesData.results[0]
          const rating = place.rating || 0
          const reviewCount = place.user_ratings_total || 0

          // Score: presence + review volume + rating quality
          let gmbScore = 40  // found, bare minimum
          if (reviewCount >= 1)  gmbScore = 55
          if (reviewCount >= 5)  gmbScore = 65
          if (reviewCount >= 10 && rating >= 3.5) gmbScore = 75
          if (reviewCount >= 25 && rating >= 4.0) gmbScore = 85
          if (reviewCount >= 50 && rating >= 4.3) gmbScore = 92
          if (reviewCount >= 100 && rating >= 4.5) gmbScore = 98

          result.scores.gmb = {
            score: gmbScore,
            grade: scoreToGrade(gmbScore),
            found: true,
            rating,
            reviewCount,
            placeId: place.place_id || null,
            address: place.formatted_address || null,
            types: place.types?.slice(0, 3) || [],
          }
        } else {
          // Status ZERO_RESULTS or no match
          result.scores.gmb = {
            score: 5,
            grade: 'F',
            found: false,
            note: 'No Google Business Profile found for this name and city.',
          }
        }
      } catch (err) {
        console.error('Places error:', err.message)
        result.scores.gmb = { score: null, grade: 'N/A', error: 'GMB check failed' }
      }
    } else {
      result.scores.gmb = {
        score: null,
        grade: 'N/A',
        skipped: true,
        note: 'Google Places API key not configured — GMB check skipped.',
      }
    }

    // ── 3. Citation Consistency Score (estimated) ────────────────────────────
    // Real citation checking requires a paid service (BrightLocal, Moz Local, etc.)
    // We estimate here; the Citations tool does the real submission & monitoring.
    const gmbFound = result.scores.gmb?.found === true
    const hasGoodGmb = (result.scores.gmb?.score || 0) >= 75
    const webPerfScore = result.scores.performance?.score || 0

    // Estimate: GMB presence + decent web presence = likely some citations
    let citScore = 20 // baseline — unclaimed/no presence
    if (gmbFound) citScore = 38
    if (gmbFound && webPerfScore > 40) citScore = 48
    if (hasGoodGmb) citScore = 55
    if (hasGoodGmb && webPerfScore > 60) citScore = 62

    result.scores.citations = {
      score: citScore,
      grade: scoreToGrade(citScore),
      estimated: true,
      note: 'Estimated based on GMB presence and web health. Run the full Citations audit for your exact listing score across 80+ directories.',
    }

    // ── 4. Overall Score (weighted) ──────────────────────────────────────────
    const WEIGHTS = {
      performance: 0.28,
      seo: 0.25,
      gmb: 0.30,
      citations: 0.17,
    }

    let wSum = 0
    let wTotal = 0
    for (const [key, w] of Object.entries(WEIGHTS)) {
      const s = result.scores[key]?.score
      if (s !== null && s !== undefined && !result.scores[key]?.skipped) {
        wSum += s * w
        wTotal += w
      }
    }

    result.overallScore = wTotal > 0 ? clamp(Math.round(wSum / wTotal)) : 0
    result.overallGrade = scoreToGrade(result.overallScore)

    // ── 5. Save to Firestore ─────────────────────────────────────────────────
    if (userId) {
      try {
        const docRef = await db.collection('auditResults').add({
          ...result,
          createdAt: FieldValue.serverTimestamp(),
        })
        result.id = docRef.id
      } catch (err) {
        console.error('Firestore save error:', err.message)
        // Non-fatal — still return results to the client
      }
    }

    return result
  }
)

// ─── sendCitationsPreSubmissionEmail ──────────────────────────────────────────
// Sends a pre-submission email warning the user which sites require their verification
// and which use the system email. This is a non-blocking operation.

async function sendCitationsPreSubmissionEmail({ userId, email, businessName, totalDirectories, topTierSites, systemEmailSites }) {
  try {
    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) {
      console.warn('RESEND_API_KEY not set — skipping pre-submission email')
      return
    }

    const topTierList = topTierSites.join(', ')
    const systemEmailList = systemEmailSites.slice(0, 5).join(', ') + (systemEmailSites.length > 5 ? `, and ${systemEmailSites.length - 5} more` : '')

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0;">Citations Submission Starting!</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Hi <strong>${businessName}</strong>,
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Your business citations are now being submitted to <strong>${totalDirectories} directories</strong>.
        </p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #92400e; margin: 0 0 12px 0;">⚠️ Important: Top-Tier Sites Require YOUR Verification</h3>
          <p style="color: #92400e; margin: 0 0 12px 0; line-height: 1.6;">
            The following sites will use <strong>your real email and account</strong>. You MUST monitor these for:
          </p>
          <ul style="color: #92400e; margin: 0 0 12px 0; padding-left: 20px;">
            <li>Email verification links</li>
            <li>Account approval/review</li>
            <li>Future review notifications</li>
          </ul>
          <p style="color: #92400e; margin: 0; font-weight: bold;">
            Sites: ${topTierList}
          </p>
        </div>

        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <h3 style="color: #065f46; margin: 0 0 12px 0;">✅ System Managed Sites</h3>
          <p style="color: #065f46; margin: 0 0 12px 0; line-height: 1.6;">
            These ${systemEmailSites.length} sites will use our system email for verification and notifications:
          </p>
          <p style="color: #065f46; margin: 0; font-weight: bold;">
            ${systemEmailList}
          </p>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
          <strong>Total reach:</strong> ${totalDirectories} direct submissions + aggregator distribution = 500+ total business listings
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
          Check your ReBoost Hub dashboard to monitor submission progress in real-time.
        </p>

        <p style="color: #6b7280; line-height: 1.6; margin: 20px 0 0 0; font-size: 12px;">
          Questions? Contact our support team.
        </p>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ReBoost Marketing HUB <noreply@reboosthub.com>',
        to: email,
        subject: `Citations Submission Starting — ${businessName}`,
        html,
      }),
    })

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`)
    }

    console.log(`[CITATIONS] Pre-submission email sent to ${email}`)
  } catch (err) {
    console.warn('[CITATIONS] Pre-submission email failed (non-blocking):', err.message)
    // Non-blocking — don't throw
  }
}

// ─── startCitationsJob ────────────────────────────────────────────────────────
// Creates a Firestore batch document + all directory sub-documents for the user's
// package tier. The actual Playwright automation runs in Cloud Run (not here) — it
// polls for 'queued' batches and updates status/progress in real-time.

const TIER_COUNTS = { starter: 100, pro: 200, premium: 300 }

// Master directory list — 300 entries sorted by priority (1=highest).
// The job creation slices the first N based on package tier.
const MASTER_DIRECTORIES = [
  // ── Priority 1: Highest DA / most impactful ──────────────────────────────
  { name: 'Yelp',                    url: 'https://www.yelp.com',                   category: 'General',        priority: 1 },
  { name: 'Google Business Profile', url: 'https://business.google.com',            category: 'General',        priority: 1 },
  { name: 'Bing Places',             url: 'https://www.bingplaces.com',             category: 'General',        priority: 1 },
  { name: 'Apple Maps Connect',      url: 'https://mapsconnect.apple.com',          category: 'General',        priority: 1 },
  { name: 'Facebook Business',       url: 'https://www.facebook.com/business',      category: 'Social',         priority: 1 },
  { name: 'Better Business Bureau',  url: 'https://www.bbb.org',                    category: 'General',        priority: 1 },
  { name: 'Yellow Pages',            url: 'https://www.yellowpages.com',            category: 'General',        priority: 1 },
  { name: 'Angi',                    url: 'https://www.angi.com',                   category: 'Home Services',  priority: 1 },
  { name: 'HomeAdvisor',             url: 'https://www.homeadvisor.com',            category: 'Home Services',  priority: 1 },
  { name: 'Thumbtack',               url: 'https://www.thumbtack.com',              category: 'General',        priority: 1 },
  { name: 'Foursquare',              url: 'https://foursquare.com',                 category: 'General',        priority: 1 },
  { name: 'MapQuest',                url: 'https://www.mapquest.com',               category: 'General',        priority: 1 },
  { name: 'Manta',                   url: 'https://www.manta.com',                  category: 'Business',       priority: 1 },
  { name: 'Chamber of Commerce',     url: 'https://www.chamberofcommerce.com',      category: 'Business',       priority: 1 },
  { name: 'MerchantCircle',          url: 'https://www.merchantcircle.com',         category: 'General',        priority: 1 },
  { name: 'Nextdoor',                url: 'https://nextdoor.com',                   category: 'Local',          priority: 1 },
  { name: 'Alignable',               url: 'https://www.alignable.com',              category: 'Business',       priority: 1 },
  { name: 'Superpages',              url: 'https://www.superpages.com',             category: 'General',        priority: 1 },
  { name: 'Whitepages',              url: 'https://www.whitepages.com',             category: 'General',        priority: 1 },
  { name: 'YP.com',                  url: 'https://www.yp.com',                     category: 'General',        priority: 1 },
  // ── Priority 2: High-value data aggregators & verticals ─────────────────
  { name: 'Neustar Localeze',        url: 'https://www.neustarlocaleze.biz',        category: 'Data Aggregator',priority: 2 },
  { name: 'Infogroup / Data Axle',   url: 'https://www.data-axle.com',              category: 'Data Aggregator',priority: 2 },
  { name: 'Dun & Bradstreet',        url: 'https://www.dnb.com',                    category: 'Business',       priority: 2 },
  { name: 'Acxiom',                  url: 'https://www.acxiom.com',                 category: 'Data Aggregator',priority: 2 },
  { name: 'Express Update',          url: 'https://www.expressupdate.com',          category: 'Data Aggregator',priority: 2 },
  { name: 'LinkedIn Company',        url: 'https://www.linkedin.com',               category: 'Professional',   priority: 2 },
  { name: 'Instagram',               url: 'https://www.instagram.com',              category: 'Social',         priority: 2 },
  { name: 'Houzz',                   url: 'https://www.houzz.com',                  category: 'Home Services',  priority: 2 },
  { name: 'Porch',                   url: 'https://porch.com',                      category: 'Home Services',  priority: 2 },
  { name: 'Bark',                    url: 'https://www.bark.com',                   category: 'General',        priority: 2 },
  { name: 'TaskRabbit',              url: 'https://www.taskrabbit.com',             category: 'General',        priority: 2 },
  { name: 'CitySearch',              url: 'https://www.citysearch.com',             category: 'General',        priority: 2 },
  { name: 'InsiderPages',            url: 'https://www.insiderpages.com',           category: 'General',        priority: 2 },
  { name: 'ShowMeLocal',             url: 'https://www.showmelocal.com',            category: 'Local',          priority: 2 },
  { name: 'EZlocal',                 url: 'https://ezlocal.com',                    category: 'General',        priority: 2 },
  { name: 'Hotfrog',                 url: 'https://www.hotfrog.com',                category: 'General',        priority: 2 },
  { name: 'Local.com',               url: 'https://www.local.com',                  category: 'General',        priority: 2 },
  { name: 'Kudzu',                   url: 'https://www.kudzu.com',                  category: 'General',        priority: 2 },
  { name: 'YellowMoxie',             url: 'https://www.yellowmoxie.com',            category: 'General',        priority: 2 },
  { name: 'GetFave',                 url: 'https://www.getfave.com',                category: 'General',        priority: 2 },
  { name: 'Brownbook',               url: 'https://www.brownbook.net',              category: 'General',        priority: 2 },
  { name: 'Fyple',                   url: 'https://www.fyple.com',                  category: 'General',        priority: 2 },
  { name: 'eLocal',                  url: 'https://www.elocal.com',                 category: 'General',        priority: 2 },
  { name: 'USCity.net',              url: 'https://www.uscity.net',                 category: 'Local',          priority: 2 },
  { name: 'Switchboard',             url: 'https://www.switchboard.com',            category: 'General',        priority: 2 },
  { name: 'YellowPageCity',          url: 'https://www.yellowpagecity.com',         category: 'General',        priority: 2 },
  { name: 'HERE Maps',               url: 'https://here.com',                       category: 'General',        priority: 2 },
  { name: 'TomTom',                  url: 'https://www.tomtom.com',                 category: 'General',        priority: 2 },
  { name: 'Google Maps (listing)',   url: 'https://maps.google.com',                category: 'General',        priority: 2 },
  { name: 'Bing Maps',               url: 'https://www.bing.com/maps',              category: 'General',        priority: 2 },
  // ── Priority 3: Extended reach ───────────────────────────────────────────
  { name: 'Cylex',                   url: 'https://www.cylex.us.com',               category: 'General',        priority: 3 },
  { name: 'n49',                     url: 'https://www.n49.com',                    category: 'General',        priority: 3 },
  { name: 'Tuugo',                   url: 'https://www.tuugo.us',                   category: 'General',        priority: 3 },
  { name: 'Topix',                   url: 'https://www.topix.com',                  category: 'Local',          priority: 3 },
  { name: 'Opendi',                  url: 'https://www.opendi.us',                  category: 'General',        priority: 3 },
  { name: 'iGlobal',                 url: 'https://www.iglobal.co',                 category: 'General',        priority: 3 },
  { name: 'Salespider',              url: 'https://www.salespider.com',             category: 'Business',       priority: 3 },
  { name: 'Americantowns',           url: 'https://www.americantowns.com',          category: 'Local',          priority: 3 },
  { name: 'Oodle',                   url: 'https://www.oodle.com',                  category: 'General',        priority: 3 },
  { name: 'Zipleaf',                 url: 'https://www.zipleaf.us',                 category: 'General',        priority: 3 },
  { name: 'BizHWY',                  url: 'https://www.bizhwy.com',                 category: 'Business',       priority: 3 },
  { name: 'Storeboard',              url: 'https://www.storeboard.com',             category: 'Business',       priority: 3 },
  { name: 'Tupalo',                  url: 'https://www.tupalo.com',                 category: 'General',        priority: 3 },
  { name: 'DirJournal',              url: 'https://www.dirjournal.com',             category: 'General',        priority: 3 },
  { name: 'Lacartes',                url: 'https://www.lacartes.com',               category: 'General',        priority: 3 },
  { name: 'iBegin',                  url: 'https://www.ibegin.com',                 category: 'General',        priority: 3 },
  { name: 'Communitywalk',           url: 'https://www.communitywalk.com',          category: 'Local',          priority: 3 },
  { name: 'City-data',               url: 'https://www.city-data.com',              category: 'Local',          priority: 3 },
  { name: 'Cityfos',                 url: 'https://www.cityfos.com',                category: 'Local',          priority: 3 },
  { name: 'Geebo',                   url: 'https://www.geebo.com',                  category: 'General',        priority: 3 },
  { name: 'BizQuid',                 url: 'https://www.bizquid.com',                category: 'Business',       priority: 3 },
  { name: 'Spoke',                   url: 'https://www.spoke.com',                  category: 'Business',       priority: 3 },
  { name: 'Pinterest Business',      url: 'https://business.pinterest.com',         category: 'Social',         priority: 3 },
  { name: 'YouTube Channel',         url: 'https://www.youtube.com',                category: 'Social',         priority: 3 },
  { name: 'Twitter / X',             url: 'https://twitter.com',                    category: 'Social',         priority: 3 },
  { name: 'TikTok Business',         url: 'https://business.tiktok.com',            category: 'Social',         priority: 3 },
  { name: 'Indeed Company',          url: 'https://www.indeed.com',                 category: 'Employment',     priority: 3 },
  { name: 'Glassdoor',               url: 'https://www.glassdoor.com',              category: 'Employment',     priority: 3 },
  { name: 'Craigslist',              url: 'https://www.craigslist.org',             category: 'Classified',     priority: 3 },
  { name: 'Angie\'s List',           url: 'https://www.angieslist.com',             category: 'Home Services',  priority: 3 },
  { name: 'HomeStars',               url: 'https://homestars.com',                  category: 'Home Services',  priority: 3 },
  { name: 'Hometalk',                url: 'https://www.hometalk.com',               category: 'Home Services',  priority: 3 },
  { name: 'Quora',                   url: 'https://www.quora.com',                  category: 'Social',         priority: 3 },
  { name: 'Reddit',                  url: 'https://www.reddit.com',                 category: 'Social',         priority: 3 },
  { name: 'Factual',                 url: 'https://www.factual.com',                category: 'Data Aggregator',priority: 3 },
  { name: 'Navmii',                  url: 'https://www.navmii.com',                 category: 'General',        priority: 3 },
  { name: 'B2B Yellow Pages',        url: 'https://www.b2byellowpages.com',         category: 'Business',       priority: 3 },
  { name: 'US Business Directory',   url: 'https://www.usbizdir.com',               category: 'Business',       priority: 3 },
  { name: 'YellowUSA',               url: 'https://www.yellowusa.com',              category: 'General',        priority: 3 },
  { name: 'Biz Journals',            url: 'https://www.bizjournals.com',            category: 'Business',       priority: 3 },
  // ── Pro tier extras (dirs 101–200) ──────────────────────────────────────
  { name: 'Zomato',                  url: 'https://www.zomato.com',                 category: 'Food & Dining',  priority: 3 },
  { name: 'OpenTable',               url: 'https://www.opentable.com',              category: 'Food & Dining',  priority: 3 },
  { name: 'Grubhub',                 url: 'https://www.grubhub.com',                category: 'Food & Dining',  priority: 3 },
  { name: 'DoorDash Business',       url: 'https://www.doordash.com',               category: 'Food & Dining',  priority: 3 },
  { name: 'Uber Eats Partner',       url: 'https://merchants.ubereats.com',         category: 'Food & Dining',  priority: 3 },
  { name: 'Tripadvisor',             url: 'https://www.tripadvisor.com',            category: 'Travel',         priority: 3 },
  { name: 'Expedia Local Expert',    url: 'https://www.expedia.com',                category: 'Travel',         priority: 3 },
  { name: 'Hotels.com Partner',      url: 'https://www.hotels.com',                 category: 'Travel',         priority: 3 },
  { name: 'Vet Ratings',             url: 'https://www.vetratings.com',             category: 'Healthcare',     priority: 3 },
  { name: 'Healthgrades',            url: 'https://www.healthgrades.com',           category: 'Healthcare',     priority: 3 },
  { name: 'Zocdoc',                  url: 'https://www.zocdoc.com',                 category: 'Healthcare',     priority: 3 },
  { name: 'Vitals',                  url: 'https://www.vitals.com',                 category: 'Healthcare',     priority: 3 },
  { name: 'WebMD Find a Doctor',     url: 'https://doctor.webmd.com',               category: 'Healthcare',     priority: 3 },
  { name: 'Lawyers.com',             url: 'https://www.lawyers.com',                category: 'Legal',          priority: 3 },
  { name: 'Avvo',                    url: 'https://www.avvo.com',                   category: 'Legal',          priority: 3 },
  { name: 'Martindale',              url: 'https://www.martindale.com',             category: 'Legal',          priority: 3 },
  { name: 'FindLaw',                 url: 'https://www.findlaw.com',                category: 'Legal',          priority: 3 },
  { name: 'Justia',                  url: 'https://www.justia.com',                 category: 'Legal',          priority: 3 },
  { name: 'Realtor.com',             url: 'https://www.realtor.com',                category: 'Real Estate',    priority: 3 },
  { name: 'Zillow',                  url: 'https://www.zillow.com',                 category: 'Real Estate',    priority: 3 },
  { name: 'Trulia',                  url: 'https://www.trulia.com',                 category: 'Real Estate',    priority: 3 },
  { name: 'Cars.com',                url: 'https://www.cars.com',                   category: 'Automotive',     priority: 3 },
  { name: 'CarGurus',                url: 'https://www.cargurus.com',               category: 'Automotive',     priority: 3 },
  { name: 'AutoTrader',              url: 'https://www.autotrader.com',             category: 'Automotive',     priority: 3 },
  { name: 'DealerRater',             url: 'https://www.dealerrater.com',            category: 'Automotive',     priority: 3 },
  { name: 'Edmunds',                 url: 'https://www.edmunds.com',                category: 'Automotive',     priority: 3 },
  { name: 'Yelp Eat24',              url: 'https://eat24.yelp.com',                 category: 'Food & Dining',  priority: 3 },
  { name: 'Clutch.co',               url: 'https://clutch.co',                      category: 'Business',       priority: 3 },
  { name: 'G2',                      url: 'https://www.g2.com',                     category: 'Business',       priority: 3 },
  { name: 'Capterra',                url: 'https://www.capterra.com',               category: 'Business',       priority: 3 },
  { name: 'Trustpilot',              url: 'https://www.trustpilot.com',             category: 'General',        priority: 3 },
  { name: 'Sitejabber',              url: 'https://www.sitejabber.com',             category: 'General',        priority: 3 },
  { name: 'ProvenExpert',            url: 'https://www.provenexpert.com',           category: 'General',        priority: 3 },
  { name: 'Bing Business Profile',   url: 'https://www.bingplaces.com',             category: 'General',        priority: 3 },
  { name: 'Yahoo Local',             url: 'https://local.yahoo.com',                category: 'General',        priority: 3 },
  { name: 'Spoke.com',               url: 'https://www.spoke.com',                  category: 'Business',       priority: 3 },
  { name: 'MyHuckleberry',           url: 'https://www.myhuckleberry.com',          category: 'Local',          priority: 3 },
  { name: 'YellowBot',               url: 'https://www.yellowbot.com',              category: 'General',        priority: 3 },
  { name: 'Insider Pages',           url: 'https://www.insiderpages.com',           category: 'General',        priority: 3 },
  { name: 'Point2Homes',             url: 'https://www.point2homes.com',            category: 'Real Estate',    priority: 3 },
  { name: 'WeddingWire',             url: 'https://www.weddingwire.com',            category: 'Events',         priority: 3 },
  { name: 'The Knot',                url: 'https://www.theknot.com',                category: 'Events',         priority: 3 },
  { name: 'GigSalad',                url: 'https://www.gigsalad.com',               category: 'Events',         priority: 3 },
  { name: 'GigMasters',              url: 'https://www.gigmasters.com',             category: 'Events',         priority: 3 },
  { name: 'Eventbrite',              url: 'https://www.eventbrite.com',             category: 'Events',         priority: 3 },
  { name: 'Meetup',                  url: 'https://www.meetup.com',                 category: 'Local',          priority: 3 },
  { name: 'PetFinder',               url: 'https://www.petfinder.com',              category: 'Pets',           priority: 3 },
  { name: 'Petco',                   url: 'https://www.petco.com',                  category: 'Pets',           priority: 3 },
  { name: 'YP Dex',                  url: 'https://www.ypdex.com',                  category: 'General',        priority: 3 },
  // ── Premium tier extras (dirs 201–300) ──────────────────────────────────
  { name: 'Bing Local',              url: 'https://www.bing.com/local',             category: 'General',        priority: 3 },
  { name: 'Citysquares',             url: 'https://citysquares.com',                category: 'Local',          priority: 3 },
  { name: 'Menupages',               url: 'https://www.menupages.com',              category: 'Food & Dining',  priority: 3 },
  { name: 'Urban Spoon',             url: 'https://www.urbanspoon.com',             category: 'Food & Dining',  priority: 3 },
  { name: 'Zagat',                   url: 'https://www.zagat.com',                  category: 'Food & Dining',  priority: 3 },
  { name: 'Restaurantji',            url: 'https://www.restaurantji.com',           category: 'Food & Dining',  priority: 3 },
  { name: 'Allmenus',                url: 'https://www.allmenus.com',               category: 'Food & Dining',  priority: 3 },
  { name: 'Booksy',                  url: 'https://booksy.com',                     category: 'Beauty',         priority: 3 },
  { name: 'StyleSeat',               url: 'https://www.styleseat.com',              category: 'Beauty',         priority: 3 },
  { name: 'Vagaro',                  url: 'https://www.vagaro.com',                 category: 'Beauty',         priority: 3 },
  { name: 'MindBody',                url: 'https://www.mindbodyonline.com',         category: 'Health & Fitness',priority: 3 },
  { name: 'ClassPass',               url: 'https://classpass.com',                  category: 'Health & Fitness',priority: 3 },
  { name: 'Bark (UK)',               url: 'https://www.bark.com',                   category: 'General',        priority: 3 },
  { name: 'ServiceMagic',            url: 'https://www.servicemagic.com',           category: 'Home Services',  priority: 3 },
  { name: 'Networx',                 url: 'https://www.networx.com',                category: 'Home Services',  priority: 3 },
  { name: 'HomeStars Pro',           url: 'https://pro.homestars.com',              category: 'Home Services',  priority: 3 },
  { name: '1-800-Contractor',        url: 'https://www.1800contractor.com',         category: 'Home Services',  priority: 3 },
  { name: 'BuildZoom',               url: 'https://www.buildzoom.com',              category: 'Construction',   priority: 3 },
  { name: 'Contractors.com',         url: 'https://www.contractors.com',            category: 'Construction',   priority: 3 },
  { name: 'ImproveNet',              url: 'https://www.improvenet.com',             category: 'Home Services',  priority: 3 },
  { name: 'Fixr',                    url: 'https://www.fixr.com',                   category: 'Home Services',  priority: 3 },
  { name: 'LawnStarter',             url: 'https://www.lawnstarter.com',            category: 'Landscaping',    priority: 3 },
  { name: 'Lawn Love',               url: 'https://lawnlove.com',                   category: 'Landscaping',    priority: 3 },
  { name: 'Yelp for Business',       url: 'https://biz.yelp.com',                   category: 'General',        priority: 3 },
  { name: 'LocalStack',              url: 'https://www.localstack.com',             category: 'Local',          priority: 3 },
  { name: 'Angies Web',              url: 'https://www.angiesweb.com',              category: 'Home Services',  priority: 3 },
  { name: 'HireRush',                url: 'https://www.hirerush.com',               category: 'General',        priority: 3 },
  { name: 'Handy',                   url: 'https://www.handy.com',                  category: 'Home Services',  priority: 3 },
  { name: 'Wize Commerce',           url: 'https://www.wize.com',                   category: 'General',        priority: 3 },
  { name: 'BrightLocal',             url: 'https://www.brightlocal.com',            category: 'Local',          priority: 3 },
  { name: 'Yext',                    url: 'https://www.yext.com',                   category: 'Data Aggregator',priority: 3 },
  { name: 'Upcity',                  url: 'https://upcity.com',                     category: 'Business',       priority: 3 },
  { name: 'Expertise.com',           url: 'https://www.expertise.com',              category: 'Business',       priority: 3 },
  { name: 'Yelp Restaurants',        url: 'https://www.yelp.com/search?cflt=restaurants', category: 'Food & Dining', priority: 3 },
  { name: 'TripAdvisor Restaurants', url: 'https://www.tripadvisor.com',            category: 'Travel',         priority: 3 },
  { name: 'Bookatable',              url: 'https://www.bookatable.com',             category: 'Food & Dining',  priority: 3 },
  { name: 'Localpin',                url: 'https://www.localpin.com',               category: 'Local',          priority: 3 },
  { name: 'Bizwiki',                 url: 'https://www.bizwiki.com',                category: 'Business',       priority: 3 },
  { name: 'Pointcom',                url: 'https://www.pointcom.com',               category: 'General',        priority: 3 },
  { name: 'USDirectory',             url: 'https://www.usdirectory.com',            category: 'General',        priority: 3 },
  { name: 'BusinessMagnet',          url: 'https://www.businessmagnet.net',         category: 'Business',       priority: 3 },
  { name: 'The Real Yellow Pages',   url: 'https://www.therealyellowpages.com',     category: 'General',        priority: 3 },
  { name: 'Local Business Link',     url: 'https://www.localbusinesslink.com',      category: 'Local',          priority: 3 },
  { name: 'NearSay',                 url: 'https://www.nearsay.com',                category: 'Local',          priority: 3 },
  { name: 'Magic Yellow',            url: 'https://www.magicyellow.com',            category: 'General',        priority: 3 },
  { name: 'My Local Services',       url: 'https://www.mylocalservices.com',        category: 'General',        priority: 3 },
  { name: 'Phone Book',              url: 'https://www.phonebook.com',              category: 'General',        priority: 3 },
  { name: '411.com',                 url: 'https://www.411.com',                    category: 'General',        priority: 3 },
  { name: '192.com Business',        url: 'https://www.192.com',                    category: 'General',        priority: 3 },
  { name: 'Scoot',                   url: 'https://www.scoot.co.uk',                category: 'General',        priority: 3 },
  { name: 'Yalwa',                   url: 'https://www.yalwa.com',                  category: 'General',        priority: 3 },
  { name: 'Where To?',               url: 'https://www.whereto.com',                category: 'General',        priority: 3 },
  { name: 'Yelp Events',             url: 'https://www.yelp.com/events',            category: 'Events',         priority: 3 },
  { name: 'Patch',                   url: 'https://patch.com',                      category: 'Local',          priority: 3 },
  { name: 'Neighborhood Scout',      url: 'https://www.neighborhoodscout.com',      category: 'Local',          priority: 3 },
  { name: 'CitySlick',               url: 'https://www.cityslick.net',              category: 'Local',          priority: 3 },
  // ── Additional directories to reach 300 total ────────────────────────────
  { name: 'Smile Brands',            url: 'https://www.smilebrands.com',            category: 'Healthcare',     priority: 3 },
  { name: 'Dental Plans',            url: 'https://www.dentalplans.com',            category: 'Healthcare',     priority: 3 },
  { name: 'Care.com',                url: 'https://www.care.com',                   category: 'Services',       priority: 3 },
  { name: 'Urban Sitter',            url: 'https://www.urbansitter.com',            category: 'Services',       priority: 3 },
  { name: 'Rover.com',               url: 'https://www.rover.com',                  category: 'Pets',           priority: 3 },
  { name: 'Care Dash',               url: 'https://www.caredash.com',               category: 'Healthcare',     priority: 3 },
  { name: 'Bamboo HR',               url: 'https://www.bamboohr.com',               category: 'Business',       priority: 3 },
  { name: 'Guidepoint',              url: 'https://www.guidepoint.com',             category: 'Business',       priority: 3 },
  { name: 'ServiceTitan',            url: 'https://www.servicetitan.com',           category: 'Business',       priority: 3 },
  { name: 'Housecall Pro',           url: 'https://www.housecallpro.com',           category: 'Home Services',  priority: 3 },
  { name: 'Ontraport',               url: 'https://www.ontraport.com',              category: 'Business',       priority: 3 },
  { name: 'Podio',                   url: 'https://podio.com',                      category: 'Business',       priority: 3 },
  { name: 'Airtable Marketplace',    url: 'https://airtable.com/marketplace',       category: 'Business',       priority: 3 },
  { name: 'Zapier Apps',             url: 'https://zapier.com/apps',                category: 'Business',       priority: 3 },
  { name: 'IFTTT',                   url: 'https://ifttt.com',                      category: 'Business',       priority: 3 },
  { name: 'Integromat',              url: 'https://www.integromat.com',             category: 'Business',       priority: 3 },
  { name: 'Patreon',                 url: 'https://www.patreon.com',                category: 'Social',         priority: 3 },
  { name: 'Buy Me a Coffee',         url: 'https://www.buymeacoffee.com',           category: 'Business',       priority: 3 },
  { name: 'Ko-fi',                   url: 'https://ko-fi.com',                      category: 'Business',       priority: 3 },
  { name: 'Substack',                url: 'https://substack.com',                   category: 'Social',         priority: 3 },
  { name: 'Medium',                  url: 'https://medium.com',                     category: 'Social',         priority: 3 },
  { name: 'Medium Publications',     url: 'https://medium.com/publications',        category: 'Social',         priority: 3 },
  { name: 'Dev.to',                  url: 'https://dev.to',                         category: 'Business',       priority: 3 },
  { name: 'Hashnode',                url: 'https://hashnode.com',                   category: 'Business',       priority: 3 },
  { name: 'Wix',                     url: 'https://www.wix.com',                    category: 'General',        priority: 3 },
  { name: 'Weebly',                  url: 'https://www.weebly.com',                 category: 'General',        priority: 3 },
  { name: 'Squarespace',             url: 'https://www.squarespace.com',            category: 'General',        priority: 3 },
  { name: 'Shopify Store Locator',   url: 'https://www.shopify.com',                category: 'E-commerce',     priority: 3 },
  { name: 'BigCommerce',             url: 'https://www.bigcommerce.com',            category: 'E-commerce',     priority: 3 },
  { name: 'Etsy',                    url: 'https://www.etsy.com',                   category: 'E-commerce',     priority: 3 },
  { name: 'Amazon Business',         url: 'https://www.amazon.com/business',        category: 'E-commerce',     priority: 3 },
  { name: 'eBay Store',              url: 'https://stores.ebay.com',                category: 'E-commerce',     priority: 3 },
  { name: 'Alibaba',                 url: 'https://www.alibaba.com',                category: 'E-commerce',     priority: 3 },
  { name: 'Global Sources',          url: 'https://www.globalsources.com',          category: 'E-commerce',     priority: 3 },
  { name: 'TradeKey',                url: 'https://www.tradekey.com',               category: 'Business',       priority: 3 },
  { name: 'Made-in-China',           url: 'https://www.made-in-china.com',          category: 'E-commerce',     priority: 3 },
  { name: 'Thomasnet',               url: 'https://www.thomasnet.com',              category: 'Business',       priority: 3 },
  { name: 'Kompass',                 url: 'https://us.kompass.com',                 category: 'Business',       priority: 3 },
  { name: 'European Business Pages',url: 'https://www.europages.co.uk',            category: 'Business',       priority: 3 },
  { name: 'TTNET',                   url: 'https://ttnet.net',                      category: 'General',        priority: 3 },
  { name: 'Alibaba Local Services',  url: 'https://services.alibaba.com',           category: 'Services',       priority: 3 },
  { name: 'Thumbtack Marketplace',   url: 'https://marketplace.thumbtack.com',      category: 'Services',       priority: 3 },
  { name: 'Fiverr',                  url: 'https://www.fiverr.com',                 category: 'Freelance',      priority: 3 },
  { name: 'Upwork',                  url: 'https://www.upwork.com',                 category: 'Freelance',      priority: 3 },
  { name: 'PeoplePerHour',           url: 'https://www.peopleperhour.com',          category: 'Freelance',      priority: 3 },
  { name: 'Guru',                    url: 'https://www.guru.com',                   category: 'Freelance',      priority: 3 },
  { name: 'Freelancer.com',          url: 'https://www.freelancer.com',             category: 'Freelance',      priority: 3 },
  { name: 'Gun.io',                  url: 'https://gun.io',                         category: 'Freelance',      priority: 3 },
  { name: 'Toptal',                  url: 'https://www.toptal.com',                 category: 'Freelance',      priority: 3 },
  { name: '99designs',               url: 'https://99designs.com',                  category: 'Freelance',      priority: 3 },
  { name: 'Dribbble',                url: 'https://dribbble.com',                   category: 'Design',         priority: 3 },
  { name: 'Behance',                 url: 'https://www.behance.net',                category: 'Design',         priority: 3 },
  { name: 'ArtStation',              url: 'https://www.artstation.com',             category: 'Design',         priority: 3 },
  { name: 'Stock Photography Agencies', url: 'https://www.shutterstock.com',       category: 'Creative',       priority: 3 },
  { name: 'iStock',                  url: 'https://www.istockphoto.com',            category: 'Creative',       priority: 3 },
  { name: 'Adobe Stock',             url: 'https://stock.adobe.com',                category: 'Creative',       priority: 3 },
  { name: 'Getty Images',            url: 'https://www.gettyimages.com',            category: 'Creative',       priority: 3 },
  { name: 'Alamy',                   url: 'https://www.alamy.com',                  category: 'Creative',       priority: 3 },
  { name: 'Pond5',                   url: 'https://www.pond5.com',                  category: 'Creative',       priority: 3 },
  { name: 'Pixabay',                 url: 'https://pixabay.com',                    category: 'Creative',       priority: 3 },
  { name: 'Unsplash',                url: 'https://unsplash.com',                   category: 'Creative',       priority: 3 },
  { name: 'Pexels',                  url: 'https://www.pexels.com',                 category: 'Creative',       priority: 3 },
  { name: 'Flickr',                  url: 'https://www.flickr.com',                 category: 'Social',         priority: 3 },
  { name: 'DeviantArt',              url: 'https://www.deviantart.com',             category: 'Social',         priority: 3 },
  { name: '500px',                   url: 'https://500px.com',                      category: 'Social',         priority: 3 },
  { name: 'SmugMug',                 url: 'https://www.smugmug.com',                category: 'Social',         priority: 3 },
  { name: 'Vimeo',                   url: 'https://vimeo.com',                      category: 'Social',         priority: 3 },
  { name: 'Dailymotion',             url: 'https://www.dailymotion.com',            category: 'Social',         priority: 3 },
  { name: 'Twitch',                  url: 'https://www.twitch.tv',                  category: 'Social',         priority: 3 },
  { name: 'Rumble',                  url: 'https://rumble.com',                     category: 'Social',         priority: 3 },
  { name: 'Odysee',                  url: 'https://odysee.com',                     category: 'Social',         priority: 3 },
  { name: 'Telegram Channel',        url: 'https://telegram.org',                   category: 'Social',         priority: 3 },
  { name: 'Discord Server',          url: 'https://discord.com',                    category: 'Social',         priority: 3 },
  { name: 'Slack Workspace',         url: 'https://slack.com',                      category: 'Business',       priority: 3 },
  { name: 'Microsoft Teams',         url: 'https://teams.microsoft.com',            category: 'Business',       priority: 3 },
  { name: 'Zoom Meetings',           url: 'https://zoom.us',                        category: 'Business',       priority: 3 },
  { name: 'Google Meet',             url: 'https://meet.google.com',                category: 'Business',       priority: 3 },
  { name: 'Skype',                   url: 'https://www.skype.com',                  category: 'Communication',  priority: 3 },
  { name: 'WhatsApp Business',       url: 'https://www.whatsapp.com/business',      category: 'Communication',  priority: 3 },
  { name: 'Viber Business',          url: 'https://viber.com/business',             category: 'Communication',  priority: 3 },
  { name: 'WeChat Business',         url: 'https://business.wechat.com',            category: 'Communication',  priority: 3 },
  { name: 'Line Business',           url: 'https://business.line.biz',              category: 'Communication',  priority: 3 },
  { name: 'Signal',                  url: 'https://signal.org',                     category: 'Communication',  priority: 3 },
  { name: 'Twilio',                  url: 'https://www.twilio.com',                 category: 'Business',       priority: 3 },
  { name: 'SendGrid',                url: 'https://sendgrid.com',                   category: 'Business',       priority: 3 },
  { name: 'Mailchimp',               url: 'https://mailchimp.com',                  category: 'Business',       priority: 3 },
  { name: 'ConvertKit',              url: 'https://convertkit.com',                 category: 'Business',       priority: 3 },
  { name: 'GetResponse',             url: 'https://www.getresponse.com',            category: 'Business',       priority: 3 },
  { name: 'Active Campaign',         url: 'https://www.activecampaign.com',         category: 'Business',       priority: 3 },
  { name: 'HubSpot',                 url: 'https://www.hubspot.com',                category: 'Business',       priority: 3 },
  { name: 'Pipedrive',               url: 'https://www.pipedrive.com',              category: 'Business',       priority: 3 },
  { name: 'Salesforce',              url: 'https://www.salesforce.com',             category: 'Business',       priority: 3 },
  { name: 'Zoho CRM',                url: 'https://www.zoho.com/crm',               category: 'Business',       priority: 3 },
  { name: 'Freshsales',              url: 'https://www.freshworks.com/crm',         category: 'Business',       priority: 3 },
  { name: 'Agile CRM',               url: 'https://www.agilecrm.com',               category: 'Business',       priority: 3 },
  { name: 'Base CRM',                url: 'https://getbase.com',                    category: 'Business',       priority: 3 },
  { name: 'Zendesk',                 url: 'https://www.zendesk.com',                category: 'Business',       priority: 3 },
  { name: 'Intercom',                url: 'https://www.intercom.com',               category: 'Business',       priority: 3 },
  { name: 'Drift',                   url: 'https://www.drift.com',                  category: 'Business',       priority: 3 },
  { name: 'Olark',                   url: 'https://www.olark.com',                  category: 'Business',       priority: 3 },
  { name: 'LiveChat',                url: 'https://www.livechat.com',               category: 'Business',       priority: 3 },
  { name: 'Gorgias',                 url: 'https://www.gorgias.com',                category: 'Business',       priority: 3 },
]

// ─── initializeCitationPackages ───────────────────────────────────────────
// Initialize default citation packages if they don't exist.
// Called on admin page load to ensure starter/pro/premium packages are set up.

exports.initializeCitationPackages = onCall(
  { timeoutSeconds: 30 },
  async (request) => {
    const callerUid = request.auth?.uid
    if (!callerUid) throw new HttpsError('unauthenticated', 'Must be signed in.')

    const callerSnap = await db.collection('users').doc(callerUid).get()
    const callerRole = callerSnap.data()?.role
    if (callerRole !== 'admin' && callerRole !== 'staff') {
      throw new HttpsError('permission-denied', 'Admin or staff role required.')
    }

    // Get first 100, 200, 300 directories from MASTER_DIRECTORIES
    const dirNames100 = MASTER_DIRECTORIES.slice(0, 100).map(d => d.name)
    const dirNames200 = MASTER_DIRECTORIES.slice(0, 200).map(d => d.name)
    const dirNames300 = MASTER_DIRECTORIES.slice(0, 300).map(d => d.name)

    // Initialize default packages if they don't exist
    const packages = {
      starter: {
        id: 'starter',
        name: 'Starter Foundation',
        directoryNames: dirNames100,
        count: 100,
        createdAt: FieldValue.serverTimestamp(),
      },
      pro: {
        id: 'pro',
        name: 'Builder Pro',
        directoryNames: dirNames200,
        count: 200,
        createdAt: FieldValue.serverTimestamp(),
      },
      premium: {
        id: 'premium',
        name: 'Local Dominator Premium',
        directoryNames: dirNames300,
        count: 300,
        createdAt: FieldValue.serverTimestamp(),
      },
    }

    // Set each package (merge to preserve custom edits)
    const batch = db.batch()
    for (const [pkgId, pkgData] of Object.entries(packages)) {
      const ref = db.collection('citation_packages').doc(pkgId)
      batch.set(ref, pkgData, { merge: true })
    }
    await batch.commit()

    return { message: 'Citation packages initialized', packages: Object.keys(packages) }
  }
)

exports.startCitationsJob = onCall(
  { timeoutSeconds: 60, memory: '256MiB' },
  async (request) => {
    const userId = request.auth?.uid
    if (!userId) throw new HttpsError('unauthenticated', 'Must be signed in.')

    // Get user profile to verify purchase and collect business data
    const userSnap = await db.collection('users').doc(userId).get()
    if (!userSnap.exists) throw new HttpsError('not-found', 'User profile not found.')
    const user = userSnap.data()

    const packageId = user.purchases?.citationsPackageId
    if (!packageId) {
      throw new HttpsError('permission-denied', 'No citations package found on this account.')
    }

    // Resolve tier — citationsPackageId could be 'starter', 'pro', 'premium', or a custom package ID
    const tierKey = packageId.replace('citations_', '') // 'citations_starter' → 'starter'

    // Look up the package the admin configured in CitationsDirectoriesManager.
    // The admin panel saves packages keyed by the OFFER ID (e.g. 'citations_starter'),
    // while tierKey is derived from citationsPackageId (e.g. 'starter').
    // We try several lookups to find the right one.
    let packageDir = null
    try {
      // 1. Try exact packageId match (e.g. 'citations_starter')
      const snap1 = await db.collection('citation_packages').doc(packageId).get()
      if (snap1.exists && snap1.data().directoryNames?.length > 0) {
        packageDir = snap1.data()
        console.log(`[CITATIONS] Found package by packageId: ${packageId} (${packageDir.directoryNames.length} dirs)`)
      }

      // 2. Try tierKey match (e.g. 'starter')
      if (!packageDir) {
        const snap2 = await db.collection('citation_packages').doc(tierKey).get()
        if (snap2.exists && snap2.data().directoryNames?.length > 0) {
          packageDir = snap2.data()
          console.log(`[CITATIONS] Found package by tierKey: ${tierKey} (${packageDir.directoryNames.length} dirs)`)
        }
      }

      // 3. Query by tier field
      if (!packageDir) {
        const query = await db.collection('citation_packages')
          .where('tier', '==', tierKey)
          .limit(1).get()
        if (!query.empty && query.docs[0].data().directoryNames?.length > 0) {
          packageDir = query.docs[0].data()
          console.log(`[CITATIONS] Found package by tier field: ${tierKey} (${packageDir.directoryNames.length} dirs)`)
        }
      }
    } catch (err) {
      console.warn(`[CITATIONS] Error looking up package: ${err.message}`)
    }

    // Fallback to MASTER_DIRECTORIES slicing if no admin-configured package found
    if (!packageDir) {
      const targetCount = TIER_COUNTS[tierKey] || 100
      const allDirs = MASTER_DIRECTORIES.slice(0, targetCount)
      packageDir = {
        id: tierKey,
        directoryNames: allDirs.map(d => d.name),
        count: targetCount,
      }
      console.log(`[CITATIONS] Using MASTER_DIRECTORIES fallback: ${targetCount} dirs`)
    }

    // Block duplicate active jobs
    const activeSnap = await db.collection('citations')
      .where('userId', '==', userId)
      .where('status', 'in', ['queued', 'running'])
      .limit(1)
      .get()
    if (!activeSnap.empty) {
      throw new HttpsError('already-exists', 'A submission job is already running. Wait for it to complete.')
    }

    // Smart deduplication: filter out already-submitted + user-excluded directories
    const submittedDirs = user.submittedDirectories || []
    const exclusions = user.citationExclusions || []
    const allDirs = MASTER_DIRECTORIES.filter(d => packageDir.directoryNames.includes(d.name))
    const newDirs = allDirs.filter(d => !submittedDirs.includes(d.name) && !exclusions.includes(d.name))

    if (newDirs.length === 0) {
      throw new HttpsError('already-exists', `All directories in your ${tierKey} package have already been submitted or excluded. Upgrade your plan to submit to more directories.`)
    }

    // Business info for the submission engine (Phase 1/2/3)
    const businessData = {
      // Phase 1 - Essential
      businessName:     user.businessName      || '',
      address:          user.address           || '',
      city:             user.city              || '',
      state:            user.state             || '',
      zip:              user.zip               || '',
      phone:            user.phone             || '',
      website:          user.website           || '',
      email:            user.email             || '',
      niche:            user.niche             || '',
      businessHours:    user.businessHours     || '',
      description:      user.description       || '',

      // Phase 2 - Full Submission
      shortDesc:        user.shortDesc         || '',
      longDesc:         user.longDesc          || '',
      publicEmail:      user.publicEmail       || '',
      facebook:         user.facebook          || '',
      instagram:        user.instagram         || '',
      linkedin:         user.linkedin          || '',
      twitter:          user.twitter           || '',
      youtube:          user.youtube           || '',
      tiktok:           user.tiktok            || '',

      // Phase 3 - Optimization
      serviceAreas:     user.serviceAreas      || '',
      yearEstablished:  user.yearEstablished   || '',
      licenseNumber:    user.licenseNumber     || '',
      licenseState:     user.licenseState      || '',
      certifications:   user.certifications    || '',
      paymentMethods:   user.paymentMethods    || [],

      // Account credentials used for all directory registrations
      // Email: reboostai+{sanitizedBusinessName}@gmail.com
      // Password: stored here so admin can log into any listing
      listingEmail:     `reboostai+${(user.businessName || 'business').toLowerCase().replace(/[^a-z0-9]/g, '')}@gmail.com`,
      listingPassword:  user.listingPassword   || 'ReBoost2024!',
    }

    // Use filtered directories (already-submitted + excluded removed)
    const directories = newDirs

    // Calculate email routing breakdown for pre-submission email
    // In cloud-run/src/handlers.js, each handler has metadata with requiresRealEmail flag
    // For now, we use priority: priority 1 = requires real email, priority 2+ = system email
    const topTierSites = directories
      .filter(d => d.priority === 1)
      .map(d => d.name)
    const systemEmailSites = directories
      .filter(d => d.priority >= 2)
      .map(d => d.name)

    // Create the batch document
    const batchRef = db.collection('citations').doc()
    await batchRef.set({
      userId,
      packageId,
      packageTier: tierKey,
      targetCount,
      total: directories.length,
      topTierCount: topTierSites.length,
      systemEmailCount: systemEmailSites.length,
      status: 'queued',
      submitted: 0,
      live: 0,
      pending: directories.length,
      failed: 0,
      businessData,
      createdAt: FieldValue.serverTimestamp(),
      startedAt: null,
      completedAt: null,
      errorMessage: null,
    })

    // Batch-write directory sub-documents (Firestore max 500 per batch)
    const CHUNK = 490
    for (let i = 0; i < directories.length; i += CHUNK) {
      const chunk = directories.slice(i, i + CHUNK)
      const batch = db.batch()
      chunk.forEach(dir => {
        const dirRef = batchRef.collection('directories').doc()
        batch.set(dirRef, {
          ...dir,
          status: 'pending',
          submittedAt: null,
          liveAt: null,
          errorMessage: null,
        })
      })
      await batch.commit()
    }

    // Send pre-submission email (non-blocking)
    sendCitationsPreSubmissionEmail({
      userId,
      email: user.email,
      businessName: user.businessName,
      totalDirectories: directories.length,
      topTierSites,
      systemEmailSites,
    }).catch(err => console.warn('Pre-submission email error:', err))

    // Trigger Cloud Run submission engine
    await triggerCitationsSubmission()

    return { batchId: batchRef.id, total: directories.length, tier: tierKey }
  }
)

// ─── adminCreateUser ─────────────────────────────────────────────────────────
// Admin/staff: create a new Firebase Auth user + Firestore profile in one call.

exports.adminCreateUser = onCall({ timeoutSeconds: 30 }, async (request) => {
  const callerUid = request.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const callerSnap = await db.collection('users').doc(callerUid).get()
  const callerRole = callerSnap.data()?.role
  if (callerRole !== 'admin' && callerRole !== 'staff') {
    throw new HttpsError('permission-denied', 'Admin or staff role required.')
  }

  const { email, displayName = '', role = 'client', niche = '', businessName = '', sendInvite = true } = request.data
  if (!email) throw new HttpsError('invalid-argument', 'email is required.')

  const allowed = ['client', 'staff', 'admin']
  if (!allowed.includes(role)) throw new HttpsError('invalid-argument', 'Invalid role.')
  if ((role === 'admin' || role === 'staff') && callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can create staff or admin accounts.')
  }

  const auth = getAuth()

  // Generate a random temporary password — user will reset via invite link
  const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4).toUpperCase()
  const user = await auth.createUser({ email, password: tempPassword, displayName })

  await db.collection('users').doc(user.uid).set({
    email,
    displayName,
    role,
    businessName,
    niche,
    phone: '', website: '', address: '',
    city: '', state: '', zip: '', tagline: '', currentOffer: '',
    logoUrl: null,
    subscriptions: {
      scheduler:     { active: false, tier: null, stripeSubId: null },
      reviewManager: { active: false, stripeSubId: null },
      rankTracker:   { active: false, stripeSubId: null },
    },
    purchases: {
      citationsPackageId: null,
      calendarNiches: [],
      leadCredits: 0,
      outreachTemplates: false,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Send invite email with password setup link
  let inviteLink = null
  if (sendInvite) {
    try {
      inviteLink = await auth.generatePasswordResetLink(email, {
        url: `${process.env.APP_URL || 'https://reboost-hub.vercel.app'}/login`,
      })

      const RESEND_KEY = process.env.RESEND_API_KEY || ''
      const SENDGRID_KEY = process.env.SENDGRID_API_KEY || ''

      if (RESEND_KEY) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: 'ReBoost Marketing HUB <noreply@reboosthub.com>',
            to: email,
            subject: `You've been invited to ReBoost Marketing HUB`,
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <h2>Welcome${displayName ? `, ${displayName}` : ''}!</h2>
  <p>Your ReBoost Marketing HUB account has been created. Click the button below to set your password and access your dashboard.</p>
  <p style="margin:28px 0;text-align:center;">
    <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Set Your Password & Log In</a>
  </p>
  <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't expect this email, you can ignore it.</p>
</div>`,
          }),
        })
      } else if (SENDGRID_KEY) {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${SENDGRID_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personalizations: [{ to: [{ email }] }],
            from: { email: 'noreply@reboosthub.com', name: 'ReBoost Marketing HUB' },
            subject: `You've been invited to ReBoost Marketing HUB`,
            content: [{
              type: 'text/html',
              value: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <h2>Welcome${displayName ? `, ${displayName}` : ''}!</h2>
  <p>Your ReBoost Marketing HUB account has been created. Click the button below to set your password and access your dashboard.</p>
  <p style="margin:28px 0;text-align:center;">
    <a href="${inviteLink}" style="display:inline-block;background:#2563eb;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Set Your Password & Log In</a>
  </p>
  <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't expect this email, you can ignore it.</p>
</div>`,
            }],
          }),
        })
      }
    } catch (inviteErr) {
      console.error('Invite email failed (account still created):', inviteErr.message)
    }
  }

  return { uid: user.uid, inviteLink }
})

// ─── adminDeleteUser ─────────────────────────────────────────────────────────
// Admin only: permanently delete a Firebase Auth user + their Firestore doc.

exports.adminDeleteUser = onCall({ timeoutSeconds: 30 }, async (request) => {
  const callerUid = request.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const callerSnap = await db.collection('users').doc(callerUid).get()
  if (callerSnap.data()?.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin role required.')
  }

  const { targetUid } = request.data
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid is required.')
  if (targetUid === callerUid) throw new HttpsError('invalid-argument', 'Cannot delete your own account.')

  const auth = getAuth()
  await auth.revokeRefreshTokens(targetUid)
  await auth.deleteUser(targetUid)
  await db.collection('users').doc(targetUid).delete()

  return { deleted: true }
})

// ─── adminUpdateAccess ───────────────────────────────────────────────────────
// Admin/staff: update any user's tool access (purchases + subscriptions).

exports.adminUpdateAccess = onCall({ timeoutSeconds: 30 }, async (request) => {
  const callerUid = request.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const callerSnap = await db.collection('users').doc(callerUid).get()
  const callerRole = callerSnap.data()?.role
  if (callerRole !== 'admin' && callerRole !== 'staff') {
    throw new HttpsError('permission-denied', 'Admin or staff role required.')
  }

  const { targetUid, purchases, subscriptions } = request.data
  if (!targetUid) throw new HttpsError('invalid-argument', 'targetUid is required.')

  const updates = { updatedAt: FieldValue.serverTimestamp() }

  if (purchases) {
    if (purchases.citationsPackageId !== undefined) updates['purchases.citationsPackageId'] = purchases.citationsPackageId
    if (purchases.leadCredits       !== undefined) updates['purchases.leadCredits']       = Number(purchases.leadCredits)
    if (purchases.outreachTemplates !== undefined) updates['purchases.outreachTemplates'] = purchases.outreachTemplates
    if (purchases.calendarNiches    !== undefined) updates['purchases.calendarNiches']    = purchases.calendarNiches
  }
  if (subscriptions) {
    const s = subscriptions
    if (s.scheduler?.active    !== undefined) updates['subscriptions.scheduler.active']       = s.scheduler.active
    if (s.scheduler?.tier      !== undefined) updates['subscriptions.scheduler.tier']         = s.scheduler.tier
    if (s.reviewManager?.active !== undefined) updates['subscriptions.reviewManager.active']  = s.reviewManager.active
    if (s.rankTracker?.active  !== undefined) updates['subscriptions.rankTracker.active']     = s.rankTracker.active
  }

  await db.collection('users').doc(targetUid).update(updates)
  return { success: true }
})

// ─── claimAdminRole ──────────────────────────────────────────────────────────
// One-time function: first caller becomes admin. Uses settings/adminClaimed as a lock.

exports.claimAdminRole = onCall({ timeoutSeconds: 30 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const claimedSnap = await db.collection('settings').doc('adminClaimed').get()
  if (claimedSnap.exists) {
    throw new HttpsError('already-exists', 'Admin has already been claimed. Contact your administrator.')
  }

  // Use set+merge so it works even if the users doc doesn't exist yet
  await db.collection('users').doc(uid).set({ role: 'admin' }, { merge: true })
  await db.collection('settings').doc('adminClaimed').set({
    uid,
    claimedAt: FieldValue.serverTimestamp(),
  })

  return { success: true }
})

// ─── setUserRole ─────────────────────────────────────────────────────────────
// Admin/staff only: update another user's role.

exports.setUserRole = onCall({ timeoutSeconds: 30 }, async (request) => {
  const callerUid = request.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const callerSnap = await db.collection('users').doc(callerUid).get()
  const callerRole = callerSnap.data()?.role
  if (callerRole !== 'admin' && callerRole !== 'staff') {
    throw new HttpsError('permission-denied', 'Admin or staff role required.')
  }

  const { targetUid, role } = request.data
  if (!targetUid || !role) throw new HttpsError('invalid-argument', 'targetUid and role are required.')

  const allowed = ['client', 'staff', 'admin']
  if (!allowed.includes(role)) {
    throw new HttpsError('invalid-argument', `Role must be one of: ${allowed.join(', ')}`)
  }

  // Prevent non-admins from elevating to admin
  if (role === 'admin' && callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can assign the admin role.')
  }

  await db.collection('users').doc(targetUid).update({ role })
  return { success: true }
})

// ─── resetUserPassword ───────────────────────────────────────────────────────
// Admin/staff only: generate a password reset link for a user.

exports.resetUserPassword = onCall({ timeoutSeconds: 30 }, async (request) => {
  const callerUid = request.auth?.uid
  if (!callerUid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const callerSnap = await db.collection('users').doc(callerUid).get()
  const callerRole = callerSnap.data()?.role
  if (callerRole !== 'admin' && callerRole !== 'staff') {
    throw new HttpsError('permission-denied', 'Admin or staff role required.')
  }

  const { email } = request.data
  if (!email) throw new HttpsError('invalid-argument', 'email is required.')

  const auth = getAuth()
  const link = await auth.generatePasswordResetLink(email)
  return { link }
})

// ─── connectZernioAccount ────────────────────────────────────────────────────
// Stores a platform connection (Zernio account ID) for the current user.
// The actual posting is done via Zernio's API using ZERNIO_API_KEY env var.

exports.connectZernioAccount = onCall({ timeoutSeconds: 30 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const { platform, accountName, zernioAccountId } = request.data
  const VALID_PLATFORMS = ['facebook', 'instagram', 'linkedin', 'gmb']
  if (!platform || !VALID_PLATFORMS.includes(platform)) {
    throw new HttpsError('invalid-argument', `platform must be one of: ${VALID_PLATFORMS.join(', ')}`)
  }
  if (!accountName?.trim() || !zernioAccountId?.trim()) {
    throw new HttpsError('invalid-argument', 'accountName and zernioAccountId are required.')
  }

  await db.collection('users').doc(uid).set({
    connectedAccounts: {
      [platform]: {
        connected: true,
        accountName: accountName.trim(),
        zernioAccountId: zernioAccountId.trim(),
        connectedAt: FieldValue.serverTimestamp(),
      },
    },
  }, { merge: true })

  return { success: true }
})

// ─── schedulePost ─────────────────────────────────────────────────────────────
// Schedule a post across one or more platforms via the Zernio API.
// Required env var: ZERNIO_API_KEY
// Firestore: scheduledPosts/{postId}

exports.schedulePost = onCall({ timeoutSeconds: 30 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  // Verify scheduler access
  const userSnap = await db.collection('users').doc(uid).get()
  const userData = userSnap.data() || {}
  const role = userData.role
  const hasScheduler =
    role === 'admin' ||
    role === 'staff' ||
    userData.subscriptions?.scheduler?.active === true

  if (!hasScheduler) {
    throw new HttpsError('permission-denied', 'Content Scheduler subscription required.')
  }

  const { platforms, caption, imageUrl, scheduledAt } = request.data
  if (!Array.isArray(platforms) || platforms.length === 0) {
    throw new HttpsError('invalid-argument', 'platforms array is required.')
  }
  if (!caption?.trim()) {
    throw new HttpsError('invalid-argument', 'caption is required.')
  }
  if (!scheduledAt) {
    throw new HttpsError('invalid-argument', 'scheduledAt is required.')
  }
  if (new Date(scheduledAt) <= new Date()) {
    throw new HttpsError('invalid-argument', 'scheduledAt must be in the future.')
  }

  const ZERNIO_KEY = process.env.ZERNIO_API_KEY || ''
  const connectedAccounts = userData.connectedAccounts || {}
  const zernioPostIds = {}

  // Call Zernio API for each selected, connected platform
  for (const platform of platforms) {
    const acct = connectedAccounts[platform]
    if (!acct?.connected || !acct?.zernioAccountId) continue

    if (ZERNIO_KEY) {
      try {
        const body = {
          account_id: acct.zernioAccountId,
          platform,
          content: caption,
          scheduled_time: scheduledAt,
        }
        if (imageUrl) body.media_url = imageUrl

        const res = await fetch('https://api.zernio.com/v1/posts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ZERNIO_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(15000),
        })

        if (res.ok) {
          const data = await res.json()
          zernioPostIds[platform] = data.id || data.post_id || null
        } else {
          console.error(`Zernio ${platform} failed: ${res.status} ${await res.text()}`)
        }
      } catch (err) {
        console.error(`Zernio post error for ${platform}:`, err.message)
      }
    }
  }

  const postRef = db.collection('scheduledPosts').doc()
  await postRef.set({
    userId: uid,
    platforms,
    caption: caption.trim(),
    imageUrl: imageUrl || null,
    scheduledAt: new Date(scheduledAt),
    status: 'scheduled',
    zernioPostIds,
    createdAt: FieldValue.serverTimestamp(),
  })

  return { postId: postRef.id }
})

// ─── cancelPost ──────────────────────────────────────────────────────────────
// Cancel a scheduled post — marks it cancelled in Firestore and calls Zernio.

exports.cancelPost = onCall({ timeoutSeconds: 30 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const { postId } = request.data
  if (!postId) throw new HttpsError('invalid-argument', 'postId is required.')

  const postSnap = await db.collection('scheduledPosts').doc(postId).get()
  if (!postSnap.exists) throw new HttpsError('not-found', 'Post not found.')

  const post = postSnap.data()
  if (post.userId !== uid) {
    const callerSnap = await db.collection('users').doc(uid).get()
    const callerRole = callerSnap.data()?.role
    if (callerRole !== 'admin' && callerRole !== 'staff') {
      throw new HttpsError('permission-denied', "Cannot cancel another user's post.")
    }
  }

  const ZERNIO_KEY = process.env.ZERNIO_API_KEY || ''
  if (ZERNIO_KEY && post.zernioPostIds) {
    for (const zernioId of Object.values(post.zernioPostIds)) {
      if (!zernioId) continue
      try {
        await fetch(`https://api.zernio.com/v1/posts/${zernioId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${ZERNIO_KEY}` },
          signal: AbortSignal.timeout(10000),
        })
      } catch (err) {
        console.error('Zernio cancel error:', err.message)
      }
    }
  }

  await db.collection('scheduledPosts').doc(postId).update({ status: 'cancelled' })
  return { success: true }
})

// ─── searchLeads ─────────────────────────────────────────────────────────────
// Search for leads via Google Maps Places API with key rotation.
// Supports single-city or state-wide bulk searching.
// State-wide: loops through major cities (5-7 per state) → 100-300+ leads per search.
// Requires settings/googleMapsKeys Firestore doc with keys array.
// Deducts credits based on search scope (city = 1 credit, state = 10 credits).

exports.searchLeads = onCall(
  { timeoutSeconds: 300, memory: '1GiB' },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

    const { niche, city, state, radius = 25 } = request.data
    if (!niche || (!city && !state)) {
      throw new HttpsError('invalid-argument', 'niche and (city or state) are required.')
    }

    // Check credits (admin/staff bypass)
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data()
    const isAdmin = userData?.role === 'admin' || userData?.role === 'staff'
    const leadCredits = userData?.purchases?.leadCredits || 0

    // Determine search scope and credit cost
    const isStateWide = !!state
    const creditsCost = isStateWide ? 10 : 1

    if (!isAdmin && leadCredits < creditsCost) {
      throw new HttpsError('failed-precondition', `Insufficient credits. Need ${creditsCost}, have ${leadCredits}.`)
    }

    // Load key pool
    const keysRef = db.collection('settings').doc('googleMapsKeys')
    const keysSnap = await keysRef.get()

    if (!keysSnap.exists) {
      throw new HttpsError('failed-precondition', 'Google Maps API not configured. Contact support.')
    }

    let keysData = keysSnap.data()
    const currentMonth = new Date().getMonth()
    let keys = keysData.keys || []

    // Monthly usage reset
    if (keysData.lastResetMonth !== currentMonth) {
      keys = keys.map(k => ({ ...k, usageThisMonth: 0 }))
      await keysRef.update({ keys, lastResetMonth: currentMonth })
    }

    // Pick active key with lowest usage under limit
    const available = keys.filter(k => k.active && k.usageThisMonth < (k.limit || 1800))
    if (available.length === 0) {
      throw new HttpsError('resource-exhausted', 'Monthly API limit reached. Try again next month or add more keys.')
    }
    const bestKey = available.reduce((min, k) => k.usageThisMonth < min.usageThisMonth ? k : min)
    const apiKey = bestKey.key

    // Determine cities to search
    const stateCities = {
      AL: ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
      AK: ['Anchorage', 'Juneau', 'Fairbanks'],
      AZ: ['Phoenix', 'Mesa', 'Scottsdale', 'Chandler', 'Tempe'],
      AR: ['Little Rock', 'Fayetteville', 'Springdale', 'Jonesboro'],
      CA: ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno', 'Long Beach'],
      CO: ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
      CT: ['Hartford', 'New Haven', 'Bridgeport', 'Waterbury'],
      DE: ['Wilmington', 'Dover', 'Newark'],
      FL: ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg', 'Fort Lauderdale'],
      GA: ['Atlanta', 'Savannah', 'Augusta', 'Columbus', 'Athens'],
      HI: ['Honolulu', 'Hilo'],
      ID: ['Boise', 'Meridian', 'Pocatello', 'Idaho Falls'],
      IL: ['Chicago', 'Aurora', 'Rockford', 'Joliet', 'Peoria', 'Springfield'],
      IN: ['Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend'],
      IA: ['Des Moines', 'Cedar Rapids', 'Davenport', 'Sioux City'],
      KS: ['Kansas City', 'Wichita', 'Topeka', 'Overland Park'],
      KY: ['Louisville', 'Lexington', 'Bowling Green', 'Owensboro'],
      LA: ['New Orleans', 'Baton Rouge', 'Shreveport', 'Lafayette'],
      ME: ['Portland', 'Lewiston', 'Bangor'],
      MD: ['Baltimore', 'Frederick', 'Gaithersburg', 'Bowie'],
      MA: ['Boston', 'Worcester', 'Springfield', 'Cambridge'],
      MI: ['Detroit', 'Grand Rapids', 'Warren', 'Sterling Heights', 'Ann Arbor'],
      MN: ['Minneapolis', 'St. Paul', 'Rochester', 'Duluth', 'St. Cloud'],
      MS: ['Jackson', 'Gulfport', 'Biloxi', 'Southaven'],
      MO: ['Kansas City', 'St. Louis', 'Springfield', 'Independence'],
      MT: ['Billings', 'Missoula', 'Great Falls'],
      NE: ['Omaha', 'Lincoln', 'Bellevue', 'Grand Island'],
      NV: ['Las Vegas', 'Henderson', 'Reno', 'North Las Vegas'],
      NH: ['Manchester', 'Nashua', 'Concord'],
      NJ: ['Newark', 'Jersey City', 'Paterson', 'Elizabeth', 'Trenton'],
      NM: ['Albuquerque', 'Las Cruces', 'Santa Fe'],
      NY: ['New York', 'Buffalo', 'Rochester', 'Yonkers', 'Syracuse'],
      NC: ['Charlotte', 'Raleigh', 'Greensboro', 'Winston-Salem', 'Durham'],
      ND: ['Bismarck', 'Fargo', 'Grand Forks'],
      OH: ['Columbus', 'Cleveland', 'Cincinnati', 'Toledo', 'Akron', 'Dayton'],
      OK: ['Oklahoma City', 'Tulsa', 'Norman', 'Broken Arrow'],
      OR: ['Portland', 'Eugene', 'Salem', 'Gresham'],
      PA: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
      RI: ['Providence', 'Warwick', 'Cranston'],
      SC: ['Charleston', 'Columbia', 'Greenville', 'Summerville'],
      SD: ['Sioux Falls', 'Rapid City', 'Pierre'],
      TN: ['Memphis', 'Nashville', 'Knoxville', 'Chattanooga', 'Clarksville'],
      TX: ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington'],
      UT: ['Salt Lake City', 'Provo', 'Orem', 'Ogden', 'West Valley City'],
      VT: ['Burlington', 'Rutland'],
      VA: ['Virginia Beach', 'Richmond', 'Arlington', 'Alexandria', 'Roanoke'],
      WA: ['Seattle', 'Spokane', 'Tacoma', 'Vancouver', 'Bellevue'],
      WV: ['Charleston', 'Huntington', 'Parkersburg'],
      WI: ['Milwaukee', 'Madison', 'Green Bay', 'Kenosha'],
      WY: ['Cheyenne', 'Casper', 'Laramie'],
    }

    const citiesToSearch = isStateWide
      ? (stateCities[state.toUpperCase()] || [])
      : [city]

    if (citiesToSearch.length === 0) {
      throw new HttpsError('invalid-argument', `No cities found for state ${state}`)
    }

    // Load user's existing saved placeIds to skip duplicates across searches
    const existingBatchesSnap = await db.collection('leads')
      .where('userId', '==', uid)
      .limit(50)
      .get()
    const existingPlaceIds = new Set()
    await Promise.all(existingBatchesSnap.docs.map(async batchDoc => {
      const itemsSnap = await batchDoc.ref.collection('items').select('placeId').get()
      itemsSnap.docs.forEach(d => { if (d.data().placeId) existingPlaceIds.add(d.data().placeId) })
    }))

    // Search all cities and deduplicate by placeId. Uses next_page_token to get up to 3 pages (~60 results) per city.
    const allPlaces = {}
    let totalCalls = 0
    const radiusMeters = Math.round(radius * 1609)

    for (const searchCity of citiesToSearch) {
      const searchQuery = `${niche} in ${searchCity}`
      let pageToken = null
      let cityPages = 0

      do {
        const url = pageToken
          ? `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${pageToken}&key=${apiKey}`
          : `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&radius=${radiusMeters}&key=${apiKey}`

        // Google requires a short delay before using a next_page_token
        if (pageToken) await new Promise(r => setTimeout(r, 2000))

        const resp = await fetch(url)
        const data = await resp.json()
        totalCalls++
        cityPages++

        if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
          ;(data.results || []).forEach(place => {
            if (!allPlaces[place.place_id]) {
              allPlaces[place.place_id] = place
            }
          })
          pageToken = data.next_page_token || null
        } else {
          pageToken = null
        }
      } while (pageToken && cityPages < 3) // max 3 pages = ~60 results per city
    }

    const places = Object.values(allPlaces)
      .filter(p => !existingPlaceIds.has(p.place_id)) // skip already-saved leads
      .slice(0, 300) // cap at 300

    // Enrich each place with phone + website via Place Details
    const enriched = await Promise.all(
      places.map(async (place) => {
        try {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&key=${apiKey}`
          const detailResp = await fetch(detailUrl)
          const detailData = await detailResp.json()
          const d = detailData.result || {}
          totalCalls++
          return {
            businessName: d.name || place.name || '',
            address: d.formatted_address || place.formatted_address || '',
            phone: d.formatted_phone_number || '',
            website: d.website || '',
            email: '',
            rating: d.rating ?? place.rating ?? null,
            reviewCount: d.user_ratings_total ?? place.user_ratings_total ?? 0,
            placeId: place.place_id,
          }
        } catch {
          return {
            businessName: place.name || '',
            address: place.formatted_address || '',
            phone: '', website: '', email: '',
            rating: place.rating ?? null,
            reviewCount: place.user_ratings_total ?? 0,
            placeId: place.place_id,
          }
        }
      })
    )

    // Save batch + items
    const batchRef = db.collection('leads').doc()
    const searchScope = isStateWide ? `${state} (${citiesToSearch.length} cities)` : city
    await batchRef.set({
      userId: uid,
      niche,
      searchScope,
      city: isStateWide ? null : city,
      state: isStateWide ? state : null,
      searchQuery: isStateWide ? `${niche} across ${state}` : `${niche} in ${city}`,
      totalFound: enriched.length,
      exported: false,
      createdAt: FieldValue.serverTimestamp(),
    })

    const writeBatch = db.batch()
    enriched.forEach(item => {
      writeBatch.set(batchRef.collection('items').doc(), item)
    })
    await writeBatch.commit()

    // Deduct credits (non-admin)
    if (!isAdmin) {
      await db.collection('users').doc(uid).update({
        'purchases.leadCredits': FieldValue.increment(-creditsCost),
      })
    }

    // Increment key usage
    const updatedKeys = keys.map(k =>
      k.key === apiKey ? { ...k, usageThisMonth: (k.usageThisMonth || 0) + totalCalls } : k
    )
    await keysRef.update({ keys: updatedKeys })

    return { batchId: batchRef.id, results: enriched, totalFound: enriched.length, citiesSearched: citiesToSearch.length }
  }
)

// ─── generateOutreachSequence ─────────────────────────────────────────────────
// Generates a 3-email cold outreach sequence via Anthropic API.
// Requires ANTHROPIC_API_KEY env var + user must have purchases.outreachTemplates = true.

exports.generateOutreachSequence = onCall(
  { timeoutSeconds: 120, memory: '256MiB' },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data()
    const isAdmin = userData?.role === 'admin' || userData?.role === 'staff'
    const hasTemplates = isAdmin || userData?.purchases?.outreachTemplates === true

    if (!hasTemplates) {
      throw new HttpsError('permission-denied', 'Outreach Templates purchase required.')
    }

    const { niche, city, batchId } = request.data
    if (!niche || !city) throw new HttpsError('invalid-argument', 'niche and city are required.')

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
    if (!ANTHROPIC_KEY) {
      throw new HttpsError('failed-precondition', 'AI service not configured. Contact support.')
    }

    const prompt = `You are an expert cold email copywriter for a local marketing agency.

Generate a 3-email cold outreach sequence targeting ${niche} businesses in ${city}.
The sender is a digital marketing agency (ReBoost Marketing) offering lead generation, SEO, and local visibility services.

Return ONLY valid JSON, no markdown, no explanation — just the raw JSON object:
{
  "emails": [
    { "number": 1, "subject": "...", "body": "..." },
    { "number": 2, "subject": "...", "body": "..." },
    { "number": 3, "subject": "...", "body": "..." }
  ]
}

Rules:
- Email 1: Intro + curiosity hook. No pitch yet. 4-5 sentences.
- Email 2: Follow-up (sent 3-4 days later). One concrete result/stat. Soft CTA.
- Email 3: "Last email" breakup format. Brief value mention. Low-pressure CTA.
- Max 150 words per body.
- No "I hope this email finds you well" or similar filler.
- Sound like a human, not a marketer.
- Use placeholders: {{firstName}}, {{businessName}}
- Sign off: {{senderName}} | ReBoost Marketing`

    const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!aiResp.ok) {
      throw new HttpsError('internal', 'AI service error. Please try again.')
    }

    const aiData = await aiResp.json()
    const raw = aiData.content?.[0]?.text || ''

    // Strip markdown fences if present, then parse JSON
    const cleaned = raw.replace(/```(?:json)?/g, '').replace(/```/g, '').trim()
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new HttpsError('internal', 'Failed to parse AI response. Please try again.')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Persist sequence on the batch doc if batchId provided
    if (batchId) {
      await db.collection('leads').doc(batchId).update({
        outreachSequence: parsed.emails,
        outreachGeneratedAt: FieldValue.serverTimestamp(),
      })
    }

    return { emails: parsed.emails }
  }
)

// ─── generateAIContent ───────────────────────────────────────────────────────
// Requires Scheduler Pro subscription.
// Required env var: ANTHROPIC_API_KEY

exports.generateAIContent = onCall({ timeoutSeconds: 60 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const userSnap = await db.collection('users').doc(uid).get()
  const userData = userSnap.data() || {}
  const role = userData.role
  const hasAICreator =
    role === 'admin' ||
    role === 'staff' ||
    (userData.subscriptions?.scheduler?.active === true &&
      userData.subscriptions?.scheduler?.tier === 'pro')

  if (!hasAICreator) {
    throw new HttpsError('permission-denied', 'AI Creator requires Scheduler Pro subscription.')
  }

  const { platform, tone, prompt, businessName, niche } = request.data
  if (!prompt?.trim() || !platform || !tone) {
    throw new HttpsError('invalid-argument', 'prompt, platform, and tone are required.')
  }

  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || ''
  if (!ANTHROPIC_KEY) {
    throw new HttpsError('failed-precondition', 'AI API not configured. Set ANTHROPIC_API_KEY in Function env vars.')
  }

  const LIMITS = { facebook: 500, instagram: 2200, linkedin: 3000, gmb: 1500 }
  const charLimit = LIMITS[platform] || 500

  const TONE_MAP = {
    professional: 'professional and polished',
    friendly:     'friendly and casual',
    urgent:       'urgent and promotional with a strong call to action',
    educational:  'educational and informative',
  }

  const systemPrompt = [
    `You are an expert social media copywriter for local service businesses.`,
    `Generate a single ${platform} post caption that is ${TONE_MAP[tone] || tone}.`,
    businessName ? `Business name: ${businessName}` : '',
    niche ? `Industry: ${niche}` : '',
    `Keep the caption under ${charLimit} characters.`,
    `Return ONLY the caption text — no quotes, no preamble, no explanations.`,
  ].filter(Boolean).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt.trim() }],
    }),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    console.error('Anthropic error:', res.status, await res.text())
    throw new HttpsError('internal', 'AI generation failed. Check ANTHROPIC_API_KEY.')
  }

  const data = await res.json()
  const content = data.content?.[0]?.text?.trim() || ''
  return { content }
})

// ─── generateAIImage ─────────────────────────────────────────────────────────
// Requires Scheduler Pro subscription.
// Required env var: OPENAI_API_KEY
// Note: DALL-E 3 image URLs expire after ~60 minutes — download immediately.

exports.generateAIImage = onCall({ timeoutSeconds: 120, memory: '256MiB' }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const userSnap = await db.collection('users').doc(uid).get()
  const userData = userSnap.data() || {}
  const role = userData.role
  const hasAICreator =
    role === 'admin' ||
    role === 'staff' ||
    (userData.subscriptions?.scheduler?.active === true &&
      userData.subscriptions?.scheduler?.tier === 'pro')

  if (!hasAICreator) {
    throw new HttpsError('permission-denied', 'AI Creator requires Scheduler Pro subscription.')
  }

  const { prompt, style, size } = request.data
  if (!prompt?.trim()) throw new HttpsError('invalid-argument', 'prompt is required.')

  const OPENAI_KEY = process.env.OPENAI_API_KEY || ''
  if (!OPENAI_KEY) {
    throw new HttpsError('failed-precondition', 'Image API not configured. Set OPENAI_API_KEY in Function env vars.')
  }

  const SIZE_MAP = { square: '1024x1024', landscape: '1792x1024', portrait: '1024x1792' }
  const STYLE_PREFIX = {
    photorealistic: 'Professional photography, ultra-realistic, well-lit,',
    illustration:   'Clean digital illustration, modern flat design,',
    cartoon:        'Friendly cartoon style, vibrant colors,',
    minimalist:     'Minimalist design, simple shapes, clean white background,',
  }

  const enhancedPrompt = `${STYLE_PREFIX[style] || ''} ${prompt.trim()}. Business appropriate, high quality.`

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: SIZE_MAP[size] || '1024x1024',
      quality: 'standard',
    }),
    signal: AbortSignal.timeout(90000),
  })

  if (!res.ok) {
    console.error('OpenAI error:', res.status, await res.text())
    throw new HttpsError('internal', 'Image generation failed. Check OPENAI_API_KEY.')
  }

  const data = await res.json()
  const imageUrl = data.data?.[0]?.url || ''
  return { imageUrl }
})

// ─── fetchReviews ─────────────────────────────────────────────────────────────
// Fetches Google reviews via Places API and caches them in the user's Firestore doc.
// Required env var: GOOGLE_PLACES_KEY

exports.fetchReviews = onCall({ timeoutSeconds: 30 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const userSnap = await db.collection('users').doc(uid).get()
  const userData = userSnap.data() || {}
  const role = userData.role
  const hasReviewManager =
    role === 'admin' ||
    role === 'staff' ||
    userData.subscriptions?.reviewManager?.active === true

  if (!hasReviewManager) {
    throw new HttpsError('permission-denied', 'Review Manager subscription required.')
  }

  const { placeId } = request.data
  if (!placeId?.trim()) throw new HttpsError('invalid-argument', 'placeId is required.')

  const PLACES_KEY = process.env.GOOGLE_PLACES_KEY || ''
  if (!PLACES_KEY) {
    throw new HttpsError('failed-precondition', 'Google Places API not configured. Set GOOGLE_PLACES_KEY in Function env vars.')
  }

  const fields = 'name,rating,user_ratings_total,reviews,url'
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId.trim())}&fields=${fields}&key=${PLACES_KEY}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  const data = await res.json()

  if (data.status !== 'OK') {
    throw new HttpsError('not-found', `Google Places error: ${data.status} — ${data.error_message || 'Place not found.'}`)
  }

  const place = data.result || {}
  const reviews = (place.reviews || []).map(r => ({
    authorName:   r.author_name || '',
    authorPhoto:  r.profile_photo_url || null,
    rating:       r.rating || 0,
    text:         r.text || '',
    time:         r.time || 0,
    relativeTime: r.relative_time_description || '',
  }))

  const reviewProfile = {
    placeId: placeId.trim(),
    businessName:  place.name || '',
    rating:        place.rating || 0,
    reviewCount:   place.user_ratings_total || 0,
    reviewLink:    `https://search.google.com/local/writereview?placeid=${placeId.trim()}`,
    googleMapsUrl: place.url || '',
    reviews,
    lastFetchedAt: FieldValue.serverTimestamp(),
  }

  await db.collection('users').doc(uid).set({ reviewProfile }, { merge: true })

  return {
    businessName:  reviewProfile.businessName,
    rating:        reviewProfile.rating,
    reviewCount:   reviewProfile.reviewCount,
    reviewLink:    reviewProfile.reviewLink,
    reviews,
  }
})

// ─── sendReviewRequest ───────────────────────────────────────────────────────
// Sends review request emails to a list of customers via SendGrid.
// Required env var: SENDGRID_API_KEY
// Optional env var: SENDGRID_FROM_EMAIL (default: fromEmail param or noreply@reboosthub.com)

exports.sendReviewRequest = onCall({ timeoutSeconds: 60 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const userSnap = await db.collection('users').doc(uid).get()
  const userData = userSnap.data() || {}
  const role = userData.role
  const hasReviewManager =
    role === 'admin' ||
    role === 'staff' ||
    userData.subscriptions?.reviewManager?.active === true

  if (!hasReviewManager) {
    throw new HttpsError('permission-denied', 'Review Manager subscription required.')
  }

  const { customers, businessName, reviewLink, fromName, fromEmail } = request.data

  if (!Array.isArray(customers) || customers.length === 0) {
    throw new HttpsError('invalid-argument', 'customers array is required.')
  }
  if (!reviewLink) throw new HttpsError('invalid-argument', 'reviewLink is required.')
  if (customers.length > 100) {
    throw new HttpsError('invalid-argument', 'Maximum 100 customers per batch.')
  }

  // Require Gmail to be connected — emails send from the user's own Gmail
  if (!userData.gmailRefreshToken) {
    throw new HttpsError(
      'failed-precondition',
      'Connect your Gmail account in Settings → Integrations to send review requests.'
    )
  }

  // Refresh the access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: userData.gmailRefreshToken,
      client_id:     process.env.GMAIL_CLIENT_ID || '',
      client_secret: process.env.GMAIL_CLIENT_SECRET || '',
      grant_type:    'refresh_token',
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new HttpsError('internal', 'Gmail token refresh failed. Reconnect Gmail in Settings → Integrations.')
  }
  const accessToken = tokenData.access_token
  const senderEmail = userData.gmailEmail || ''
  const senderName  = fromName || businessName || ''

  let sentCount = 0
  const batch = db.batch()

  for (const customer of customers) {
    const { name, email } = customer
    if (!email?.includes('@')) continue

    const greeting = name ? `Hi ${name},` : 'Hi there,'
    const subject  = `How was your experience with ${businessName || 'us'}?`
    const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <p>${greeting}</p>
  <p>Thank you for choosing <strong>${businessName || 'us'}</strong>! We hope you had a great experience.</p>
  <p>If you have a moment, we'd love to hear what you think. Your feedback helps us improve and helps others find trusted local businesses.</p>
  <p style="margin:28px 0;text-align:center;">
    <a href="${reviewLink}" style="display:inline-block;background:#4285f4;color:white;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">⭐ Leave a Google Review</a>
  </p>
  <p style="color:#666;font-size:14px;">It only takes a minute and means the world to us. Thank you!</p>
  <p style="margin-top:24px;">— ${senderName || senderEmail}</p>
</div>`

    const fromHeader = senderName ? `${senderName} <${senderEmail}>` : senderEmail
    const toHeader   = name ? `${name} <${email}>` : email
    const mime = [
      `From: ${fromHeader}`,
      `To: ${toHeader}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody,
    ].join('\r\n')
    const raw = Buffer.from(mime).toString('base64url')

    let sent = false
    try {
      const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization:  `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw }),
        signal: AbortSignal.timeout(15000),
      })
      sent = gmailRes.ok
      if (!sent) {
        const err = await gmailRes.json()
        console.error('Gmail send error for', email, ':', JSON.stringify(err))
      }
    } catch (err) {
      console.error('Gmail fetch error for', email, ':', err.message)
    }

    if (sent) sentCount++

    const reqRef = db.collection('reviewRequests').doc()
    batch.set(reqRef, {
      userId:        uid,
      customerName:  name || '',
      customerEmail: email,
      businessName:  businessName || '',
      reviewLink,
      status:        sent ? 'sent' : 'failed',
      sentAt:        sent ? FieldValue.serverTimestamp() : null,
      createdAt:     FieldValue.serverTimestamp(),
    })
  }

  await batch.commit()
  return { sent: sentCount, total: customers.length }
})

// ─── getGoogleKeywordSuggestions ──────────────────────────────────────────────
// Fetch real Google autocomplete suggestions for a query via SerpAPI.
// Returns actual searches people type into Google — no fabricated keywords.
// Required env var: SERPAPI_KEY

exports.getGoogleKeywordSuggestions = onCall({ timeoutSeconds: 15 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const { query } = request.data
  if (!query || typeof query !== 'string') {
    throw new HttpsError('invalid-argument', 'query is required.')
  }

  const SERPAPI_KEY = process.env.SERPAPI_KEY || ''
  if (!SERPAPI_KEY) {
    // Graceful fallback — no error, just empty suggestions
    return { suggestions: [] }
  }

  try {
    // Google Autocomplete — returns what real users type into Google Search
    const params = new URLSearchParams({
      engine: 'google_autocomplete',
      q: query.trim(),
      api_key: SERPAPI_KEY,
    })

    const res = await fetch(`https://serpapi.com/search?${params}`, {
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return { suggestions: [] }

    const data = await res.json()
    const suggestions = (data.suggestions || []).map(s => s.value).filter(Boolean)
    return { suggestions }
  } catch {
    return { suggestions: [] }
  }
})

// ─── checkKeywordRank ─────────────────────────────────────────────────────────
// Check Google rank for a tracked keyword via SerpAPI.
// Required env var: SERPAPI_KEY (serpapi.com — $50/mo for 5,000 searches)
// Updates trackedKeywords/{keywordId} and appends to rankChecks collection.

exports.checkKeywordRank = onCall({ timeoutSeconds: 30 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const userSnap = await db.collection('users').doc(uid).get()
  const userData = userSnap.data() || {}
  const role = userData.role
  const hasRankTracker =
    role === 'admin' ||
    role === 'staff' ||
    userData.subscriptions?.rankTracker?.active === true

  if (!hasRankTracker) {
    throw new HttpsError('permission-denied', 'Rank Tracker subscription required.')
  }

  const { keywordId } = request.data
  if (!keywordId) throw new HttpsError('invalid-argument', 'keywordId is required.')

  const kwSnap = await db.collection('trackedKeywords').doc(keywordId).get()
  if (!kwSnap.exists) throw new HttpsError('not-found', 'Keyword not found.')

  const kw = kwSnap.data()
  if (kw.userId !== uid && role !== 'admin' && role !== 'staff') {
    throw new HttpsError('permission-denied', 'Not your keyword.')
  }

  const SERPAPI_KEY = process.env.SERPAPI_KEY || ''
  if (!SERPAPI_KEY) {
    throw new HttpsError('failed-precondition', 'Rank checking not configured. Set SERPAPI_KEY in Function env vars.')
  }

  const location = `${kw.city},${kw.state},United States`
  const params = new URLSearchParams({
    engine: 'google',
    q: kw.keyword,
    location,
    device: kw.device || 'mobile',
    num: '100',
    api_key: SERPAPI_KEY,
  })

  const res = await fetch(`https://serpapi.com/search?${params}`, {
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('SerpAPI error:', err)
    throw new HttpsError('internal', 'Rank check failed. Verify SERPAPI_KEY.')
  }

  const data = await res.json()

  // Check organic results for the target domain
  const organic = data.organic_results || []
  let rank = null
  const domainLower = (kw.domain || '').toLowerCase().replace(/^www\./, '')

  for (const result of organic) {
    const link = (result.link || result.url || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '')
    if (link.startsWith(domainLower) || link.includes(domainLower)) {
      rank = result.position
      break
    }
  }

  // Check local pack (Google Maps 3-pack)
  const localPlaces = data.local_results?.places || []
  const inLocalPack = localPlaces.some(place => {
    const site = (place.website || place.links?.website || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '')
    return site.startsWith(domainLower) || site.includes(domainLower)
  })

  // Update keyword document
  await db.collection('trackedKeywords').doc(keywordId).update({
    previousRank: kw.currentRank ?? null,
    currentRank: rank,
    inLocalPack,
    lastChecked: FieldValue.serverTimestamp(),
  })

  // Append to check history
  await db.collection('rankChecks').add({
    keywordId,
    userId: uid,
    keyword: kw.keyword,
    domain: kw.domain,
    rank,
    inLocalPack,
    checkedAt: FieldValue.serverTimestamp(),
  })

  return { rank, inLocalPack }
})

// ─── scheduleRankChecks ───────────────────────────────────────────────────────
// Scheduled function: runs every Monday at 2 AM UTC
// Checks ranks for all active tracked keywords across all users with rank tracker
// Respects SerpAPI rate limits (~166 checks/day with 5K/month plan)
// Only checks keywords not checked in past 7 days to avoid duplicate queries

exports.scheduleRankChecks = onSchedule('every monday 02:00', async () => {
  const SERPAPI_KEY = process.env.SERPAPI_KEY || ''
  if (!SERPAPI_KEY) {
    console.warn('SERPAPI_KEY not configured. Skipping scheduled rank checks.')
    return
  }

  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  try {
    // Find all users with rank tracker subscription
    const usersSnap = await db.collection('users')
      .where('subscriptions.rankTracker.active', '==', true)
      .get()

    console.log(`Found ${usersSnap.size} users with active rank tracker subscriptions.`)

    let totalChecks = 0
    let successCount = 0
    let failureCount = 0

    // For each user, get their keywords and check ranks
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id
      const userRef = db.collection('users').doc(userId)

      // Get all keywords for this user that haven't been checked recently
      const keywordsSnap = await db.collection('trackedKeywords')
        .where('userId', '==', userId)
        .get()

      console.log(`User ${userId}: checking ${keywordsSnap.size} keywords`)

      for (const kwDoc of keywordsSnap.docs) {
        const kwId = kwDoc.id
        const kw = kwDoc.data()

        // Skip if recently checked (within 7 days)
        const lastChecked = kw.lastChecked?.toDate?.() || new Date(0)
        if (lastChecked > sevenDaysAgo) {
          console.log(`Skipping ${kw.keyword} (checked ${lastChecked.toISOString()})`)
          continue
        }

        totalChecks++

        try {
          // Perform rank check via SerpAPI
          const location = `${kw.city},${kw.state},United States`
          const params = new URLSearchParams({
            engine: 'google',
            q: kw.keyword,
            location,
            device: kw.device || 'mobile',
            num: '100',
            api_key: SERPAPI_KEY,
          })

          const res = await fetch(`https://serpapi.com/search?${params}`, {
            signal: AbortSignal.timeout(20000),
          })

          if (!res.ok) {
            throw new Error(`SerpAPI returned ${res.status}`)
          }

          const data = await res.json()

          // Check organic results for the target domain
          const organic = data.organic_results || []
          let rank = null
          const domainLower = (kw.domain || '').toLowerCase().replace(/^www\./, '')

          for (const result of organic) {
            const link = (result.link || result.url || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '')
            if (link.startsWith(domainLower) || link.includes(domainLower)) {
              rank = result.position
              break
            }
          }

          // Check local pack (Google Maps 3-pack)
          const localPlaces = data.local_results?.places || []
          const inLocalPack = localPlaces.some(place => {
            const site = (place.website || place.links?.website || '').toLowerCase().replace(/^https?:\/\/(www\.)?/, '')
            return site.startsWith(domainLower) || site.includes(domainLower)
          })

          // Update keyword document
          await db.collection('trackedKeywords').doc(kwId).update({
            previousRank: kw.currentRank ?? null,
            currentRank: rank,
            inLocalPack,
            lastChecked: FieldValue.serverTimestamp(),
          })

          // Append to check history
          await db.collection('rankChecks').add({
            keywordId: kwId,
            userId,
            keyword: kw.keyword,
            domain: kw.domain,
            rank,
            inLocalPack,
            checkedAt: FieldValue.serverTimestamp(),
          })

          successCount++
          console.log(`✓ ${kw.keyword}: rank ${rank || 'not found'} ${inLocalPack ? '(in local pack)' : ''}`)

          // Rate limit: ~166 checks/day with 5K/month plan, spread across week
          // Add 1 second delay between checks to avoid overwhelming SerpAPI
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (err) {
          failureCount++
          console.error(`✗ Failed to check ${kw.keyword}:`, err.message)
        }
      }
    }

    console.log(`Scheduled rank check complete: ${successCount}/${totalChecks} succeeded, ${failureCount} failed`)

    return {
      totalChecks,
      successCount,
      failureCount,
      timestamp: new Date().toISOString(),
    }
  } catch (err) {
    console.error('Scheduled rank check failed:', err)
    throw err
  }
})

// ─── Stripe Integration ───────────────────────────────────────────────────────
// Required env vars: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

exports.createCheckoutSession = onCall({ timeoutSeconds: 30 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const { offerId } = request.data
  if (!offerId) throw new HttpsError('invalid-argument', 'offerId is required.')

  // Get offer from Firestore
  const offerSnap = await db.collection('offers').doc(offerId).get()
  if (!offerSnap.exists) throw new HttpsError('not-found', 'Offer not found.')

  const offer = offerSnap.data()
  if (!offer.active) throw new HttpsError('invalid-argument', 'Offer is not active.')
  if (!offer.stripePriceId) throw new HttpsError('failed-precondition', 'Stripe price ID not configured for this offer.')

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
  if (!STRIPE_SECRET) throw new HttpsError('failed-precondition', 'Stripe not configured.')

  try {
    const userSnap = await db.collection('users').doc(uid).get()
    const userEmail = userSnap.data()?.email || ''

    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      payment_method_types: ['card'],
      mode: offer.type === 'subscription' ? 'subscription' : 'payment',
      line_items: [{
        price: offer.stripePriceId,
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL || 'https://hub.reboostm.com'}/settings/billing?success=true`,
      cancel_url: `${process.env.CLIENT_URL || 'https://hub.reboostm.com'}/settings/billing?canceled=true`,
      metadata: {
        uid,
        offerId,
        offerName: offer.name,
        unlocksFeature: offer.unlocksFeature,
      },
    })

    return { url: session.url, sessionId: session.id }
  } catch (err) {
    console.error('Checkout session creation failed:', err)
    throw new HttpsError('internal', 'Could not create checkout session.')
  }
})

exports.createPortalSession = onCall({ timeoutSeconds: 30 }, async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
  if (!STRIPE_SECRET) throw new HttpsError('failed-precondition', 'Stripe not configured.')

  try {
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data() || {}
    const stripeCustomerId = userData.stripeCustomerId

    if (!stripeCustomerId) {
      throw new HttpsError('failed-precondition', 'No Stripe customer ID. Complete a purchase first.')
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || 'https://hub.reboostm.com'}/settings/billing`,
    })

    return { url: session.url }
  } catch (err) {
    console.error('Portal session creation failed:', {
      uid,
      message: err.message,
      code: err.code,
      hasCustomerId: !!userData.stripeCustomerId,
    })
    throw new HttpsError('internal', 'Could not create billing portal session.')
  }
})

exports.handleStripeWebhook = onRequest(async (req, res) => {
  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
  if (!WEBHOOK_SECRET) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured')
    return res.status(400).send('Webhook secret not configured')
  }

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object)
        break

      case 'customer.subscription.updated':
      case 'customer.subscription.created':
        await handleSubscriptionEvent(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
    }

    res.json({ received: true })
  } catch (err) {
    console.error('Webhook processing failed:', err)
    res.status(500).send('Internal Server Error')
  }
})

async function handleCheckoutComplete(session) {
  const { uid, offerId } = session.metadata || {}

  // In-app checkout — uid and offerId passed as Stripe metadata
  if (uid && offerId) {
    await handleInAppCheckout(session, uid, offerId)
    return
  }

  // External funnel checkout — no uid, look up by email
  const email = session.customer_details?.email || session.customer_email
  if (email) {
    await handleExternalFunnelCheckout(session, email)
    return
  }

  console.warn('Checkout session has no uid metadata and no email:', session.id)
}

async function handleInAppCheckout(session, uid, offerId) {
  const offerSnap = await db.collection('offers').doc(offerId).get()
  if (!offerSnap.exists) {
    console.warn('Offer not found:', offerId)
    return
  }

  const offer = offerSnap.data()
  const userRef = db.collection('users').doc(uid)

  if (session.customer) {
    await userRef.update({ stripeCustomerId: session.customer })
  }

  if (offer.type === 'subscription') {
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      await unlockSubscription(uid, offer, subscription.id)
    }
  } else {
    await unlockPurchase(uid, offer)
  }

  console.log(`✓ In-app checkout: user=${uid}, offer=${offerId}, feature=${offer.unlocksFeature}`)
}

async function handleExternalFunnelCheckout(session, email) {
  // 1. Find offer by Stripe price ID from line items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 })
  const priceId = lineItems.data[0]?.price?.id
  if (!priceId) {
    console.warn('External funnel checkout has no price ID:', session.id)
    return
  }

  const offersSnap = await db.collection('offers').where('stripePriceId', '==', priceId).limit(1).get()
  if (offersSnap.empty) {
    console.warn('No offer found for price ID:', priceId, '— skipping access grant')
    return
  }
  const offer = offersSnap.docs[0].data()

  // 2. Find or create Firebase Auth user
  const auth = getAuth()
  let uid
  let isNewUser = false

  try {
    const existingUser = await auth.getUserByEmail(email)
    uid = existingUser.uid
  } catch {
    const newUser = await auth.createUser({ email, emailVerified: false })
    uid = newUser.uid
    isNewUser = true

    await db.collection('users').doc(uid).set({
      email,
      displayName: session.customer_details?.name || '',
      businessName: '',
      niche: '',
      role: 'client',
      subscriptions: {
        scheduler:     { active: false, tier: null, stripeSubId: null },
        reviewManager: { active: false, stripeSubId: null },
        rankTracker:   { active: false, stripeSubId: null },
      },
      purchases: {
        citationsPackageId: null,
        leadCredits: 0,
        videoPackage: { unlocked: false },
      },
      stripeCustomerId: session.customer || null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }

  const userRef = db.collection('users').doc(uid)

  // 3. Store Stripe customer ID
  if (session.customer) {
    await userRef.update({ stripeCustomerId: session.customer })
  }

  // 4. Grant access
  if (offer.type === 'subscription') {
    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription)
      await unlockSubscription(uid, offer, subscription.id)
    }
  } else {
    await unlockPurchase(uid, offer)
  }

  // 5. Send welcome email via SendGrid (non-fatal — don't fail the webhook if email fails)
  const SENDGRID_KEY = process.env.SENDGRID_API_KEY || ''
  if (SENDGRID_KEY) {
    try {
      let loginLink = 'https://reboosthub.com/login'
      try {
        loginLink = await auth.generatePasswordResetLink(email)
      } catch (err) {
        console.warn('Could not generate password reset link:', err.message)
      }

      const greeting = session.customer_details?.name
        ? `Hi ${session.customer_details.name},`
        : 'Hi there,'

      const subject = isNewUser
        ? `Welcome to ReBoost Marketing HUB — Your ${offer.name} is ready`
        : `Your ${offer.name} has been activated on ReBoost Hub`

      const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a; background: #f9fafb; padding: 32px;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="color: #2563eb; margin: 0 0 16px 0; font-size: 24px;">ReBoost Marketing HUB</h1>
    <p>${greeting}</p>
    <p>Your <strong>${offer.name}</strong> has been activated and your account is ready to use.</p>
    ${isNewUser ? `
    <p>We created an account for you at <strong>${email}</strong>. Click below to set your password and access your tools:</p>
    <p style="margin: 28px 0; text-align: center;">
      <a href="${loginLink}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Set Password &amp; Log In →
      </a>
    </p>
    <p style="color: #666; font-size: 13px;">This link expires in 1 hour. If it expires, use "Forgot Password" on the login page.</p>
    ` : `
    <p>Log in to access your newly unlocked feature:</p>
    <p style="margin: 28px 0; text-align: center;">
      <a href="https://reboosthub.com/login" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        Log In to ReBoost Hub →
      </a>
    </p>
    `}
    <p style="color: #666; font-size: 13px; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
      Questions? Reply to this email anytime.<br>— The ReBoost Team
    </p>
  </div>
</div>`

      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SENDGRID_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@reboosthub.com', name: 'ReBoost Hub' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
        signal: AbortSignal.timeout(10000),
      })
      console.log(`✓ Welcome email sent to ${email}`)
    } catch (err) {
      console.warn('Welcome email failed (non-fatal):', err.message)
    }
  }

  console.log(`✓ External funnel checkout: user=${uid}, offer=${offer.name}, newUser=${isNewUser}`)
}

async function handleSubscriptionEvent(subscription) {
  const customerId = subscription.customer
  if (!customerId) return

  // Find user by Stripe customer ID
  const usersSnap = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get()

  if (usersSnap.empty) {
    console.warn('User not found for customer:', customerId)
    return
  }

  const userId = usersSnap.docs[0].id
  const status = subscription.status === 'active'

  // Get the price ID from the subscription
  const priceId = subscription.items.data[0]?.price.id
  if (!priceId) return

  // Find offer by stripe price ID
  const offersSnap = await db.collection('offers')
    .where('stripePriceId', '==', priceId)
    .limit(1)
    .get()

  if (offersSnap.empty) {
    console.warn('Offer not found for price:', priceId)
    return
  }

  const offer = offersSnap.docs[0].data()

  if (status) {
    await unlockSubscription(userId, offer, subscription.id)
  } else {
    await lockSubscription(userId, offer)
  }

  console.log(`✓ Subscription updated: user=${userId}, offer=${offer.name}, status=${subscription.status}`)
}

async function handleInvoicePaymentSucceeded(invoice) {
  const customerId = invoice.customer
  if (!customerId) return

  // Find user by Stripe customer ID
  const usersSnap = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get()

  if (usersSnap.empty) return

  const userId = usersSnap.docs[0].id

  // Get subscription from invoice
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription)
    const priceId = subscription.items.data[0]?.price.id
    if (!priceId) return

    const offersSnap = await db.collection('offers')
      .where('stripePriceId', '==', priceId)
      .limit(1)
      .get()

    if (!offersSnap.empty) {
      const offer = offersSnap.docs[0].data()
      await unlockSubscription(userId, offer, subscription.id)
      console.log(`✓ Invoice paid: user=${userId}, offer=${offer.name}`)
    }
  }
}

async function handleSubscriptionDeleted(subscription) {
  const customerId = subscription.customer
  if (!customerId) return

  const usersSnap = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get()

  if (usersSnap.empty) return

  const userId = usersSnap.docs[0].id
  const priceId = subscription.items.data[0]?.price.id
  if (!priceId) return

  const offersSnap = await db.collection('offers')
    .where('stripePriceId', '==', priceId)
    .limit(1)
    .get()

  if (!offersSnap.empty) {
    const offer = offersSnap.docs[0].data()
    await lockSubscription(userId, offer)
    console.log(`✓ Subscription canceled: user=${userId}, offer=${offer.name}`)
  }
}

async function unlockSubscription(uid, offer, stripeSubId) {
  const userRef = db.collection('users').doc(uid)
  const field = `subscriptions.${offer.unlocksFeature}`

  await userRef.update({
    [field]: {
      active: true,
      tier: offer.tier || null,
      stripeSubId,
    },
    updatedAt: FieldValue.serverTimestamp(),
  })
}

async function lockSubscription(uid, offer) {
  const userRef = db.collection('users').doc(uid)
  const field = `subscriptions.${offer.unlocksFeature}`

  await userRef.update({
    [field]: {
      active: false,
      tier: null,
      stripeSubId: null,
    },
    updatedAt: FieldValue.serverTimestamp(),
  })
}

async function unlockPurchase(uid, offer) {
  const userRef = db.collection('users').doc(uid)
  const userSnap = await userRef.get()
  const userData = userSnap.data()

  if (offer.unlocksFeature === 'citations') {
    // Check if this is first citations purchase
    const wasFirstPurchase = !userData?.purchases?.citationsPackageId

    // Citations use citationsPackageId, not a boolean flag
    const updateData = {
      'purchases.citationsPackageId': offer.tier || 'citations_starter',
      updatedAt: FieldValue.serverTimestamp(),
    }

    // If first purchase, trigger exclusion list modal on next login
    if (wasFirstPurchase) {
      updateData.firstCitationsPurchaseAt = FieldValue.serverTimestamp()
      updateData.showCitationExclusionList = true
    }

    await userRef.update(updateData)
  } else if (offer.unlocksFeature === 'leadCredits') {
    const current = userData?.purchases?.leadCredits || 0
    await userRef.update({
      'purchases.leadCredits': current + (offer.creditAmount || 0),
      updatedAt: FieldValue.serverTimestamp(),
    })
  } else {
    await userRef.update({
      [`purchases.${offer.unlocksFeature}`]: true,
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
}

// ─── Gmail OAuth ──────────────────────────────────────────────────────────────
// Allows users to connect their personal Gmail account so that review request
// emails are sent FROM their own address (not a generic service).
//
// Required env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI
// Setup: Google Cloud Console → APIs & Services → Enable Gmail API → OAuth 2.0
//        Credentials → add GMAIL_REDIRECT_URI as authorized redirect URI.

exports.getGmailAuthUrl = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const clientId     = process.env.GMAIL_CLIENT_ID || ''
  const redirectUri  = process.env.GMAIL_REDIRECT_URI || ''
  if (!clientId || !redirectUri) {
    throw new HttpsError(
      'failed-precondition',
      'Gmail OAuth not configured. Set GMAIL_CLIENT_ID and GMAIL_REDIRECT_URI in Firebase Function env vars.'
    )
  }

  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
    access_type:   'offline',
    prompt:        'consent',  // always show consent screen so we always get a refresh_token
    state:         uid,
  })

  return { url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }
})

exports.handleGmailOAuthCallback = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  const { code } = request.data
  if (!code) throw new HttpsError('invalid-argument', 'Missing authorization code.')

  const clientId     = process.env.GMAIL_CLIENT_ID || ''
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || ''
  const redirectUri  = process.env.GMAIL_REDIRECT_URI || ''

  // Exchange authorization code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()

  if (tokens.error) {
    throw new HttpsError('internal', tokens.error_description || tokens.error || 'Token exchange failed.')
  }
  if (!tokens.refresh_token) {
    throw new HttpsError(
      'failed-precondition',
      'No refresh token received. Go to myaccount.google.com → Security → Third-party apps, remove ReBoost Hub, then reconnect.'
    )
  }

  // Get the connected Gmail address
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  })
  const profile = await profileRes.json()

  await db.collection('users').doc(uid).update({
    gmailRefreshToken: tokens.refresh_token,
    gmailEmail:        profile.email || '',
    gmailConnectedAt:  FieldValue.serverTimestamp(),
  })

  return { email: profile.email || '' }
})

exports.disconnectGmail = onCall(async (request) => {
  const uid = request.auth?.uid
  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

  await db.collection('users').doc(uid).update({
    gmailRefreshToken: null,
    gmailEmail:        null,
    gmailConnectedAt:  null,
  })

  return { success: true }
})
