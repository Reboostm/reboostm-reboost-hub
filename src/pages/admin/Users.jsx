import { useEffect, useState } from 'react'
import {
  Users, Loader2, RotateCcw, ChevronDown, ChevronUp, CheckCircle,
  Search, UserPlus, BookOpen, Star, TrendingUp,
  Calendar, Sparkles, Image, Settings2, Trash2,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Modal from '../../components/ui/Modal'
import { getAllUsers } from '../../services/firestore'
import { setUserRole, resetUserPassword, adminCreateUser, adminUpdateAccess, adminDeleteUser } from '../../services/functions'
import { formatDate, getInitials } from '../../utils/helpers'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../hooks/useAuth'
import { NICHES } from '../../config'

const ROLE_OPTS = ['client', 'staff', 'admin']
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

function RoleDropdown({ userId, currentRole, onChanged }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const change = async (newRole) => {
    if (newRole === currentRole) { setOpen(false); return }
    setSaving(true); setOpen(false)
    try {
      await setUserRole({ targetUid: userId, role: newRole })
      toast(`Role updated to ${newRole}`, 'success')
      onChanged(userId, newRole)
    } catch (err) {
      toast(err.message || 'Failed to update role', 'error')
    } finally { setSaving(false) }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className="flex items-center gap-1.5 text-xs bg-hub-input border border-hub-border rounded-md px-2.5 py-1.5 text-hub-text hover:border-hub-blue/40 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : (
          <span className={`w-1.5 h-1.5 rounded-full inline-block ${
            currentRole === 'admin' ? 'bg-hub-orange' :
            currentRole === 'staff' ? 'bg-hub-blue' : 'bg-hub-green'
          }`} />
        )}
        <span className="capitalize">{currentRole}</span>
        <ChevronDown className="w-3 h-3 text-hub-text-muted" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-28 bg-hub-card border border-hub-border rounded-lg shadow-lg z-10 overflow-hidden">
          {ROLE_OPTS.map(r => (
            <button key={r} onClick={() => change(r)}
              className={`w-full text-left px-3 py-2 text-xs capitalize transition-colors ${
                r === currentRole ? 'bg-hub-blue/10 text-hub-blue font-medium' : 'text-hub-text hover:bg-hub-input'
              }`}
            >{r}</button>
          ))}
        </div>
      )}
    </div>
  )
}

