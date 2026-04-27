import { useEffect, useState } from 'react'
import {
  Users, Loader2, Search, ChevronDown, ChevronUp,
  BookOpen, Star, TrendingUp, Calendar, Sparkles, Image,
  Settings2,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import { getAllUsers } from '../../services/firestore'
import { adminUpdateAccess } from '../../services/functions'
import { formatDate, getInitials } from '../../utils/helpers'
import { useToast } from '../../hooks/useToast'
import { NICHES } from '../../config'

const TOOL_FLAGS = [
  { key: 'citations',   label: 'Citations',    icon: BookOpen,   check: u => !!u.purchases?.citationsPackageId },
  { key: 'leads',       label: 'Leads',        icon: Users,      check: u => (u.purchases?.leadCredits || 0) > 0 },
  { key: 'reviews',     label: 'Reviews',      icon: Star,       check: u => u.subscriptions?.reviewManager?.active },
  { key: 'rankTracker', label: 'Rank Tracker', icon: TrendingUp, check: u => u.subscriptions?.rankTracker?.active },
  { key: 'scheduler',   label: 'Scheduler',    icon: Calendar,   check: u => u.subscriptions?.scheduler?.active },
  { key: 'aiCreator',   label: 'AI Creator',   icon: Sparkles,   check: u => u.subscriptions?.scheduler?.tier === 'pro' },
  { key: 'calendar',    label: 'Calendar',     icon: Image,      check: u => (u.purchases?.calendarNiches || []).length > 0 },
]

const CITATION_TIERS = [
  { value: '',                   label: 'None' },
  { value: 'citations_starter',  label: 'Starter (100 dirs)' },
  { value: 'citations_pro',      label: 'Pro (200 dirs)' },
  { value: 'citations_premium',  label: 'Premium (300 dirs)' },
]

const SCHEDULER_TIERS = [
  { value: 'basic', label: 'Basic' },
  { value: 'pro',   label: 'Pro (includes AI Creator)' },
]

function ToolChip({ active, label, Icon }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border ${
      active
        ? 'bg-hub-green/10 border-hub-green/25 text-hub-green'
        : 'bg-hub-input border-hub-border text-hub-text-muted opacity-50'
    }`}>
      <Icon className="w-2.5 h-2.5" />
      {label}
    </span>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-hub-green' : 'bg-hub-border'}`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      {label && <span className="text-sm text-hub-text">{label}</span>}
    </label>
  )
}

