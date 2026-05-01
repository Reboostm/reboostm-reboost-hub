import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, DollarSign, BookOpen, Star, TrendingUp, Calendar, Sparkles, Users, Tag } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { createOffer, updateOffer, deleteOffer, getOffers, deleteOrphanedCitationPackages } from '../../services/firestore'
import { useToast } from '../../hooks/useToast'
import { db } from '../../services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

const FEATURE_TABS = [
  { key: 'citations',       label: 'Citations',          icon: BookOpen,   tiers: [] }, // Will be loaded dynamically
  { key: 'scheduler',       label: 'Scheduler',          icon: Calendar,   tiers: [{ value: 'basic', label: 'Basic' }, { value: 'pro', label: 'Pro' }] },
  { key: 'reviewManager',   label: 'Review Manager',     icon: Star,       tiers: [] },
  { key: 'rankTracker',     label: 'Rank Tracker',       icon: TrendingUp, tiers: [] },
  { key: 'leadCredits',     label: 'Lead Generator',     icon: Users,      tiers: [] },
  { key: 'calendar',        label: 'Celebrity Content',  icon: Sparkles,   tiers: [] },
  { key: 'other',           label: 'Other',              icon: Tag,        tiers: [] },
]

const OFFER_TYPES = [
  { value: 'subscription', label: 'Subscription (monthly)' },
  { value: 'payment',      label: 'One-time Purchase' },
]

