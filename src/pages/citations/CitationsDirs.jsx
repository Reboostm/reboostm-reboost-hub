import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Search, ExternalLink, CheckCircle, Clock, AlertCircle,
  XCircle, Minus, Loader2, List, Play, ChevronRight, ArrowLeft,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import {
  subscribeToCitationsBatches,
  subscribeToCitationsDirectories,
} from '../../services/firestore'
import CitationsPackageBar from '../../components/citations/CitationsPackageBar'
import { cn } from '../../utils/cn'

const STATUS_CONFIG = {
  live:      { label: 'Live',      variant: 'success', icon: CheckCircle, color: 'text-hub-green'  },
  submitted: { label: 'Submitted', variant: 'info',    icon: Clock,       color: 'text-hub-blue'   },
  pending:   { label: 'Pending',   variant: 'warning', icon: Clock,       color: 'text-hub-yellow' },
  failed:    { label: 'Failed',    variant: 'error',   icon: XCircle,     color: 'text-hub-red'    },
  skipped:   { label: 'Skipped',   variant: 'gray',    icon: Minus,       color: 'text-hub-text-muted' },
}

const FILTER_TABS = [
  { key: 'all',      label: 'All'       },
  { key: 'live',     label: 'Live'      },
  { key: 'submitted',label: 'Submitted' },
  { key: 'pending',  label: 'Pending'   },
  { key: 'failed',   label: 'Failed'    },
  { key: 'skipped',  label: 'Skipped'   },
]

