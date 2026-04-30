import { useState } from 'react'
import { CheckCircle2, XCircle, Building2, Lock, MapPin } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { NICHES, US_STATES } from '../../config'
import { checkTerritory } from '../../services/firestore'
import { useToast } from '../../hooks/useToast'

const CLAIMED_NICHES = [
  { niche: 'plumber',     city: 'Salt Lake City', state: 'UT' },
  { niche: 'hvac',        city: 'Denver',         state: 'CO' },
  { niche: 'roofer',      city: 'Phoenix',        state: 'AZ' },
]

export default function TerritoryChecker() {
  const { toast } = useToast()
  const [form, setForm] = useState({ niche: '', city: '', state: '' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleCheck = async () => {
    if (!form.niche || !form.city || !form.state) {
      toast('Please fill in all fields.', 'warning')
      return
    }
    setLoading(true)
    try {
      const territory = await checkTerritory(form.niche, form.city, form.state)
      setResult(territory ? territory.status : 'available')
    } catch {
      toast('Check failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const nicheName = NICHES.find(n => n.value === form.niche)?.label || form.niche

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Territory Checker</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Each niche + city territory is exclusive — one ReBoost client per market.
          Check if yours is still available.
        </p>
      </div>

      <Card className="mb-5">
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
          <Button className="w-full" size="lg" loading={loading} onClick={handleCheck}>
            <Building2 className="w-4 h-4 mr-2" /> Check Territory
          </Button>
        </div>
      </Card>

      {result && (
        <div className={`mb-5 p-5 rounded-xl border ${
          result === 'available'
            ? 'bg-hub-green/10 border-hub-green/30'
            : 'bg-hub-red/10 border-hub-red/30'
        }`}>
          <div className="flex items-start gap-4">
            {result === 'available'
              ? <CheckCircle2 className="w-8 h-8 text-hub-green shrink-0 mt-0.5" />
              : <XCircle     className="w-8 h-8 text-hub-red shrink-0 mt-0.5" />
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
                <a
                  href="https://marketingreboost.com/claim"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4"
                >
                  <Button>Claim This Territory →</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recently claimed */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Claimed Territories</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {CLAIMED_NICHES.map(t => (
            <div key={`${t.niche}-${t.city}`} className="flex items-center gap-3 py-2 border-b border-hub-border/40 last:border-0">
              <Lock className="w-3.5 h-3.5 text-hub-red shrink-0" />
              <span className="text-sm text-hub-text">
                {NICHES.find(n => n.value === t.niche)?.label}
              </span>
              <span className="flex items-center gap-1 text-xs text-hub-text-muted ml-auto">
                <MapPin className="w-3 h-3" />
                {t.city}, {t.state}
              </span>
            </div>
          ))}
          <p className="text-xs text-hub-text-muted pt-1">
            These are example territories — live data managed via Admin → Territories.
          </p>
        </div>
      </Card>
    </div>
  )
}
