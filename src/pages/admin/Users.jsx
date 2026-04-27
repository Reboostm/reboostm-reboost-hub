import { useEffect, useState } from 'react'
import { Shield, Loader2, RotateCcw, ChevronDown, CheckCircle, AlertTriangle, Search } from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { getAllUsers } from '../../services/firestore'
import { setUserRole, resetUserPassword } from '../../services/functions'
import { formatDate, getInitials } from '../../utils/helpers'
import { useToast } from '../../hooks/useToast'

const ROLE_OPTS = ['client', 'staff', 'admin']
const ROLE_VARIANTS = { admin: 'error', staff: 'warning', client: 'info' }

function RoleDropdown({ userId, currentRole, onChanged }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const change = async (newRole) => {
    if (newRole === currentRole) { setOpen(false); return }
    setSaving(true)
    setOpen(false)
    try {
      await setUserRole({ targetUid: userId, role: newRole })
      toast(`Role updated to ${newRole}`, 'success')
      onChanged(userId, newRole)
    } catch (err) {
      toast(err.message || 'Failed to update role', 'error')
    } finally {
      setSaving(false)
    }
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
            <button
              key={r}
              onClick={() => change(r)}
              className={`w-full text-left px-3 py-2 text-xs capitalize transition-colors ${
                r === currentRole
                  ? 'bg-hub-blue/10 text-hub-blue font-medium'
                  : 'text-hub-text hover:bg-hub-input'
              }`}
            >
              {r}
            </button>
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
    <button
      onClick={handleReset}
      disabled={status !== 'idle'}
      title="Generate & copy password reset link"
      className="flex items-center gap-1.5 text-xs text-hub-text-muted hover:text-hub-blue transition-colors disabled:opacity-50"
    >
      {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {status === 'done'    && <CheckCircle className="w-3.5 h-3.5 text-hub-green" />}
      {status === 'idle'    && <RotateCcw className="w-3.5 h-3.5" />}
      <span className="hidden sm:inline">
        {status === 'done' ? 'Copied!' : 'Reset'}
      </span>
    </button>
  )
}

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAllUsers().then(setUsers).finally(() => setLoading(false))
  }, [])

  const handleRoleChanged = (uid, newRole) => {
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role: newRole } : u))
  }

  const filtered = search.trim()
    ? users.filter(u =>
        (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.businessName || '').toLowerCase().includes(search.toLowerCase())
      )
    : users

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">All Users</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">{users.length} total</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-hub-text-muted" />
        <input
          type="text"
          placeholder="Search by name, email, or business…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-hub-input border border-hub-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="text-center py-12">
          <Shield className="w-8 h-8 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text-muted text-sm">{search ? 'No users match your search.' : 'No users yet.'}</p>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-hub-border">
            {filtered.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-9 h-9 rounded-full bg-hub-blue/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-hub-blue">{getInitials(u.displayName || u.email)}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-hub-text truncate">{u.displayName || '—'}</p>
                  <p className="text-xs text-hub-text-muted truncate">{u.email}</p>
                  {u.businessName && (
                    <p className="text-[10px] text-hub-text-muted truncate mt-0.5">{u.businessName}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <p className="text-[10px] text-hub-text-muted hidden md:block">
                    {formatDate(u.createdAt)}
                  </p>
                  <ResetButton email={u.email} />
                  <RoleDropdown userId={u.id} currentRole={u.role || 'client'} onChanged={handleRoleChanged} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
