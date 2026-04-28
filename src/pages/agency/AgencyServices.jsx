import { useState } from 'react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { Globe, Zap, Megaphone, Bot, CheckCircle, CheckCircle2, XCircle, Building2, Lock, MapPin } from 'lucide-react'
import { NICHES, US_STATES } from '../../config'
import { checkTerritory } from '../../services/firestore'
import { useToast } from '../../hooks/useToast'

const SERVICES = [
  {
    icon: Globe,
    title: 'Website Design & SEO',
    price: 'From $997',
    badge: 'Most Popular',
    badgeVariant: 'info',
    description: 'Custom-built, mobile-first websites optimized for local search. Includes on-page SEO, Google Business Profile setup, and schema markup.',
    includes: ['Custom design', 'On-page SEO', 'Google setup', 'Fast hosting'],
  },
  {
    icon: Zap,
    title: 'Marketing Automations',
    price: 'From $497/mo',
    badge: null,
    description: 'GHL-powered follow-up sequences, lead nurture campaigns, and appointment booking automations that run while you sleep.',
    includes: ['Lead follow-up', 'Appointment booking', 'SMS & email flows', 'CRM pipeline'],
  },
  {
    icon: Megaphone,
    title: 'Paid Ads Management',
    price: 'From $797/mo',
    badge: null,
    description: 'Google Ads and Facebook Ads campaigns managed by certified specialists with deep local business expertise. Performance guaranteed.',
    includes: ['Google Ads', 'Facebook/Instagram Ads', 'Landing pages', 'Monthly reporting'],
  },
  {
    icon: Bot,
    title: 'Voice AI & Chatbot',
    price: 'From $297/mo',
    badge: 'New',
    badgeVariant: 'success',
    description: 'AI-powered voice agents and webchat bots that answer calls, capture leads, and book appointments 24/7 — no staff required.',
    includes: ['24/7 answering', 'Lead capture', 'Appointment booking', 'CRM sync'],
  },
]

const CLAIMED_NICHES = [
  { niche: 'plumber',  city: 'Salt Lake City', state: 'UT' },
  { niche: 'hvac',     city: 'Denver',         state: 'CO' },
  { niche: 'roofer',   city: 'Phoenix',        state: 'AZ' },
]

export default function AgencyServices() {
  const { toast } = useToast()
  const [form, setForm] = useState({ niche: '', city: '', state: '' })
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)

  const handleCheck = async () => {
    if (!form.niche || !form.city || !form.state) {
      toast('Please fill in all fields.', 'warning')
      return
    }
    setChecking(true)
    try {
      const territory = await checkTerritory(form.niche, form.city, form.state)
      setResult(territory ? territory.status : 'available')
    } catch {
      toast('Check failed. Please try again.', 'error')
    } finally {
      setChecking(false) }
  }

  const nicheName = NICHES.find(n => n.value === form.niche)?.label || form.niche

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Agency & DFY Services</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Let ReBoost Marketing handle the heavy lifting. Full-service digital marketing for local businesses.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {SERVICES.map(({ icon: Icon, title, price, badge, badgeVariant, description, includes }) => (
          <Card key={title} className="flex flex-col">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-hub-blue/10 border border-hub-blue/20 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-hub-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-hub-text text-sm">{title}</h3>
                  {badge && <Badge variant={badgeVariant} size="sm">{badge}</Badge>}
                </div>
                <p className="text-hub-blue font-semibold text-sm mt-0.5">{price}</p>
              </div>
            </div>
            <p className="text-xs text-hub-text-secondary leading-relaxed mb-3">{description}</p>
            <ul className="space-y-1 mt-auto">
              {includes.map(item => (
                <li key={item} className="flex items-center gap-2 text-xs text-hub-text-secondary">
                  <CheckCircle className="w-3 h-3 text-hub-green shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <Card className="bg-hub-blue/5 border-hub-blue/20 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-hub-text">Book a Free Strategy Call</h3>
            <p className="text-sm text-hub-text-secondary mt-1">
              30 minutes with a ReBoost specialist. We'll map out exactly what your business needs — no pressure, no fluff.
            </p>
          </div>
          <a
            href="https://marketingreboost.com/call"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button size="lg">Book a Free Call →</Button>
          </a>
        </div>
      </Card>

      {/* Territory Checker */}
      <div className="mb-2">
        <h2 className="text-lg font-semibold text-hub-text mb-1">Check Your Service Area</h2>
        <p className="text-hub-text-secondary text-sm mb-4">
          We only take one client per niche per city — exclusive territories. Check if your market is still available.
        </p>
      </div>

      <Card className="mb-4">
        <div className="space-y-4">
          <Select
            label="Business niche"
            options={NICHES}
            placeholder="Select niche…"
            value={form.niche}
            onChange={e => setForm(p => ({ ...p, niche: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="City"
              placeholder="Salt Lake City"
              value={form.city}
              onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
            />
            <Select
              label="State"
              options={US_STATES}
              placeholder="State"
              value={form.state}
              onChange={e => setForm(p => ({ ...p, state: e.target.value }))}
            />
          </div>
          <Button className="w-full" size="lg" loading={checking} onClick={handleCheck}>
            <Building2 className="w-4 h-4 mr-2" /> Check Territory
          </Button>
        </div>
      </Card>

      {result && (
        <div className={`mb-4 p-5 rounded-xl border ${
          result === 'available' ? 'bg-hub-green/10 border-hub-green/30' : 'bg-hub-red/10 border-hub-red/30'
        }`}>
          <div className="flex items-start gap-4">
            {result === 'available'
              ? <CheckCircle2 className="w-8 h-8 text-hub-green shrink-0 mt-0.5" />
              : <XCircle className="w-8 h-8 text-hub-red shrink-0 mt-0.5" />
            }
            <div className="flex-1">
              <p className={`font-semibold text-lg ${result === 'available' ? 'text-hub-green' : 'text-hub-red'}`}>
                {result === 'available' ? '✓ Territory Available!' : '✗ Territory Taken'}
              </p>
              <p className="text-sm text-hub-text-secondary mt-1">
                {result === 'available'
                  ? `${nicheName} in ${form.city}, ${form.state} is open. Lock it in before someone else does.`
                  : `${nicheName} in ${form.city}, ${form.state} is already covered by another ReBoost client.`
                }
              </p>
              {result === 'available' && (
                <a href="https://marketingreboost.com/claim" target="_blank" rel="noopener noreferrer" className="inline-block mt-4">
                  <Button>Claim This Territory →</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <Card>
        <h3 className="text-sm font-semibold text-hub-text mb-3">Recently Claimed Territories</h3>
        <div className="space-y-2">
          {CLAIMED_NICHES.map(t => (
            <div key={`${t.niche}-${t.city}`} className="flex items-center gap-3 py-2 border-b border-hub-border/40 last:border-0">
              <Lock className="w-3.5 h-3.5 text-hub-red shrink-0" />
              <span className="text-sm text-hub-text">{NICHES.find(n => n.value === t.niche)?.label}</span>
              <span className="flex items-center gap-1 text-xs text-hub-text-muted ml-auto">
                <MapPin className="w-3 h-3" />
                {t.city}, {t.state}
              </span>
            </div>
          ))}
          <p className="text-xs text-hub-text-muted pt-1">These are example territories — live data managed via Admin → Territories.</p>
        </div>
      </Card>
    </div>
  )
}
