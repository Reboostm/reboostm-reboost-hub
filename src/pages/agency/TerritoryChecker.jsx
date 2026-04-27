import { useState } from 'react'
import { CheckCircle2, XCircle, Building2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { NICHES, US_STATES } from '../../config'
import { checkTerritory } from '../../services/firestore'
import { useToast } from '../../hooks/useToast'

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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-hub-text">Territory Checker</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Check if your niche + city is available for exclusive ReBoost agency services.
        </p>
      </div>

      <Card>
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
            <Building2 className="w-4 h-4" /> Check Territory
          </Button>
        </div>
      </Card>

      {result && (
        <div className={`mt-6 flex items-center gap-4 p-5 rounded-xl border ${
          result === 'available'
            ? 'bg-hub-green/10 border-hub-green/30'
            : 'bg-hub-red/10 border-hub-red/30'
        }`}>
          {result === 'available' ? (
            <CheckCircle2 className="w-8 h-8 text-hub-green shrink-0" />
          ) : (
            <XCircle className="w-8 h-8 text-hub-red shrink-0" />
          )}
          <div>
            <p className={`font-semibold ${result === 'available' ? 'text-hub-green' : 'text-hub-red'}`}>
              {result === 'available' ? 'Territory Available!' : 'Territory Taken'}
            </p>
            <p className="text-sm text-hub-text-secondary mt-0.5">
              {result === 'available'
                ? 'This territory is open. Contact us to lock it in before someone else does.'
                : 'This area is already covered by another ReBoost client.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
