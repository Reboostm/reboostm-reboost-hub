import { useEffect, useState } from 'react'
import { MapPin, Plus, Loader2, Trash2, CheckCircle, XCircle } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { getTerritories, upsertTerritory } from '../../services/firestore'
import { db } from '../../services/firebase'
import { doc, deleteDoc } from 'firebase/firestore'
import { useToast } from '../../hooks/useToast'

const NICHES = [
  'Plumbing', 'HVAC', 'Electrical', 'Roofing', 'Landscaping', 'Painting',
  'Pest Control', 'Cleaning', 'Flooring', 'Windows & Doors', 'General Contractor',
  'Dentist', 'Chiropractor', 'Auto Repair', 'Real Estate', 'Insurance', 'Law', 'Other',
]

const STATUS_VARIANTS = { available: 'success', taken: 'error', reserved: 'warning' }

function AddForm({ onSaved }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ niche: '', city: '', state: '', status: 'available', clientName: '' })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.niche || !form.city || !form.state) {
      toast('Niche, city, and state are required.', 'warning')
      return
    }
    setSaving(true)
    try {
      await upsertTerritory(null, form)
      toast('Territory added!', 'success')
      setForm({ niche: '', city: '', state: '', status: 'available', clientName: '' })
      onSaved()
    } catch {
      toast('Failed to save territory.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-hub-text mb-4">Add Territory</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <select
          value={form.niche}
          onChange={e => set('niche', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue col-span-2 md:col-span-1"
        >
          <option value="">— Niche —</option>
          {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <input placeholder="City" value={form.city} onChange={e => set('city', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue" />
        <input placeholder="State (e.g. UT)" value={form.state} onChange={e => set('state', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue" />
        <select value={form.status} onChange={e => set('status', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue">
          <option value="available">Available</option>
          <option value="taken">Taken</option>
          <option value="reserved">Reserved</option>
        </select>
        <input placeholder="Client name (if taken)" value={form.clientName} onChange={e => set('clientName', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue col-span-2 md:col-span-1" />
      </div>
      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add Territory
      </Button>
    </Card>
  )
}

export default function AdminTerritories() {
  const { toast } = useToast()
  const [territories, setTerritories] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    getTerritories().then(setTerritories).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this territory?')) return
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'territories', id))
      setTerritories(prev => prev.filter(t => t.id !== id))
      toast('Territory deleted.', 'success')
    } catch {
      toast('Failed to delete.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-hub-text">Territories</h1>
        <p className="text-hub-text-secondary text-sm mt-0.5">
          Control which niche + city combinations are available or taken by clients.
        </p>
      </div>

      <AddForm onSaved={load} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </div>
      ) : territories.length === 0 ? (
        <Card className="text-center py-10">
          <MapPin className="w-8 h-8 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text-muted text-sm">No territories added yet.</p>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-hub-border">
            {territories.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-3.5">
                <MapPin className="w-4 h-4 text-hub-text-muted flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-hub-text">{t.city}, {t.state}</p>
                  <p className="text-xs text-hub-text-muted capitalize">
                    {t.niche}{t.clientName ? ` · ${t.clientName}` : ''}
                  </p>
                </div>
                <Badge variant={STATUS_VARIANTS[t.status] || 'gray'} className="capitalize flex-shrink-0">
                  {t.status}
                </Badge>
                <button
                  onClick={() => handleDelete(t.id)}
                  disabled={deleting === t.id}
                  className="text-hub-text-muted hover:text-hub-red transition-colors flex-shrink-0 disabled:opacity-40"
                >
                  {deleting === t.id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Trash2 className="w-4 h-4" />
                  }
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