function OfferForm({ offer, activeTab, onSave, onCancel }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [citationTiers, setCitationTiers] = useState([])
  const [loadingTiers, setLoadingTiers] = useState(false)

  // Load citation packages when citations tab is active
  useEffect(() => {
    if (activeTab !== 'citations') return

    const loadTiers = async () => {
      setLoadingTiers(true)
      try {
        // Load ALL citation offers (active and inactive) to check which packages are in use
        const offersQuery = query(
          collection(db, 'offers'),
          where('unlocksFeature', '==', 'citations')
        )
        const offersSnap = await getDocs(offersQuery)
        const offersByTier = new Map()
        offersSnap.docs.forEach(doc => {
          const tier = doc.data().tier
          if (tier) {
            offersByTier.set(tier, doc.data())
          }
        })

        // Load all citation packages
        const snap = await getDocs(collection(db, 'citation_packages'))
        const tiers = snap.docs
          .filter(doc => {
            // Show package if:
            // 1. It has NO offer linked (orphaned, can reuse), OR
            // 2. It's linked to an ACTIVE offer
            if (!offersByTier.has(doc.id)) return true // Orphaned package, show it
            const linkedOffer = offersByTier.get(doc.id)
            return linkedOffer.active === true // Show if active
          })
          .map(doc => ({
            value: doc.id,
            label: doc.data().name + ` (${doc.data().count} sites)`,
          }))
        setCitationTiers(tiers)
      } catch (err) {
        console.error('Error loading citation packages:', err)
        toast('Error loading citation packages', 'error')
      } finally {
        setLoadingTiers(false)
      }
    }

    loadTiers()
  }, [activeTab, toast])

  const tabDef = {
    ...FEATURE_TABS.find(t => t.key === activeTab),
    tiers: activeTab === 'citations' ? citationTiers : FEATURE_TABS.find(t => t.key === activeTab)?.tiers || [],
  }

  const [form, setForm] = useState(() => offer || {
    name: '',
    description: '',
    price: '',
    stripePriceId: '',
    type: 'payment',
    unlocksFeature: activeTab === 'other' ? '' : activeTab,
    tier: '',
    isUpgrade: false,
    active: true,
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.name || !form.price || !form.type || (!form.unlocksFeature && activeTab !== 'other')) {
      toast('Name, price, and type are required.', 'warning')
      return
    }
    const payload = { ...form, unlocksFeature: activeTab === 'other' ? form.unlocksFeature : activeTab }
    setSaving(true)
    try {
      if (offer?.id) {
        await updateOffer(offer.id, payload)
        toast('Offer updated!', 'success')
      } else {
        await createOffer(payload)
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
      {/* Upgrade toggle — shown for citations or features with tiers */}
      {(activeTab === 'citations' || tabDef.tiers.length > 0) && (
        <div className={`flex items-center gap-3 p-3 rounded-xl border ${form.isUpgrade ? 'bg-hub-blue/10 border-hub-blue/40' : 'bg-hub-input border-hub-border'}`}>
          <input
            type="checkbox"
            id="isUpgrade"
            checked={!!form.isUpgrade}
            onChange={e => set('isUpgrade', e.target.checked)}
            className="w-4 h-4 rounded border border-hub-border bg-hub-card accent-hub-blue"
          />
          <div>
            <label htmlFor="isUpgrade" className="text-sm font-medium text-hub-text cursor-pointer">Upgrade offer</label>
            <p className="text-xs text-hub-text-muted">Check this if customers who already have a lower tier should see this offer (upgrade pricing)</p>
          </div>
        </div>
      )}

      <input
        placeholder="Offer name (e.g., 'Citation Starter — 100 Directories')"
        value={form.name}
        onChange={e => set('name', e.target.value)}
        className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue"
      />

      <textarea
        placeholder="Short description shown to customers (e.g., 'Get listed in 100 top business directories')"
        value={form.description}
        onChange={e => set('description', e.target.value)}
        rows={2}
        className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-hub-text-muted block mb-1.5">Price ($)</label>
          <input
            placeholder="e.g. 197"
            type="number"
            value={form.price}
            onChange={e => set('price', e.target.value)}
            className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-hub-text-muted block mb-1.5">Payment type</label>
          <select
            value={form.type}
            onChange={e => set('type', e.target.value)}
            className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue"
          >
            {OFFER_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tier selector — only for features that have tiers */}
      {tabDef.tiers.length > 0 && (
        <div>
          <label className="text-xs font-medium text-hub-text-muted block mb-1.5">
            {activeTab === 'citations' ? 'Citation Package' : 'Tier'} this offer unlocks
          </label>
          <select
            value={form.tier}
            onChange={e => set('tier', e.target.value)}
            disabled={activeTab === 'citations' && loadingTiers}
            className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue disabled:opacity-50"
          >
            <option value="">— {activeTab === 'citations' && loadingTiers ? 'Loading packages...' : 'Select ' + (activeTab === 'citations' ? 'package' : 'tier') + ' —'}</option>
            {tabDef.tiers.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Other tab — manual feature selection */}
      {activeTab === 'other' && (
        <div>
          <label className="text-xs font-medium text-hub-text-muted block mb-1.5">Feature this unlocks</label>
          <input
            placeholder="e.g. outreachTemplates"
            value={form.unlocksFeature}
            onChange={e => set('unlocksFeature', e.target.value)}
            className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue"
          />
        </div>
      )}

      <div className="bg-hub-input/50 border border-hub-border rounded-lg p-3">
        <label className="text-xs font-medium text-hub-text-muted block mb-2">
          Stripe Price ID <span className="text-hub-text-muted font-normal">(add later — save without it to test)</span>
        </label>
        <input
          placeholder="price_xxxxxxxxxxxxxxxxxxxx"
          value={form.stripePriceId}
          onChange={e => set('stripePriceId', e.target.value)}
          className="w-full bg-hub-card border border-hub-border rounded px-2 py-1.5 text-xs text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue font-mono"
        />
        <p className="text-xs text-hub-text-muted mt-1.5">Copy from Stripe Dashboard → Products → your product → the price row</p>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => set('active', e.target.checked)}
          className="w-4 h-4 rounded border border-hub-border bg-hub-input accent-hub-blue"
        />
        <span className="text-sm text-hub-text">Active (visible to customers)</span>
      </label>

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (offer?.id ? 'Save Changes' : 'Create Offer')}
        </Button>
        <Button variant="secondary" onClick={onCancel} size="sm">Cancel</Button>
      </div>
    </div>
  )
}

function OfferCard({ offer, onEdit, onDelete, deleting }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-hub-border/50 last:border-0 hover:bg-hub-input/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="text-sm font-semibold text-hub-text">{offer.name}</p>
          {offer.isUpgrade && <Badge variant="info" size="sm">Upgrade</Badge>}
          <Badge variant={offer.active ? 'success' : 'gray'} size="sm">{offer.active ? 'Active' : 'Off'}</Badge>
          <Badge variant="orange" size="sm">{offer.type === 'subscription' ? 'Monthly' : 'One-time'}</Badge>
        </div>
        {offer.description && <p className="text-xs text-hub-text-muted mb-1.5">{offer.description}</p>}
        <div className="flex gap-3 text-xs text-hub-text-muted flex-wrap">
          <span className="font-semibold text-hub-text">${offer.price}</span>
          {offer.tier && <span className="capitalize text-hub-blue">{offer.tier.replace('citations_', '')}</span>}
          {offer.stripePriceId
            ? <span className="text-hub-green">Stripe connected</span>
            : <span className="text-hub-yellow">No Stripe ID yet</span>
          }
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(offer)} className="text-hub-text-muted hover:text-hub-blue transition-colors p-2 hover:bg-hub-input rounded">
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={() => onDelete(offer.id)} disabled={deleting === offer.id} className="text-hub-text-muted hover:text-hub-red transition-colors p-2 hover:bg-hub-input rounded disabled:opacity-40">
          {deleting === offer.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  )
}

export default function AdminOffers() {
  const { toast } = useToast()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('citations')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [cleaning, setCleaning] = useState(false)

  const load = () => {
    setLoading(true)
    getOffers(false).then(setOffers).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const tabOffers = offers.filter(o =>
    activeTab === 'other'
      ? !FEATURE_TABS.slice(0, -1).some(t => t.key === o.unlocksFeature)
      : o.unlocksFeature === activeTab
  )

  const newOffers     = tabOffers.filter(o => !o.isUpgrade)
  const upgradeOffers = tabOffers.filter(o => !!o.isUpgrade)

  const handleDelete = async (id) => {
    setDeleting(id)
    try {
      await deleteOffer(id)
      setOffers(prev => prev.filter(o => o.id !== id))
      toast('Offer deleted.', 'success')
    } catch (err) {
      console.error('Delete offer failed:', err)
      toast(`Failed to delete: ${err.message}`, 'error')
    } finally {
      setDeleting(null)
      setConfirmDelete(null)
    }
  }

  const handleCleanOrphans = async () => {
    setCleaning(true)
    try {
      const count = await deleteOrphanedCitationPackages()
      toast(count > 0 ? `Deleted ${count} orphaned package(s).` : 'No orphaned packages found.', 'success')
    } catch (err) {
      console.error('Cleanup failed:', err)
      toast(`Cleanup failed: ${err.message}`, 'error')
    } finally {
      setCleaning(false)
    }
  }

  const openCreate = () => { setEditingOffer(null); setModalOpen(true) }
  const openEdit   = (offer) => { setEditingOffer(offer); setModalOpen(true) }
  const handleSave = () => { setModalOpen(false); load() }

  const tabDef = FEATURE_TABS.find(t => t.key === activeTab)
  // Citations loads tiers dynamically so the static tiers[] is always empty —
  // force hasTiers true for citations so the Upgrade Offers section always renders.
  const hasTiers = tabDef?.tiers?.length > 0 || activeTab === 'citations'

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Offers & Pricing</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">
            Manage pricing for each tool. Add Stripe Price IDs to activate checkout.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'citations' && (
            <Button variant="secondary" onClick={handleCleanOrphans} size="sm" disabled={cleaning}>
              {cleaning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {cleaning ? 'Cleaning...' : 'Clean Orphaned Packages'}
            </Button>
          )}
          <Button onClick={openCreate} size="sm">
            <Plus className="w-4 h-4" /> New Offer
          </Button>
        </div>
      </div>

      {/* Feature tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FEATURE_TABS.map(tab => {
          const count = offers.filter(o =>
            tab.key === 'other'
              ? !FEATURE_TABS.slice(0, -1).some(t => t.key === o.unlocksFeature)
              : o.unlocksFeature === tab.key
          ).length
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-hub-blue text-white'
                  : 'bg-hub-input border border-hub-border text-hub-text-muted hover:text-hub-text hover:border-hub-blue/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-hub-card text-hub-text-muted'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* New customer offers */}
          <Card padding={false}>
            <div className="px-5 py-3 border-b border-hub-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-hub-text">New Customer Offers</p>
                <p className="text-xs text-hub-text-muted">Shown to users who don't have this tool yet</p>
              </div>
            </div>
            {newOffers.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-7 h-7 text-hub-text-muted mx-auto mb-2 opacity-40" />
                <p className="text-hub-text-muted text-sm">No new-customer offers yet.</p>
                <button onClick={openCreate} className="text-xs text-hub-blue hover:underline mt-1">Add one</button>
              </div>
            ) : (
              newOffers.map(o => (
                <OfferCard key={o.id} offer={o} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />
              ))
            )}
          </Card>

          {/* Upgrade offers — only shown for tools that have tiers */}
          {hasTiers && (
            <Card padding={false}>
              <div className="px-5 py-3 border-b border-hub-border">
                <p className="text-sm font-semibold text-hub-text">Upgrade Offers</p>
                <p className="text-xs text-hub-text-muted">Shown only to existing customers who can upgrade to a higher tier</p>
              </div>
              {upgradeOffers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-hub-text-muted text-sm">No upgrade offers yet.</p>
                  <p className="text-xs text-hub-text-muted mt-1">Create an offer and check "Upgrade offer" to add one.</p>
                  <button onClick={openCreate} className="text-xs text-hub-blue hover:underline mt-1">Add upgrade offer</button>
                </div>
              ) : (
                upgradeOffers.map(o => (
                  <OfferCard key={o.id} offer={o} onEdit={openEdit} onDelete={handleDelete} deleting={deleting} />
                ))
              )}
            </Card>
          )}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingOffer ? `Edit Offer — ${tabDef?.label}` : `New ${tabDef?.label} Offer`}
        size="lg"
      >
        <OfferForm
          offer={editingOffer}
          activeTab={activeTab}
          onSave={handleSave}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}
