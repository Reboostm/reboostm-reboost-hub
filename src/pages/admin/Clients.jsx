import { useEffect, useState } from 'react'
import {
  Users, Loader2, Search, ChevronDown, ChevronUp,
  BookOpen, Star, TrendingUp, Calendar, Sparkles, Image,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { getAllUsers } from '../../services/firestore'
import { formatDate, getInitials } from '../../utils/helpers'

const TOOL_FLAGS = [
  { key: 'citations',     label: 'Citations',    icon: BookOpen,  check: u => !!u.purchases?.citationsPackageId },
  { key: 'reviews',       label: 'Reviews',      icon: Star,      check: u => u.subscriptions?.reviewManager?.active },
  { key: 'rankTracker',   label: 'Rank Tracker', icon: TrendingUp,check: u => u.subscriptions?.rankTracker?.active },
  { key: 'scheduler',     label: 'Scheduler',    icon: Calendar,  check: u => u.subscriptions?.scheduler?.active },
  { key: 'aiCreator',     label: 'AI Creator',   icon: Sparkles,  check: u => u.subscriptions?.scheduler?.tier === 'pro' },
  { key: 'calendar',      label: 'Calendar',     icon: Image,     check: u => (u.purchases?.calendarNiches || []).length > 0 },
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

function ClientRow({ u }) {
  const [open, setOpen] = useState(false)
  const activeCount = TOOL_FLAGS.filter(f => f.check(u)).length

  return (
    <>
      <div
        className="flex items-center gap-4 px-5 py-4 hover:bg-hub-input/30 transition-colors cursor-pointer"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-9 h-9 rounded-full bg-hub-blue/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-hub-blue">{getInitials(u.displayName || u.email)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-hub-text truncate">{u.displayName || u.email}</p>
          <p className="text-xs text-hub-text-muted truncate">
            {[u.businessName, u.city && u.state ? `${u.city}, ${u.state}` : u.city || u.state].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <p className="text-xs text-hub-text-muted hidden md:block">{formatDate(u.createdAt)}</p>
          <Badge variant={activeCount > 0 ? 'success' : 'gray'}>
            {activeCount} tool{activeCount !== 1 ? 's' : ''}
          </Badge>
          {open
            ? <ChevronUp className="w-4 h-4 text-hub-text-muted" />
            : <ChevronDown className="w-4 h-4 text-hub-text-muted" />
          }
        </div>
      </div>

      {open && (
        <div className="px-5 pb-4 bg-hub-input/20 border-t border-hub-border/50">
          <div className="pt-3 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {TOOL_FLAGS.map(({ key, label, icon: Icon, check }) => (
                <ToolChip key={key} active={check(u)} label={label} Icon={Icon} />
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-hub-text-muted">
              {u.email    && <span><strong className="text-hub-text">Email:</strong> {u.email}</span>}
              {u.phone    && <span><strong className="text-hub-text">Phone:</strong> {u.phone}</span>}
              {u.website  && <span><strong className="text-hub-text">Site:</strong> {u.website}</span>}
              {u.niche    && <span><strong className="text-hub-text">Niche:</strong> {u.niche}</span>}
              {u.purchases?.citationsPackageId && (
                <span><strong className="text-hub-text">Citations tier:</strong> {u.purchases.citationsPackageId.replace('citations_', '')}</span>
              )}
              {u.purchases?.leadCredits > 0 && (
                <span><strong className="text-hub-text">Lead credits:</strong> {u.purchases.leadCredits}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminClients() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
          <Users className="w-8 h-8 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text-muted text-sm">{search ? 'No clients match your search.' : 'No client accounts yet.'}</p>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-hub-border">
            {filtered.map(u => <ClientRow key={u.id} u={u} />)}
          </div>
        </Card>
      )}
    </div>
  )
}