function ManageAccessModal({ user, isOpen, onClose, onUpdated }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  // purchases
  const [citationsTier,    setCitationsTier]    = useState(user.purchases?.citationsPackageId || '')
  const [leadCredits,      setLeadCredits]      = useState(user.purchases?.leadCredits ?? 0)
  const [outreachTemplates,setOutreachTemplates]= useState(user.purchases?.outreachTemplates ?? false)
  const [calendarNiches,   setCalendarNiches]   = useState(user.purchases?.calendarNiches ?? [])

  // subscriptions
  const [schedulerActive, setSchedulerActive] = useState(user.subscriptions?.scheduler?.active ?? false)
  const [schedulerTier,   setSchedulerTier]   = useState(user.subscriptions?.scheduler?.tier || 'basic')
  const [reviewsActive,   setReviewsActive]   = useState(user.subscriptions?.reviewManager?.active ?? false)
  const [rankActive,      setRankActive]      = useState(user.subscriptions?.rankTracker?.active ?? false)

  function toggleNiche(niche) {
    setCalendarNiches(prev =>
      prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche]
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      await adminUpdateAccess({
        targetUid: user.id,
        purchases: {
          citationsPackageId: citationsTier || null,
          leadCredits: Number(leadCredits),
          outreachTemplates,
          calendarNiches,
        },
        subscriptions: {
          scheduler:     { active: schedulerActive, tier: schedulerTier },
          reviewManager: { active: reviewsActive },
          rankTracker:   { active: rankActive },
        },
      })

      // Build updated user object for local state
      const updated = {
        ...user,
        purchases: { ...user.purchases, citationsPackageId: citationsTier || null, leadCredits: Number(leadCredits), outreachTemplates, calendarNiches },
        subscriptions: {
          ...user.subscriptions,
          scheduler:     { ...(user.subscriptions?.scheduler || {}),     active: schedulerActive, tier: schedulerTier },
          reviewManager: { ...(user.subscriptions?.reviewManager || {}), active: reviewsActive },
          rankTracker:   { ...(user.subscriptions?.rankTracker || {}),   active: rankActive },
        },
      }
      toast('Access updated.', 'success')
      onUpdated(updated)
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to save.', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Access — ${user.displayName || user.email}`}
      size="lg"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button loading={saving} onClick={handleSave}>Save Changes</Button>
      </>}
    >
      <div className="space-y-6">

        {/* One-time purchases */}
        <div>
          <h3 className="text-xs font-semibold text-hub-text-muted uppercase tracking-wider mb-3">One-Time Purchases</h3>
          <div className="space-y-4">

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Select
                  label="Citations Package"
                  value={citationsTier}
                  onChange={e => setCitationsTier(e.target.value)}
                  options={CITATION_TIERS}
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">Lead Credits</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLeadCredits(v => Math.max(0, Number(v) - 1))}
                    className="w-8 h-8 rounded-lg bg-hub-input border border-hub-border text-hub-text hover:bg-hub-card transition-colors font-bold"
                  >−</button>
                  <input
                    type="number"
                    min="0"
                    value={leadCredits}
                    onChange={e => setLeadCredits(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-20 bg-hub-input border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text text-center focus:outline-none focus:border-hub-blue"
                  />
                  <button
                    type="button"
                    onClick={() => setLeadCredits(v => Number(v) + 1)}
                    className="w-8 h-8 rounded-lg bg-hub-input border border-hub-border text-hub-text hover:bg-hub-card transition-colors font-bold"
                  >+</button>
                  <div className="flex gap-1.5 ml-2">
                    {[5, 10, 25, 50].map(n => (
                      <button key={n} type="button" onClick={() => setLeadCredits(n)}
                        className="text-xs px-2 py-1 rounded bg-hub-input border border-hub-border text-hub-text-muted hover:text-hub-blue hover:border-hub-blue transition-colors">
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-hub-text-muted mt-1">1 credit = 1 lead search (up to 20 leads)</p>
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-hub-border/50">
              <div>
                <p className="text-sm text-hub-text">Outreach Templates</p>
                <p className="text-xs text-hub-text-muted">3-email cold outreach sequence access</p>
              </div>
              <Toggle checked={outreachTemplates} onChange={setOutreachTemplates} />
            </div>

            <div className="border-t border-hub-border/50 pt-3">
              <p className="text-sm text-hub-text mb-2">Content Calendar Niches</p>
              <p className="text-xs text-hub-text-muted mb-3">Toggle which niches this client has access to</p>
              <div className="flex flex-wrap gap-1.5">
                {NICHES.map(n => (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => toggleNiche(n.value)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
                      calendarNiches.includes(n.value)
                        ? 'bg-hub-blue/10 border-hub-blue text-hub-blue'
                        : 'bg-hub-input border-hub-border text-hub-text-muted hover:text-hub-text'
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Monthly subscriptions */}
        <div className="border-t border-hub-border pt-5">
          <h3 className="text-xs font-semibold text-hub-text-muted uppercase tracking-wider mb-3">Monthly Subscriptions</h3>
          <div className="space-y-3">

            <div className="p-3 rounded-xl border border-hub-border bg-hub-card">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-hub-text">Content Scheduler</p>
                <Toggle checked={schedulerActive} onChange={setSchedulerActive} />
              </div>
              {schedulerActive && (
                <Select
                  value={schedulerTier}
                  onChange={e => setSchedulerTier(e.target.value)}
                  options={SCHEDULER_TIERS}
                />
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-hub-border bg-hub-card">
              <div>
                <p className="text-sm font-medium text-hub-text">Review Manager</p>
                <p className="text-xs text-hub-text-muted">Google + Yelp reviews</p>
              </div>
              <Toggle checked={reviewsActive} onChange={setReviewsActive} />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-hub-border bg-hub-card">
              <div>
                <p className="text-sm font-medium text-hub-text">Local Rank Tracker</p>
                <p className="text-xs text-hub-text-muted">Weekly keyword tracking</p>
              </div>
              <Toggle checked={rankActive} onChange={setRankActive} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function ClientRow({ u, onUpdated }) {
  const [open, setOpen]           = useState(false)
  const [showAccess, setShowAccess] = useState(false)
  const [userData, setUserData]   = useState(u)
  const activeCount = TOOL_FLAGS.filter(f => f.check(userData)).length

  const handleUpdated = (updated) => setUserData(updated)

  return (
    <>
      <div className="flex items-center gap-4 px-5 py-4 hover:bg-hub-input/30 transition-colors cursor-pointer"
        onClick={() => setOpen(o => !o)}>
        <div className="w-9 h-9 rounded-full bg-hub-blue/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-hub-blue">{getInitials(userData.displayName || userData.email)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-hub-text truncate">{userData.displayName || userData.email}</p>
          <p className="text-xs text-hub-text-muted truncate">
            {[userData.businessName, userData.city && userData.state ? `${userData.city}, ${userData.state}` : userData.city || userData.state].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-xs text-hub-text-muted hidden md:block">{formatDate(userData.createdAt)}</p>
          <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); setShowAccess(true) }}>
            <Settings2 className="w-3.5 h-3.5 mr-1" /> Manage Access
          </Button>
          <Badge variant={activeCount > 0 ? 'success' : 'gray'}>
            {activeCount} tool{activeCount !== 1 ? 's' : ''}
          </Badge>
          {open ? <ChevronUp className="w-4 h-4 text-hub-text-muted" /> : <ChevronDown className="w-4 h-4 text-hub-text-muted" />}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-4 bg-hub-input/20 border-t border-hub-border/50">
          <div className="pt-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {TOOL_FLAGS.map(({ key, label, icon: Icon, check }) => (
                <ToolChip key={key} active={check(userData)} label={label} Icon={Icon} />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-hub-text-muted">
              {userData.email   && <span><strong className="text-hub-text">Email:</strong> {userData.email}</span>}
              {userData.phone   && <span><strong className="text-hub-text">Phone:</strong> {userData.phone}</span>}
              {userData.website && <span><strong className="text-hub-text">Site:</strong> {userData.website}</span>}
              {userData.niche   && <span><strong className="text-hub-text">Niche:</strong> {userData.niche}</span>}
              {userData.purchases?.citationsPackageId && (
                <span><strong className="text-hub-text">Citations:</strong> {userData.purchases.citationsPackageId.replace('citations_', '')}</span>
              )}
              {(userData.purchases?.leadCredits || 0) > 0 && (
                <span><strong className="text-hub-text">Lead credits:</strong> {userData.purchases.leadCredits}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {showAccess && (
        <ManageAccessModal
          user={userData}
          isOpen={showAccess}
          onClose={() => setShowAccess(false)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  )
}

export default function AdminClients() {
  const [users, setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    getAllUsers('client').then(setUsers).finally(() => setLoading(false))
  }, [])

  const filtered = search.trim()
    ? users.filter(u =>
        (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.businessName || '').toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-hub-text">Clients</h1>
        <p className="text-hub-text-secondary text-sm mt-0.5">{users.length} total</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-muted" />
        <input type="text" placeholder="Search by name, email, or business…"
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-hub-input border border-hub-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-8 h-8 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text-muted text-sm">{search ? 'No clients match.' : 'No client accounts yet.'}</p>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-hub-border">
            {filtered.map(u => <ClientRow key={u.id} u={u} onUpdated={() => {}} />)}
          </div>
        </Card>
      )}
    </div>
  )
}
