const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp()
const db = getFirestore()

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