function formatDate(ts) {
  if (!ts) return null
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function CitationsDirs() {
  const { hasCitations } = useBilling()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [dirs, setDirs] = useState([])
  const [dirsLoading, setDirsLoading] = useState(false)
  const [selectedBatchId, setSelectedBatchId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Load batches
  useEffect(() => {
    if (!userProfile?.id) return
    const unsub = subscribeToCitationsBatches(userProfile.id, data => {
      setBatches(data)
      setBatchesLoading(false)
      if (data.length > 0 && !selectedBatchId) {
        setSelectedBatchId(data[0].id)
      }
    })
    return unsub
  }, [userProfile?.id])

  // Load directories for selected batch
  useEffect(() => {
    if (!selectedBatchId) return
    setDirsLoading(true)
    setDirs([])
    const unsub = subscribeToCitationsDirectories(selectedBatchId, data => {
      setDirs(data)
      setDirsLoading(false)
    })
    return unsub
  }, [selectedBatchId])

  if (!hasCitations) return <ToolGate tool="citations" />

  const filtered = useMemo(() => {
    let list = dirs
    if (filter !== 'all') list = list.filter(d => d.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.name?.toLowerCase().includes(q) || d.url?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q)
      )
    }
    return list
  }, [dirs, filter, search])

  const counts = useMemo(() => {
    const c = { all: dirs.length, live: 0, submitted: 0, pending: 0, failed: 0, skipped: 0 }
    dirs.forEach(d => { if (c[d.status] !== undefined) c[d.status]++ })
    return c
  }, [dirs])

  const selectedBatch = batches.find(b => b.id === selectedBatchId)

  return (
    <div className="p-6 max-w-5xl">
      {/* Back button */}
      <Button variant="secondary" size="sm" onClick={() => navigate('/citations')} className="mb-5">
        <ArrowLeft className="w-4 h-4" /> Back to Citations
      </Button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">My Directories</h1>
          <p className="text-hub-text-secondary text-sm mt-1">
            All directories your business has been submitted to.
          </p>
        </div>
      </div>

      <CitationsPackageBar />

      {batchesLoading ? (
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </Card>
      ) : batches.length === 0 ? (
        <Card className="text-center py-14">
          <List className="w-10 h-10 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text font-semibold mb-1">No directories yet</p>
          <p className="text-hub-text-secondary text-sm mb-5 max-w-xs mx-auto">
            Start a submission job and directories will populate here in real time.
          </p>
          <Link to="/citations">
            <Button>
              <Play className="w-4 h-4" />
              Start a Job
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          {/* Batch selector (if multiple jobs) */}
          {batches.length > 1 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-hub-text-muted">Job:</span>
              {batches.map(b => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBatchId(b.id)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                    b.id === selectedBatchId
                      ? 'bg-hub-blue/10 border-hub-blue/40 text-hub-blue'
                      : 'bg-hub-input border-hub-border text-hub-text-secondary hover:border-hub-blue/30'
                  )}
                >
                  {b.total || 0} dirs · {formatDate(b.createdAt) || 'Recent'} — {b.live || 0}/{b.total || 0} live
                </button>
              ))}
            </div>
          )}

          {/* Job progress mini-bar */}
          {selectedBatch && (
            <div className="mb-4 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-hub-input rounded-full overflow-hidden">
                <div
                  className="h-full bg-hub-green rounded-full transition-all"
                  style={{
                    width: `${Math.round(((selectedBatch.live || 0) / (selectedBatch.total || 1)) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-xs text-hub-text-secondary whitespace-nowrap">
                {selectedBatch.live || 0} / {selectedBatch.total || 0} live
              </span>
              {selectedBatch.status === 'running' && (
                <span className="flex items-center gap-1 text-xs text-hub-blue">
                  <span className="w-1.5 h-1.5 rounded-full bg-hub-blue animate-pulse" />
                  Running
                </span>
              )}
            </div>
          )}

          {/* Filter tabs + search */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1 bg-hub-input border border-hub-border rounded-lg p-1 flex-wrap">
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'text-xs px-3 py-1.5 rounded-md transition-colors font-medium',
                    filter === tab.key
                      ? 'bg-hub-card text-hub-text shadow-sm'
                      : 'text-hub-text-muted hover:text-hub-text'
                  )}
                >
                  {tab.label}
                  {counts[tab.key] > 0 && (
                    <span className="ml-1.5 text-hub-text-muted font-normal">
                      {counts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-[180px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-hub-text-muted" />
              <input
                type="text"
                placeholder="Search directories…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-hub-input border border-hub-border rounded-lg pl-8 pr-3 py-2 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
              />
            </div>
          </div>

          {/* Directory list */}
          {dirsLoading ? (
            <Card className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
            </Card>
          ) : filtered.length === 0 ? (
            <Card className="text-center py-10">
              <p className="text-hub-text-muted text-sm">No directories match your filter.</p>
            </Card>
          ) : (
            <Card padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hub-border">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-hub-text-muted uppercase tracking-wide">
                        Directory
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-hub-text-muted uppercase tracking-wide hidden sm:table-cell">
                        Category
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-hub-text-muted uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-hub-text-muted uppercase tracking-wide hidden md:table-cell">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hub-border">
                    {filtered.map(dir => {
                      const cfg = STATUS_CONFIG[dir.status] || STATUS_CONFIG.pending
                      const Icon = cfg.icon
                      const dateVal = dir.liveAt || dir.submittedAt
                      return (
                        <tr key={dir.id} className="hover:bg-hub-input/30 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded bg-hub-input border border-hub-border flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-hub-text-muted">
                                  {(dir.name || '?').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-hub-text font-medium truncate max-w-[180px]">
                                  {dir.name}
                                </p>
                                <a
                                  href={dir.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-hub-text-muted hover:text-hub-blue flex items-center gap-1 truncate max-w-[180px]"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {dir.url?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                </a>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className="text-xs text-hub-text-secondary bg-hub-input rounded-full px-2 py-0.5">
                              {dir.category || 'General'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Icon className={cn('w-3.5 h-3.5', cfg.color)} />
                              <Badge variant={cfg.variant}>{cfg.label}</Badge>
                            </div>
                            {dir.errorMessage && (
                              <p className={cn(
                                'text-xs mt-0.5 truncate max-w-[160px]',
                                dir.status === 'failed' ? 'text-hub-red' : 'text-hub-text-muted'
                              )}>
                                {dir.errorMessage}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-3 text-right hidden md:table-cell">
                            <span className="text-xs text-hub-text-muted">
                              {formatDate(dateVal) || '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 border-t border-hub-border">
                <p className="text-xs text-hub-text-muted">
                  Showing {filtered.length} of {dirs.length} directories
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
