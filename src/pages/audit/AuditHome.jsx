import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, ArrowRight, Clock, TrendingUp, Globe,
  MapPin, ChevronRight, CheckCircle, Loader2,
  AlertTriangle, RotateCcw,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { runSeoAudit } from '../../services/functions'
import { getAuditResults } from '../../services/firestore'
import { cn } from '../../utils/cn'

// Steps shown during the audit loading animation
const AUDIT_STEPS = [
  { id: 'pagespeed', icon: Globe,  label: 'Checking page speed…' },
  { id: 'seo',       icon: Search, label: 'Analysing on-page SEO…' },
  { id: 'gmb',       icon: MapPin, label: 'Looking up Google Business Profile…' },
  { id: 'citations', icon: TrendingUp, label: 'Estimating citation score…' },
  { id: 'report',    icon: CheckCircle, label: 'Building your report…' },
]

function gradeColor(grade) {
  if (grade === 'A') return 'text-hub-green'
  if (grade === 'B') return 'text-hub-blue'
  if (grade === 'C') return 'text-hub-yellow'
  if (grade === 'D') return 'text-hub-orange'
  return 'text-hub-red'
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AuditHome() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    url: userProfile?.website || '',
    businessName: userProfile?.businessName || '',
    city: [userProfile?.city, userProfile?.state].filter(Boolean).join(', '),
  })
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [previousAudits, setPreviousAudits] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  // Pre-fill form when profile loads
  useEffect(() => {
    if (userProfile) {
      setForm(prev => ({
        url: prev.url || userProfile.website || '',
        businessName: prev.businessName || userProfile.businessName || '',
        city: prev.city || [userProfile.city, userProfile.state].filter(Boolean).join(', '),
      }))
    }
  }, [userProfile])

  // Load previous audits
  useEffect(() => {
    if (!userProfile?.id) return
    setHistoryLoading(true)
    getAuditResults(userProfile.id)
      .then(results => setPreviousAudits(results.slice(0, 5)))
      .catch(() => {/* non-fatal */})
      .finally(() => setHistoryLoading(false))
  }, [userProfile?.id])

  const handleSubmit = async (e) => {
    e.preventDefault()

    const url = form.url.trim()
    const businessName = form.businessName.trim()
    const city = form.city.trim()

    if (!url || !businessName || !city) {
      toast('Please fill in all three fields.', 'warning')
      return
    }

    // Basic URL validation
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      if (!parsed.hostname.includes('.')) throw new Error()
    } catch {
      toast('Enter a valid URL, e.g. https://yoursite.com', 'warning')
      return
    }

    setLoading(true)
    setCurrentStep(0)

    // Animate steps while the function runs
    let step = 0
    const stepInterval = setInterval(() => {
      step += 1
      if (step < AUDIT_STEPS.length - 1) setCurrentStep(step)
    }, 3500)

    try {
      const result = await runSeoAudit({ url, businessName, city })
      clearInterval(stepInterval)
      setCurrentStep(AUDIT_STEPS.length - 1) // "Building report"
      await new Promise(r => setTimeout(r, 600)) // brief pause before redirect

      navigate('/audit/results', { state: { result } })
    } catch (err) {
      clearInterval(stepInterval)
      console.error('Audit error:', err)
      toast(err.message || 'Audit failed — please try again.', 'error')
      setLoading(false)
      setCurrentStep(-1)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-hub-blue/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-hub-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-hub-text">SEO Audit</h1>
            <p className="text-hub-text-secondary text-sm">Free — no credit card required</p>
          </div>
        </div>
        <p className="text-hub-text-secondary text-sm mt-3 leading-relaxed">
          Get a scored report on your local SEO health — page speed, on-page SEO,
          Google Business Profile, and citation consistency.
        </p>
      </div>

      {/* Audit Form or Loading */}
      {loading ? (
        <AuditLoadingCard steps={AUDIT_STEPS} currentStep={currentStep} />
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-hub-text mb-1.5">
                Website URL
              </label>
              <input
                type="text"
                placeholder="https://yoursite.com"
                value={form.url}
                onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
                className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-hub-text mb-1.5">
                Business name
              </label>
              <input
                type="text"
                placeholder="Smith Plumbing LLC"
                value={form.businessName}
                onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
                className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-hub-text mb-1.5">
                City &amp; State
              </label>
              <input
                type="text"
                placeholder="Salt Lake City, UT"
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
              />
            </div>

            <Button type="submit" className="w-full" size="lg">
              Run Free Audit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* What we check */}
          <div className="mt-6 pt-5 border-t border-hub-border grid grid-cols-2 gap-3">
            {[
              { icon: Globe,       label: 'Page Speed', sub: 'Mobile + desktop' },
              { icon: Search,      label: 'On-Page SEO', sub: 'Lighthouse audit' },
              { icon: MapPin,      label: 'GMB Status', sub: 'Google Business' },
              { icon: TrendingUp,  label: 'Citations', sub: 'Directory presence' },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-hub-input flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-hub-text-secondary" />
                </div>
                <div>
                  <p className="text-xs font-medium text-hub-text">{label}</p>
                  <p className="text-xs text-hub-text-muted">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Previous Audits */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-hub-text">Previous Audits</h2>
          {previousAudits.length > 0 && (
            <span className="text-xs text-hub-text-muted">{previousAudits.length} saved</span>
          )}
        </div>

        {historyLoading ? (
          <div className="flex items-center gap-2 text-hub-text-muted text-sm py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading history…</span>
          </div>
        ) : previousAudits.length === 0 ? (
          <div className="text-center py-8 text-hub-text-muted text-sm">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No audits yet — run one above and it'll appear here.</p>
          </div>
        ) : (
          <Card padding={false}>
            <ul className="divide-y divide-hub-border">
              {previousAudits.map(audit => (
                <li key={audit.id}>
                  <button
                    onClick={() => navigate('/audit/results', { state: { result: audit } })}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-hub-input/50 transition-colors text-left group"
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0',
                      'bg-hub-input border border-hub-border',
                      gradeColor(audit.overallGrade)
                    )}>
                      {audit.overallGrade || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-hub-text truncate">{audit.businessName}</p>
                      <p className="text-xs text-hub-text-muted truncate">{audit.url}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-hub-text-secondary">{audit.overallScore}/100</p>
                      <p className="text-xs text-hub-text-muted flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatDate(audit.createdAt)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-hub-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── Loading Animation Card ───────────────────────────────────────────────────

function AuditLoadingCard({ steps, currentStep }) {
  return (
    <Card className="text-center">
      {/* Animated spinner */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-hub-border" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-hub-blue animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Search className="w-6 h-6 text-hub-blue" />
          </div>
        </div>
      </div>

      <h3 className="text-hub-text font-semibold mb-1">Auditing your website…</h3>
      <p className="text-hub-text-muted text-xs mb-6">This takes 15–40 seconds — hang tight.</p>

      <ul className="space-y-2.5 text-left max-w-xs mx-auto">
        {steps.map((step, idx) => {
          const Icon = step.icon
          const done = idx < currentStep
          const active = idx === currentStep
          const pending = idx > currentStep
          return (
            <li key={step.id} className="flex items-center gap-3">
              <div className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                done    && 'bg-hub-green/20 text-hub-green',
                active  && 'bg-hub-blue/20 text-hub-blue',
                pending && 'bg-hub-input text-hub-text-muted',
              )}>
                {done ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : active ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span className={cn(
                'text-sm transition-colors',
                done    && 'text-hub-green',
                active  && 'text-hub-text font-medium',
                pending && 'text-hub-text-muted',
              )}>
                {step.label}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
