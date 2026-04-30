import { useLocation, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Globe, Search, MapPin, TrendingUp, Star,
  CheckCircle, XCircle, AlertTriangle, Info, ArrowRight,
  RefreshCw, Download, ExternalLink, Zap,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { cn } from '../../utils/cn'

// ─── Grade helpers ────────────────────────────────────────────────────────────

function gradeBg(grade) {
  if (grade === 'A') return 'bg-hub-green/10 border-hub-green/30'
  if (grade === 'B') return 'bg-hub-blue/10 border-hub-blue/30'
  if (grade === 'C') return 'bg-hub-yellow/10 border-hub-yellow/30'
  if (grade === 'D') return 'bg-hub-orange/10 border-hub-orange/30'
  if (grade === 'F') return 'bg-hub-red/10 border-hub-red/30'
  return 'bg-hub-input border-hub-border'
}

function gradeText(grade) {
  if (grade === 'A') return 'text-hub-green'
  if (grade === 'B') return 'text-hub-blue'
  if (grade === 'C') return 'text-hub-yellow'
  if (grade === 'D') return 'text-hub-orange'
  if (grade === 'F') return 'text-hub-red'
  return 'text-hub-text-muted'
}

function gradeLabel(grade, score) {
  if (grade === 'A') return 'Excellent'
  if (grade === 'B') return 'Good'
  if (grade === 'C') return 'Fair'
  if (grade === 'D') return 'Poor'
  if (grade === 'F') return score !== null ? 'Critical' : 'Not checked'
  return '—'
}

function metricColor(score) {
  if (score >= 90) return 'text-hub-green'
  if (score >= 50) return 'text-hub-yellow'
  return 'text-hub-red'
}

function metricBarBg(score) {
  if (score >= 90) return 'bg-hub-green'
  if (score >= 50) return 'bg-hub-yellow'
  return 'bg-hub-red'
}

function overallRingColor(grade) {
  if (grade === 'A') return '#22C55E'
  if (grade === 'B') return '#4F8EF7'
  if (grade === 'C') return '#F59E0B'
  if (grade === 'D') return '#F97316'
  return '#EF4444'
}

function formatTs(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

// ─── Category definitions ────────────────────────────────────────────────────

const CATEGORIES = [
  {
    key: 'performance',
    label: 'Page Speed',
    icon: Zap,
    description: (score) =>
      score >= 90 ? 'Your site loads fast — great for rankings and conversions.' :
      score >= 75 ? 'Page speed is decent but has room to improve.' :
      score >= 60 ? 'Your site is slow on mobile. Users are likely bouncing.' :
      score >= 45 ? 'Slow page speed is hurting your rankings and conversions.' :
      'Critical speed issues — this is costing you customers every day.',
  },
  {
    key: 'seo',
    label: 'On-Page SEO',
    icon: Search,
    description: (score) =>
      score >= 90 ? 'Strong on-page SEO fundamentals in place.' :
      score >= 75 ? 'Good SEO base — a few improvements could push you higher.' :
      score >= 60 ? 'Several on-page issues are limiting your search visibility.' :
      score >= 45 ? 'Significant SEO gaps that search engines penalise.' :
      'Major on-page SEO issues found. Search engines struggle to index your site.',
  },
  {
    key: 'gmb',
    label: 'Google Business',
    icon: MapPin,
    description: (score, extra) => {
      if (extra?.skipped) return 'GMB check requires a Google Places API key.'
      if (!extra?.found)   return 'No Google Business Profile found. You\'re invisible in local search.'
      if (score >= 90)     return `${extra.rating}★ with ${extra.reviewCount} reviews — excellent local presence.`
      if (score >= 75)     return `Found with ${extra.reviewCount} reviews. More reviews will improve your map ranking.`
      if (score >= 60)     return `Listed but your review count (${extra.reviewCount}) is below local competitors.`
      return `Listed but very few reviews (${extra.reviewCount}). Focus on getting more 5-star reviews.`
    },
  },
  {
    key: 'citations',
    label: 'Citations',
    icon: TrendingUp,
    description: (score) =>
      score >= 75 ? 'Good citation presence — your NAP info appears on key directories.' :
      score >= 60 ? 'Some directory listings found, but consistency could be improved.' :
      score >= 45 ? 'Limited citation footprint. More directories means more local authority.' :
      'Weak citation presence. Most competitors have more directory listings than you.',
  },
]

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditResults() {
  const location = useLocation()
  const navigate = useNavigate()

  const result = location.state?.result

  // No result — redirect back
  if (!result) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-64 gap-4 text-center">
        <AlertTriangle className="w-10 h-10 text-hub-yellow" />
        <div>
          <p className="text-hub-text font-medium">No audit results to display</p>
          <p className="text-hub-text-muted text-sm mt-1">Run an audit to see your local SEO score.</p>
        </div>
        <Button onClick={() => navigate('/audit')}>
          <ArrowLeft className="w-4 h-4" />
          Back to Audit
        </Button>
      </div>
    )
  }

  const { businessName, url, city, overallScore, overallGrade, scores, metrics, insights } = result
  const needsCitations = (scores?.citations?.score || 0) < 65
  const radius = 46
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (overallScore / 100) * circumference
  const ringColor = overallRingColor(overallGrade)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/audit')}
          className="flex items-center gap-1.5 text-sm text-hub-text-secondary hover:text-hub-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          New Audit
        </button>
        <span className="text-hub-border">·</span>
        <span className="text-sm text-hub-text-muted truncate max-w-xs">{url}</span>
      </div>

      {/* Overall Score Hero */}
      <Card className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
        {/* SVG Ring */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120" className="-rotate-90">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#2D3148" strokeWidth="8" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: 'stroke-dashoffset 1s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('text-3xl font-bold', gradeText(overallGrade))}>{overallGrade}</span>
            <span className="text-xs text-hub-text-muted">{overallScore}/100</span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-xl font-semibold text-hub-text">{businessName}</h1>
          <p className="text-hub-text-muted text-sm mt-0.5">{city}</p>
          <p className={cn('text-base font-medium mt-2', gradeText(overallGrade))}>
            {gradeLabel(overallGrade, overallScore)} local SEO
          </p>
          <p className="text-hub-text-secondary text-sm mt-1">
            {overallScore >= 80
              ? 'You\'re performing well. A few tweaks could make you untouchable.'
              : overallScore >= 60
              ? 'Solid foundation, but competitors with higher scores are outranking you.'
              : overallScore >= 40
              ? 'Several issues are limiting your local search visibility.'
              : 'Critical gaps are costing you customers in local search every day.'}
          </p>
          {result.createdAt && (
            <p className="text-xs text-hub-text-muted mt-2">
              Audited {formatTs(result.createdAt)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={() => navigate('/audit')}>
            <RefreshCw className="w-3.5 h-3.5" />
            Re-run
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-hub-text-secondary hover:text-hub-text rounded-lg hover:bg-hub-input transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visit site
          </a>
        </div>
      </Card>

      {/* Category Score Cards */}
      <div>
        <h2 className="text-sm font-semibold text-hub-text mb-3">Score Breakdown</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CATEGORIES.map(cat => {
            const data = scores?.[cat.key] || {}
            const score = data.score
            const grade = data.grade || 'N/A'
            const Icon = cat.icon
            return (
              <div
                key={cat.key}
                className={cn(
                  'rounded-xl border p-4 flex items-start gap-3',
                  grade !== 'N/A' ? gradeBg(grade) : 'bg-hub-card border-hub-border'
                )}
              >
                <div className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                  grade !== 'N/A' ? gradeBg(grade) : 'bg-hub-input'
                )}>
                  <Icon className={cn('w-4 h-4', gradeText(grade))} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-hub-text">{cat.label}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {score !== null && score !== undefined && (
                        <span className="text-xs text-hub-text-muted">{score}/100</span>
                      )}
                      <span className={cn('text-sm font-bold', gradeText(grade))}>{grade}</span>
                    </div>
                  </div>
                  {/* Score bar */}
                  {score !== null && score !== undefined && (
                    <div className="h-1 rounded-full bg-hub-input/50 mb-2 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', metricBarBg(score))}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  )}
                  <p className="text-xs text-hub-text-secondary leading-relaxed">
                    {cat.description(score, data)}
                  </p>
                  {/* GMB extras */}
                  {cat.key === 'gmb' && data.found && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 text-xs text-hub-yellow">
                        <Star className="w-3 h-3 fill-hub-yellow" />
                        <span>{data.rating}</span>
                      </div>
                      <span className="text-hub-text-muted text-xs">·</span>
                      <span className="text-xs text-hub-text-muted">{data.reviewCount} reviews</span>
                    </div>
                  )}
                  {cat.key === 'gmb' && data.found === false && (
                    <a
                      href="https://business.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-hub-blue hover:underline mt-1.5"
                    >
                      Claim your Google Business Profile
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {cat.key === 'citations' && data.estimated && (
                    <p className="text-xs text-hub-text-muted mt-1 italic">Estimated score</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Core Web Vitals */}
      {metrics && Object.values(metrics).some(v => v !== null) && (
        <Card>
          <CardHeader>
            <CardTitle>Core Web Vitals</CardTitle>
            <span className="text-xs text-hub-text-muted">Mobile · Google Lighthouse</span>
          </CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'fcp',  scoreKey: 'fcpScore',  label: 'First Contentful Paint',    abbr: 'FCP' },
              { key: 'lcp',  scoreKey: 'lcpScore',  label: 'Largest Contentful Paint',  abbr: 'LCP' },
              { key: 'tbt',  scoreKey: 'tbtScore',  label: 'Total Blocking Time',       abbr: 'TBT' },
              { key: 'cls',  scoreKey: 'clsScore',  label: 'Cumulative Layout Shift',   abbr: 'CLS' },
              { key: 'si',   scoreKey: null,        label: 'Speed Index',               abbr: 'SI' },
            ].filter(m => metrics[m.key]).map(m => {
              const score = m.scoreKey ? (metrics[m.scoreKey] ?? null) : null
              return (
                <div key={m.key} className="bg-hub-input rounded-lg p-3">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-semibold text-hub-text-secondary">{m.abbr}</span>
                    {score !== null && (
                      <span className={cn('text-xs font-medium', metricColor(score))}>
                        {score >= 90 ? 'Fast' : score >= 50 ? 'Moderate' : 'Slow'}
                      </span>
                    )}
                  </div>
                  <p className={cn('text-lg font-semibold', score !== null ? metricColor(score) : 'text-hub-text')}>
                    {metrics[m.key]}
                  </p>
                  <p className="text-xs text-hub-text-muted mt-0.5 leading-tight">{m.label}</p>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Top Issues */}
      {insights && insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Issues to Fix</CardTitle>
            <span className="text-xs text-hub-text-muted">{insights.length} issues found</span>
          </CardHeader>
          <ul className="space-y-3">
            {insights.map((issue, i) => {
              const severity = issue.score < 30 ? 'critical' : issue.score < 60 ? 'warning' : 'info'
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                    severity === 'critical' && 'bg-hub-red/15',
                    severity === 'warning'  && 'bg-hub-yellow/15',
                    severity === 'info'     && 'bg-hub-blue/15',
                  )}>
                    {severity === 'critical' ? (
                      <XCircle className="w-3 h-3 text-hub-red" />
                    ) : severity === 'warning' ? (
                      <AlertTriangle className="w-3 h-3 text-hub-yellow" />
                    ) : (
                      <Info className="w-3 h-3 text-hub-blue" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-hub-text">{issue.title}</p>
                      {issue.displayValue && (
                        <span className={cn(
                          'text-xs font-medium flex-shrink-0',
                          severity === 'critical' ? 'text-hub-red' :
                          severity === 'warning'  ? 'text-hub-yellow' : 'text-hub-blue'
                        )}>
                          {issue.displayValue}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-hub-text-muted mt-0.5 leading-relaxed line-clamp-2">
                      {issue.description}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {/* Citations CTA — shown when citations score is C or below */}
      {needsCitations && (
        <div className="rounded-xl border border-hub-orange/30 bg-hub-orange/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-hub-orange/15 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-hub-orange" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-hub-text">Your citations need work</h3>
            <p className="text-sm text-hub-text-secondary mt-0.5">
              Inconsistent or missing directory listings are one of the biggest factors
              holding back your local rankings. Our Citations tool submits and monitors
              your business across 80+ directories automatically.
            </p>
          </div>
          <Link to="/citations" className="flex-shrink-0">
            <Button variant="accent" size="sm">
              Fix Your Citations
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* GMB CTA — shown when not found */}
      {scores?.gmb?.found === false && (
        <div className="rounded-xl border border-hub-red/30 bg-hub-red/5 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-hub-red/15 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-hub-red" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-hub-text">You're invisible on Google Maps</h3>
            <p className="text-sm text-hub-text-secondary mt-0.5">
              We couldn't find a Google Business Profile for <strong className="text-hub-text">{businessName}</strong> in {city}.
              Without one, you won't appear in the local map pack — the most clicked results in local search.
            </p>
          </div>
          <a
            href="https://business.google.com/create"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <Button variant="danger" size="sm">
              Claim Your Profile
              <ExternalLink className="w-4 h-4" />
            </Button>
          </a>
        </div>
      )}

      {/* Next Steps Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Your Priority Action Plan</CardTitle>
        </CardHeader>
        <ul className="space-y-2.5">
          {buildActionPlan(result).map((action, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold',
                i === 0 ? 'bg-hub-red/20 text-hub-red' :
                i === 1 ? 'bg-hub-orange/20 text-hub-orange' :
                          'bg-hub-blue/15 text-hub-blue'
              )}>
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-medium text-hub-text">{action.title}</p>
                <p className="text-xs text-hub-text-muted mt-0.5">{action.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>

    </div>
  )
}

// ─── Builds a personalised action plan from the audit result ──────────────────

function buildActionPlan(result) {
  const { scores, metrics } = result
  const actions = []

  // GMB missing — highest priority for local businesses
  if (scores?.gmb?.found === false) {
    actions.push({
      title: 'Claim your Google Business Profile',
      detail: 'The #1 thing you can do for local SEO. Unlocks map pack visibility.',
    })
  }

  // Performance critical
  if ((scores?.performance?.score || 0) < 50) {
    actions.push({
      title: 'Fix critical page speed issues',
      detail: 'Compress images, enable caching, and remove render-blocking scripts. Slow pages rank lower and convert worse.',
    })
  }

  // Citations low
  if ((scores?.citations?.score || 0) < 65) {
    actions.push({
      title: 'Build & clean your citation listings',
      detail: 'Consistent NAP (name, address, phone) across 80+ directories is a proven local ranking factor.',
    })
  }

  // SEO issues
  if ((scores?.seo?.score || 0) < 70) {
    actions.push({
      title: 'Fix on-page SEO issues',
      detail: 'Missing meta descriptions, title tags, and structured data are easy wins that move rankings.',
    })
  }

  // GMB reviews low
  if (scores?.gmb?.found && (scores.gmb.reviewCount || 0) < 15) {
    actions.push({
      title: 'Grow your Google reviews',
      detail: `You have ${scores.gmb.reviewCount || 0} reviews. Aim for 25+ to compete in your local market.`,
    })
  }

  // Performance moderate
  if ((scores?.performance?.score || 0) >= 50 && (scores?.performance?.score || 0) < 75) {
    actions.push({
      title: 'Improve mobile page speed',
      detail: 'Your site is moderate — closing the gap to 90+ can lift rankings and reduce bounce rate.',
    })
  }

  // Default if nothing critical
  if (actions.length === 0) {
    actions.push({
      title: 'Maintain and monitor your SEO health',
      detail: 'Re-run this audit monthly to catch regressions before competitors notice.',
    })
  }

  return actions.slice(0, 4)
}
