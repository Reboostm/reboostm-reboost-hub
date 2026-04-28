import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, DollarSign } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { createOffer, updateOffer, deleteOffer, getOffers } from '../../services/firestore'
import { useToast } from '../../hooks/useToast'

const FEATURE_OPTIONS = [
  'scheduler', 'reviewManager', 'rankTracker', 'citations', 'leadCredits', 'calendar', 'outreachTemplates'
]

const OFFER_TYPES = [
  { value: 'subscription', label: 'Subscription (recurring monthly/yearly)' },
  { value: 'payment', label: 'One-time Purchase' },
]

function OfferForm({ offer, onSave, onCancel }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(offer || {
    name: '',
    description: '',
    price: '',
    stripePriceId: '',
    type: 'subscription',
    unlocksFeature: '',
    tier: '',
    active: true,
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.price || !form.type || !form.unlocksFeature) {
      toast('Name, price, type, and feature are required.', 'warning')
      return
    }

    setSaving(true)
    try {
      if (offer?.id) {
        await updateOffer(offer.id, form)
        toast('Offer updated!', 'success')
      } else {
        await createOffer(form)
        toast('Offer created!', 'success')
      }
      onSave()
    } catch (err) {
      toast('Failed to save offer.', 'error')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        placeholder="Offer name (e.g., 'Scheduler Pro')"
        value={form.name}
        onChange={e => set('name', e.target.value)}
        className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue"
      />

      <textarea
        placeholder="Description (e.g., '10 accounts, unlimited posts')"
        value={form.description}
        onChange={e => set('description', e.target.value)}
        rows={2}
        className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <input
          placeholder="Price (e.g., 49 or 97)"
          type="number"
          value={form.price}
          onChange={e => set('price', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue"
        />
        <select
          value={form.type}
          onChange={e => set('type', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue"
        >
          {OFFER_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <select
          value={form.unlocksFeature}
          onChange={e => set('unlocksFeature', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue"
        >
          <option value="">— Feature this unlocks —</option>
          {FEATURE_OPTIONS.map(f => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <input
          placeholder="Tier (e.g., 'basic' or 'pro') — optional"
          value={form.tier}
          onChange={e => set('tier', e.target.value)}
          className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue"
        />
      </div>

      <input
        placeholder="Stripe Price ID (paste here once created in Stripe Dashboard)"
        value={form.stripePriceId}
        onChange={e => set('stripePriceId', e.target.value)}
        className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue font-mono text-xs"
      />

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => set('active', e.target.checked)}
          className="w-4 h-4 rounded border border-hub-border bg-hub-input accent-hub-blue"
        />
        <span className="text-sm text-hub-text">Active (show to customers)</span>
      </label>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Offer'}
        </Button>
        <Button variant="secondary" onClick={onCancel} size="sm">Cancel</Button>
      </div>
    </div>
  )
}

export default function AdminOffers() {
  const { toast } = useToast()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    getOffers(false).then(setOffers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this offer?')) return
    setDeleting(id)
    try {
      await deleteOffer(id)
      setOffers(prev => prev.filter(o => o.id !== id))
      toast('Offer deleted.', 'success')
    } catch {
      toast('Failed to delete.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const openCreate = () => {
    setEditingOffer(null)
    setModalOpen(true)
  }

  const openEdit = (offer) => {
    setEditingOffer(offer)
    setModalOpen(true)
  }

  const handleSave = () => {
    setModalOpen(false)
    load()
  }

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Offers & Pricing</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">
            Create subscriptions and one-time purchases. Add Stripe Price IDs to make them purchasable.
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="w-4 h-4" /> New Offer
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </div>
      ) : offers.length === 0 ? (
        <Card className="text-center py-10">
          <DollarSign className="w-8 h-8 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text-muted text-sm">No offers yet. Create one to get started.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {offers.map(offer => (
            <Card key={offer.id} padding={false}>
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-hub-text">{offer.name}</p>
                    <Badge variant={offer.active ? 'success' : 'gray'} size="sm">
                      {offer.active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="orange" size="sm" className="capitalize">
                      {offer.type === 'subscription' ? 'Recurring' : 'One-time'}
                    </Badge>
                  </div>
                  <p className="text-xs text-hub-text-muted mb-2">{offer.description}</p>
                  <div className="flex gap-3 text-xs text-hub-text-muted">
                    <span>${offer.price}</span>
                    <span>→ {offer.unlocksFeature}</span>
                    {offer.tier && <span className="capitalize">({offer.tier})</span>}
                    {offer.stripePriceId
                      ? <span className="text-hub-green">✓ Stripe ID set</span>
                      : <span className="text-hub-red">⚠ No Stripe ID</span>
                    }
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(offer)}
                    className="text-hub-text-muted hover:text-hub-blue transition-colors p-2 hover:bg-hub-input rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(offer.id)}
                    disabled={deleting === offer.id}
                    className="text-hub-text-muted hover:text-hub-red transition-colors p-2 hover:bg-hub-input rounded disabled:opacity-40"
                  >
                    {deleting === offer.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOffer ? 'Edit Offer' : 'Create New Offer'}
        size="lg"
      >
        <OfferForm
          offer={editingOffer}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
