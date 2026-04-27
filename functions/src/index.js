const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { initializeApp } = require('firebase-admin/app')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')
const { getAuth } = require('firebase-admin/auth')

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
]

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

    // Resolve tier
    const tierKey = packageId.replace('citations_', '') // 'citations_starter' → 'starter'
    const targetCount = TIER_COUNTS[tierKey] || 100

    // Block duplicate active jobs
    const activeSnap = await db.collection('citations')
      .where('userId', '==', userId)
      .where('status', 'in', ['queued', 'running'])
      .limit(1)
      .get()
    if (!activeSnap.empty) {
      throw new HttpsError('already-exists', 'A submission job is already running. Wait for it to complete.')
    }

    // Business info for the submission engine
    const businessData = {
      businessName: user.businessName || '',
      address:      user.address      || '',
      city:         user.city         || '',
      state:        user.state        || '',
      zip:          user.zip          || '',
      phone:        user.phone        || '',
      website:      user.website      || '',
      email:        user.email        || '',
      niche:        user.niche        || '',
    }

    const directories = MASTER_DIRECTORIES.slice(0, targetCount)

    // Create the batch document
    const batchRef = db.collection('citations').doc()
    await batchRef.set({
      userId,
      packageId,
      packageTier: tierKey,
      targetCount,
      total: directories.length,
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

    // TODO: Trigger Cloud Run job here — Cloud Run polls for 'queued' batches,
    //       uses Playwright + 2Captcha to submit, and updates status/counts in real-time.
    //       See: github.com/Reboostm/ReBoost-Citations for the automation engine.

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

  const { email, password, displayName = '', role = 'client' } = request.data
  if (!email || !password) throw new HttpsError('invalid-argument', 'email and password are required.')
  if (password.length < 6) throw new HttpsError('invalid-argument', 'Password must be at least 6 characters.')

  const allowed = ['client', 'staff', 'admin']
  if (!allowed.includes(role)) throw new HttpsError('invalid-argument', 'Invalid role.')
  if ((role === 'admin' || role === 'staff') && callerRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Only admins can create staff or admin accounts.')
  }

  const auth = getAuth()
  const user = await auth.createUser({ email, password, displayName })

  await db.collection('users').doc(user.uid).set({
    email,
    displayName,
    role,
    businessName: '', phone: '', website: '', address: '',
    city: '', state: '', zip: '', niche: '', tagline: '', currentOffer: '',
    logoUrl: null, photoUrls: [], connectedEmail: null,
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

  return { uid: user.uid }
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

// ─── searchLeads ─────────────────────────────────────────────────────────────
// Calls Google Maps Places API with key rotation.
// Requires settings/googleMapsKeys Firestore doc with keys array.
// Deducts 1 lead credit from user (admin/staff bypass).

exports.searchLeads = onCall(
  { timeoutSeconds: 120, memory: '512MiB' },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in.')

    const { niche, city, radius = 25 } = request.data
    if (!niche || !city) throw new HttpsError('invalid-argument', 'niche and city are required.')

    // Check credits (admin/staff bypass)
    const userSnap = await db.collection('users').doc(uid).get()
    const userData = userSnap.data()
    const isAdmin = userData?.role === 'admin' || userData?.role === 'staff'
    const leadCredits = userData?.purchases?.leadCredits || 0

    if (!isAdmin && leadCredits <= 0) {
      throw new HttpsError('failed-precondition', 'No lead credits remaining.')
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

    // Text search
    const searchQuery = `${niche} in ${city}`
    const radiusMeters = Math.round(radius * 1609)
    const textUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&radius=${radiusMeters}&key=${apiKey}`

    const textResp = await fetch(textUrl)
    const textData = await textResp.json()

    if (textData.status !== 'OK' && textData.status !== 'ZERO_RESULTS') {
      throw new HttpsError('internal', `Maps API error: ${textData.status}`)
    }

    const places = (textData.results || []).slice(0, 20)

    // Enrich each place with phone + website via Place Details
    const enriched = await Promise.all(
      places.map(async (place) => {
        try {
          const detailUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,rating,user_ratings_total&key=${apiKey}`
          const detailResp = await fetch(detailUrl)
          const detailData = await detailResp.json()
          const d = detailData.result || {}
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
    await batchRef.set({
      userId: uid,
      niche,
      city,
      searchQuery,
      totalFound: enriched.length,
      exported: false,
      createdAt: FieldValue.serverTimestamp(),
    })

    const writeBatch = db.batch()
    enriched.forEach(item => {
      writeBatch.set(batchRef.collection('items').doc(), item)
    })
    await writeBatch.commit()

    // Deduct 1 credit (non-admin)
    if (!isAdmin) {
      await db.collection('users').doc(uid).update({
        'purchases.leadCredits': FieldValue.increment(-1),
      })
    }

    // Increment key usage: 1 TextSearch + up to 20 Details
    const callsUsed = 1 + enriched.length
    const updatedKeys = keys.map(k =>
      k.key === apiKey ? { ...k, usageThisMonth: (k.usageThisMonth || 0) + callsUsed } : k
    )
    await keysRef.update({ keys: updatedKeys })

    return { batchId: batchRef.id, results: enriched, totalFound: enriched.length }
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