function ResetButton({ email }) {
  const [status, setStatus] = useState('idle')
  const { toast } = useToast()

  const handleReset = async () => {
    if (!email) return
    setStatus('loading')
    try {
      const { link } = await resetUserPassword({ email })
      await navigator.clipboard.writeText(link)
      toast('Reset link copied to clipboard', 'success')
      setStatus('done')
      setTimeout(() => setStatus('idle'), 3000)
    } catch (err) {
      toast(err.message || 'Failed to generate reset link', 'error')
      setStatus('idle')
    }
  }

  return (
    <button onClick={handleReset} disabled={status !== 'idle'}
      title="Generate & copy password reset link"
      className="flex items-center gap-1.5 text-xs text-hub-text-muted hover:text-hub-blue transition-colors disabled:opacity-50"
    >
      {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === 'done'    && <CheckCircle className="w-3.5 h-3.5 text-hub-green" />}
      {status === 'idle'    && <RotateCcw className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">{status === 'done' ? 'Copied!' : 'Reset'}</span>
    </button>
  )
}

function ManageAccessModal({ user, isOpen, onClose, onUpdated }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [citationsTier, setCitationsTier] = useState(user.purchases?.citationsPackageId || '')
  const [leadCredits, setLeadCredits] = useState(user.purchases?.leadCredits ?? 0)
  const [outreachTemplates, setOutreachTemplates] = useState(user.purchases?.outreachTemplates ?? false)
  const [calendarNiches, setCalendarNiches] = useState(user.purchases?.calendarNiches ?? [])
  const [schedulerActive, setSchedulerActive] = useState(user.subscriptions?.scheduler?.active ?? false)
  const [schedulerTier, setSchedulerTier] = useState(user.subscriptions?.scheduler?.tier || 'basic')
  const [reviewsActive, setReviewsActive] = useState(user.subscriptions?.reviewManager?.active ?? false)
  const [rankActive, setRankActive] = useState(user.subscriptions?.rankTracker?.active ?? false)

  function toggleNiche(niche) {
    setCalendarNiches(prev => prev.includes(niche) ? prev.filter(n => n !== niche) : [...prev, niche])
  }

  async function handleSave() {
    setSaving(true)
    try {
      await adminUpdateAccess({
        targetUid: user.id,
        purchases: { citationsPackageId: citationsTier || null, leadCredits: Number(leadCredits), outreachTemplates, calendarNiches },
        subscriptions: { scheduler: { active: schedulerActive, tier: schedulerTier }, reviewManager: { active: reviewsActive }, rankTracker: { active: rankActive } },
      })
      const updated = {
        ...user,
        purchases: { ...user.purchases, citationsPackageId: citationsTier || null, leadCredits: Number(leadCredits), outreachTemplates, calendarNiches },
        subscriptions: { ...user.subscriptions, scheduler: { ...(user.subscriptions?.scheduler || {}), active: schedulerActive, tier: schedulerTier }, reviewManager: { ...(user.subscriptions?.reviewManager || {}), active: reviewsActive }, rankTracker: { ...(user.subscriptions?.rankTracker || {}), active: rankActive } },
      }
      toast('Access updated.', 'success')
      onUpdated(updated)
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to save.', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Manage Access — ${user.displayName || user.email}`} size="lg"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={handleSave}>Save Changes</Button></>}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-hub-text-muted uppercase tracking-wider mb-3">One-Time Purchases</h3>
          <div className="space-y-4">
            <Select label="Citations Package" value={citationsTier} onChange={e => setCitationsTier(e.target.value)} options={CITATION_TIERS} />
            <div>
              <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">Lead Credits</label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setLeadCredits(v => Math.max(0, Number(v) - 1))} className="w-8 h-8 rounded-lg bg-hub-input border border-hub-border text-hub-text hover:bg-hub-card transition-colors font-bold">−</button>
                <input type="number" min="0" value={leadCredits} onChange={e => setLeadCredits(Math.max(0, parseInt(e.target.value, 10) || 0))} className="w-20 bg-hub-input border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text text-center focus:outline-none focus:border-hub-blue" />
                <button type="button" onClick={() => setLeadCredits(v => Number(v) + 1)} className="w-8 h-8 rounded-lg bg-hub-input border border-hub-border text-hub-text hover:bg-hub-card transition-colors font-bold">+</button>
                <div className="flex gap-1.5 ml-2">{[5, 10, 25, 50].map(n => <button key={n} type="button" onClick={() => setLeadCredits(n)} className="text-xs px-2 py-1 rounded bg-hub-input border border-hub-border text-hub-text-muted hover:text-hub-blue hover:border-hub-blue transition-colors">{n}</button>)}</div>
              </div>
              <p className="text-[11px] text-hub-text-muted mt-1">1 credit = 1 lead search (up to 20 leads)</p>
            </div>
            <div className="flex items-center justify-between py-2 border-t border-hub-border/50">
              <div><p className="text-sm text-hub-text">Outreach Templates</p><p className="text-xs text-hub-text-muted">3-email cold outreach sequence access</p></div>
              <Toggle checked={outreachTemplates} onChange={setOutreachTemplates} />
            </div>
            <div className="border-t border-hub-border/50 pt-3">
              <p className="text-sm text-hub-text mb-2">Content Calendar Niches</p>
              <p className="text-xs text-hub-text-muted mb-3">Toggle which niches this client has access to</p>
              <div className="flex flex-wrap gap-1.5">{NICHES.map(n => <button key={n.value} type="button" onClick={() => toggleNiche(n.value)} className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${calendarNiches.includes(n.value) ? 'bg-hub-blue/10 border-hub-blue text-hub-blue' : 'bg-hub-input border-hub-border text-hub-text-muted hover:text-hub-text'}`}>{n.label}</button>)}</div>
            </div>
          </div>
        </div>
        <div className="border-t border-hub-border pt-5">
          <h3 className="text-xs font-semibold text-hub-text-muted uppercase tracking-wider mb-3">Monthly Subscriptions</h3>
          <div className="space-y-3">
            <div className="p-3 rounded-xl border border-hub-border bg-hub-card">
              <div className="flex items-center justify-between mb-2"><p className="text-sm font-medium text-hub-text">Content Scheduler</p><Toggle checked={schedulerActive} onChange={setSchedulerActive} /></div>
              {schedulerActive && <Select value={schedulerTier} onChange={e => setSchedulerTier(e.target.value)} options={SCHEDULER_TIERS} />}
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-hub-border bg-hub-card">
              <div><p className="text-sm font-medium text-hub-text">Review Manager</p><p className="text-xs text-hub-text-muted">Google + Yelp reviews</p></div>
              <Toggle checked={reviewsActive} onChange={setReviewsActive} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl border border-hub-border bg-hub-card">
              <div><p className="text-sm font-medium text-hub-text">Local Rank Tracker</p><p className="text-xs text-hub-text-muted">Weekly keyword tracking</p></div>
              <Toggle checked={rankActive} onChange={setRankActive} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function CreateUserModal({ isOpen, onClose, onCreated }) {
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const isAdmin = userProfile?.role === 'admin'

  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState('client')
  const [saving, setSaving] = useState(false)

  const roleOptions = isAdmin
    ? [{ value: 'client', label: 'Client' }, { value: 'staff', label: 'Staff' }, { value: 'admin', label: 'Admin' }]
    : [{ value: 'client', label: 'Client' }]

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { toast('Email is required.', 'error'); return }
    setSaving(true)
    try {
      const result = await adminCreateUser({ email: email.trim(), displayName: displayName.trim(), role, sendInvite: true })
      toast(`Invite sent to ${email}. They'll receive an email to set their password.`, 'success')
      onCreated({ id: result.uid, email: email.trim(), displayName: displayName.trim(), role, createdAt: new Date() })
      setEmail(''); setDisplayName(''); setRole('client')
      onClose()
    } catch (err) {
      toast(err.message || 'Failed to create user.', 'error')
    } finally { setSaving(false) }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New User" size="sm"
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button loading={saving} onClick={handleSubmit}>Send Invite</Button></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="client@example.com" required />
        <Input label="Display name (optional)" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="First Last" />
        <Select label="Role" value={role} onChange={e => setRole(e.target.value)} options={roleOptions} />
        {role !== 'client' && <p className="text-xs text-hub-yellow bg-hub-yellow/10 border border-hub-yellow/20 rounded-lg px-3 py-2">{role === 'admin' ? 'Admin accounts have full access and can see all data.' : 'Staff accounts bypass all ToolGates and can manage clients.'}</p>}
        <p className="text-xs text-hub-text-muted bg-hub-input border border-hub-border rounded-lg px-3 py-2">
          An invite email will be sent automatically. The client clicks the link to set their own password.
        </p>
      </form>
    </Modal>
  )
}

function UserRow({ u, onUpdated, onRoleChanged, onDeleted }) {
  const [open, setOpen] = useState(false)
  const [showAccess, setShowAccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [userData, setUserData] = useState(u)
  const activeCount = TOOL_FLAGS.filter(f => f.check(userData)).length
  const isClient = userData.role === 'client'
  const { toast } = useToast()

  const handleUpdated = (updated) => setUserData(updated)
  const handleRoleChanged = (uid, newRole) => {
    setUserData(prev => ({ ...prev, role: newRole }))
    onRoleChanged(uid, newRole)
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm(`Delete ${userData.displayName || userData.email}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await adminDeleteUser({ targetUid: userData.id })
      toast('User deleted.', 'success')
      onDeleted(userData.id)
    } catch (err) {
      toast(err.message || 'Failed to delete user.', 'error')
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 px-5 py-4 hover:bg-hub-input/30 transition-colors cursor-pointer" onClick={() => isClient && setOpen(o => !o)}>
        <div className="w-9 h-9 rounded-full bg-hub-blue/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-hub-blue">{getInitials(userData.displayName || userData.email)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-hub-text truncate">{userData.displayName || userData.email}</p>
          <p className="text-xs text-hub-text-muted truncate">{[userData.businessName, userData.city && userData.state ? `${userData.city}, ${userData.state}` : userData.city || userData.state].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <p className="text-xs text-hub-text-muted hidden md:block">{formatDate(userData.createdAt)}</p>
          <ResetButton email={userData.email} />
          <RoleDropdown userId={userData.id} currentRole={userData.role || 'client'} onChanged={handleRoleChanged} />
          {isClient && (
            <>
              <Button size="sm" variant="secondary" onClick={e => { e.stopPropagation(); setShowAccess(true) }}>
                <Settings2 className="w-3.5 h-3.5 mr-1" /> Manage
              </Button>
              {open ? <ChevronUp className="w-4 h-4 text-hub-text-muted" /> : <ChevronDown className="w-4 h-4 text-hub-text-muted" />}
            </>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            title="Delete user"
            className="p-1.5 rounded-md text-hub-text-muted hover:text-hub-red hover:bg-hub-red/10 transition-colors disabled:opacity-40"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isClient && open && (
        <div className="px-5 pb-4 bg-hub-input/20 border-t border-hub-border/50">
          <div className="pt-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">{TOOL_FLAGS.map(({ key, label, icon: Icon, check }) => <ToolChip key={key} active={check(userData)} label={label} Icon={Icon} />)}</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-hub-text-muted">
              {userData.email && <span><strong className="text-hub-text">Email:</strong> {userData.email}</span>}
              {userData.phone && <span><strong className="text-hub-text">Phone:</strong> {userData.phone}</span>}
              {userData.website && <span><strong className="text-hub-text">Site:</strong> {userData.website}</span>}
              {userData.niche && <span><strong className="text-hub-text">Niche:</strong> {userData.niche}</span>}
              {userData.purchases?.citationsPackageId && <span><strong className="text-hub-text">Citations:</strong> {userData.purchases.citationsPackageId.replace('citations_', '')}</span>}
              {(userData.purchases?.leadCredits || 0) > 0 && <span><strong className="text-hub-text">Lead credits:</strong> {userData.purchases.leadCredits}</span>}
            </div>
          </div>
        </div>
      )}

      {showAccess && isClient && <ManageAccessModal user={userData} isOpen={showAccess} onClose={() => setShowAccess(false)} onUpdated={handleUpdated} />}
    </>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    getAllUsers().then(setUsers).finally(() => setLoading(false))
  }, [])

  const handleRoleChanged = (uid, newRole) => setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u))
  const handleCreated = (newUser) => setUsers(prev => [newUser, ...prev])
  const handleDeleted = (uid) => setUsers(prev => prev.filter(u => u.id !== uid))

  const filtered = users.filter(u => {
    const matchesSearch = search.trim() === '' || (
      (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.businessName || '').toLowerCase().includes(search.toLowerCase())
    )
    const matchesRole = roleFilter === '' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">All Users</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">{users.length} total</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Create User
        </Button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-muted" />
          <input type="text" placeholder="Search by name, email, or business…" value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-hub-input border border-hub-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2.5 rounded-lg bg-hub-input border border-hub-border text-sm text-hub-text focus:outline-none focus:border-hub-blue">
          <option value="">All roles</option>
          <option value="client">Clients</option>
          <option value="staff">Staff</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" /></div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-8 h-8 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text-muted text-sm">{search || roleFilter ? 'No users match your filters.' : 'No users yet.'}</p>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-hub-border">
            {filtered.map(u => <UserRow key={u.id} u={u} onUpdated={() => {}} onRoleChanged={handleRoleChanged} onDeleted={handleDeleted} />)}
          </div>
        </Card>
      )}

      <CreateUserModal isOpen={showCreate} onClose={() => setShowCreate(false)} onCreated={handleCreated} />
    </div>
  )
}
