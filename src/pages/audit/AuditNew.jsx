import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, ArrowRight, Globe, MapPin, TrendingUp,
  CheckCircle, Loader2, ArrowLeft,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { runSeoAudit } from '../../services/functions'
import { cn } from '../../utils/cn'

const AUDIT_STEPS = [
  { id: 'pagespeed', icon: Globe,       label: 'Checking page speed…' },
  { id: 'seo',       icon: Search,      label: 'Analysing on-page SEO…' },
  { id: 'gmb',       icon: MapPin,      label: 'Looking up Google Business Profile…' },
  { id: 'citations', icon: TrendingUp,  label: 'Estimating citation score…' },
  { id: 'report',    icon: CheckCircle, label: 'Building your report…' },
]

export default function AuditNew() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    url: '',
    businessName: '',
    city: '',
  })
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)

  // Pre-fill from profile
  useEffect(() => {
    if (userProfile) {
      setForm(prev => ({
        url:          prev.url          || userProfile.website      || '',
        businessName: prev.businessName || userProfile.businessName || '',
        city:         prev.city         || [userProfile.city, userProfile.state].filter(Boolean).join(', '),
      }))
    }
  }, [userProfile])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const url          = form.url.trim()
    const businessName = form.businessName.trim()
    const city         = form.city.trim()

    if (!url || !businessName || !city) {
      toast('Please fill in all three fields.', 'warning')
      return
    }
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      toast('Enter a valid URL, e.g. https://yoursite.com', 'warning')
      return
    }

    setLoading(true)
    setCurrentStep(0)

    let step = 0
    const interval = setInterval(() => {
      step += 1
      if (step < AUDIT_STEPS.length - 1) setCurrentStep(step)
    }, 3500)

    try {
      const result = await runSeoAudit({ url, businessName, city })
      clearInterval(interval)
      setCurrentStep(AUDIT_STEPS.length - 1)
      await new Promise(r => setTimeout(r, 600))
      navigate('/audit/results', { state: { result } })
    } catch (err) {
      clearInterval(interval)
      toast(err.message || 'Audit failed — please try again.', 'error')
      setLoading(false)
      setCurrentStep(-1)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/audit" className="text-hub-text-muted hover:text-hub-text transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-10 h-10 rounded-xl bg-hub-blue/10 flex items-center justify-center">
          <Search className="w-5 h-5 text-hub-blue" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Run SEO Audit</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">Free — no credit card required</p>
        </div>
      </div>

      {loading ? (
        <Card className="text-center py-10">
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
            {AUDIT_STEPS.map((s, idx) => {
              const Icon = s.icon
              const done    = idx < currentStep
              const active  = idx === currentStep
              const pending = idx > currentStep
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                    done    && 'bg-hub-green/20 text-hub-green',
                    active  && 'bg-hub-blue/20 text-hub-blue',
                    pending && 'bg-hub-input text-hub-text-muted',
                  )}>
                    {done   ? <CheckCircle className="w-3.5 h-3.5" /> :
                     active ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                              <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={cn(
                    'text-sm transition-colors',
                    done    && 'text-hub-green',
                    active  && 'text-hub-text font-medium',
                    pending && 'text-hub-text-muted',
                  )}>
                    {s.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      ) : (
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: 'url',          label: 'Website URL',    placeholder: 'https://yoursite.com' },
              { key: 'businessName', label: 'Business name',  placeholder: 'Smith Plumbing LLC'   },
              { key: 'city',         label: 'City & State',   placeholder: 'Salt Lake City, UT'   },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-hub-text mb-1.5">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
                />
              </div>
            ))}
            <Button type="submit" className="w-full" size="lg">
              Run Free Audit
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-hub-border grid grid-cols-2 gap-3">
            {[
              { icon: Globe,      label: 'Page Speed',  sub: 'Mobile + desktop' },
              { icon: Search,     label: 'On-Page SEO', sub: 'Lighthouse audit'  },
              { icon: MapPin,     label: 'GMB Status',  sub: 'Google Business'  },
              { icon: TrendingUp, label: 'Citations',   sub: 'Directory presence'},
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
    </div>
  )
}
