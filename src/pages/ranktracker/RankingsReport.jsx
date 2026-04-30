import { useState, useEffect } from 'react'
import { useBilling } from '../../hooks/useBilling'
import { useAuth } from '../../hooks/useAuth'
import ToolGate from '../../components/ui/ToolGate'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useNavigate } from 'react-router-dom'
import { subscribeToKeywords, getRankHistory } from '../../services/firestore'
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, Download, Plus } from 'lucide-react'

function RankChange({ current, previous }) {
  if (current === null) return <span className="text-hub-text-muted text-xs">—</span>
  if (previous === null || current === previous) {
    return <span className="flex items-center gap-1 text-hub-text-muted text-xs"><Minus className="w-3.5 h-3.5" /> New</span>
  }
  const improved = current < previous
  const delta = Math.abs(current - previous)
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${improved ? 'text-hub-green' : 'text-hub-red'}`}>
      {improved ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {delta}
    </span>
  )
}

function RankBadge({ rank }) {
  if (rank === null || rank === undefined) return <Badge variant="gray" size="sm">Not found</Badge>
  if (rank <= 3)  return <Badge variant="success" size="sm">#{rank} Top 3</Badge>
  if (rank <= 10) return <Badge variant="info"    size="sm">#{rank} Page 1</Badge>
  if (rank <= 20) return <Badge variant="warning" size="sm">#{rank} Page 2</Badge>
  return <Badge variant="error" size="sm">#{rank} Deep</Badge>
}

function Sparkline({ history }) {
  if (!history || history.length < 2) return <span className="text-xs text-hub-text-muted">No trend yet</span>
  const ranks = history.map(h => h.rank).filter(r => r !== null)
  if (ranks.length < 2) return <span className="text-xs text-hub-text-muted">No trend yet</span>
  const max = Math.max(...ranks)
  const min = Math.min(...ranks)
  const range = max - min || 1
  const W = 80, H = 24
  const points = ranks.slice(0, 10).reverse().map((r, i) => {
    const x = (i / (ranks.length - 1)) * W
    const y = H - ((r - min) / range) * H
    return `${x},${y}`
  }).join(' ')
  const lastImproved = ranks[0] <= ranks[1]
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={lastImproved ? 'var(--color-hub-green, #22c55e)' : 'var(--color-hub-red, #ef4444)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function RankingsReport() {
  const { hasRankTracker } = useBilling()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [keywords, setKeywords]   = useState([])
  const [histories, setHistories] = useState({})
  const [expanded, setExpanded]   = useState({})

  useEffect(() => {
    if (!user) return
    return subscribeToKeywords(user.uid, setKeywords)
  }, [user])

  async function loadHistory(kwId) {
    if (histories[kwId]) return
    const hist = await getRankHistory(kwId)
    setHistories(prev => ({ ...prev, [kwId]: hist }))
  }

  function toggleExpand(kwId) {
    const willExpand = !expanded[kwId]
    setExpanded(prev => ({ ...prev, [kwId]: willExpand }))
    if (willExpand) loadHistory(kwId)
  }

  function exportCsv() {
    const rows = [
      ['Keyword', 'Domain', 'Location', 'Device', 'Current Rank', 'Previous Rank', 'Change', 'In Map Pack', 'Last Checked'],
      ...keywords.map(kw => {
        const change = (kw.currentRank !== null && kw.previousRank !== null)
          ? kw.previousRank - kw.currentRank : ''
        const lastChecked = kw.lastChecked?.toDate
          ? kw.lastChecked.toDate().toLocaleDateString() : ''
        return [
          kw.keyword, kw.domain,
          `${kw.city}, ${kw.state}`, kw.device,
          kw.currentRank ?? '', kw.previousRank ?? '',
          change, kw.inLocalPack ? 'Yes' : 'No', lastChecked,
        ]
      }),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `rankings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!hasRankTracker) return <ToolGate tool="rankTracker" />

  if (keywords.length === 0) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold text-hub-text mb-6">Rankings Report</h1>
        <Card className="text-center py-12">
          <TrendingUp className="w-10 h-10 text-hub-text-muted mx-auto mb-4 opacity-40" />
          <p className="text-hub-text-secondary text-sm mb-4">No keywords tracked yet.</p>
          <Button onClick={() => navigate('/rank-tracker')}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Keywords
          </Button>
        </Card>
      </div>
    )
  }

  const tracked    = keywords.length
  const checked    = keywords.filter(k => k.currentRank !== null).length
  const inTop10    = keywords.filter(k => k.currentRank !== null && k.currentRank <= 10).length
  const inMapPack  = keywords.filter(k => k.inLocalPack).length
  const avgRank    = checked > 0
    ? Math.round(keywords.filter(k => k.currentRank !== null).reduce((s, k) => s + k.currentRank, 0) / checked)
    : null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Rankings Report</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">
            Track week-over-week Google position changes
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={exportCsv}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tracked',     value: tracked,                     sub: 'keywords' },
          { label: 'Avg Position', value: avgRank ?? '—',             sub: checked > 0 ? `across ${checked} checked` : 'none checked yet' },
          { label: 'Page 1',      value: inTop10,                     sub: 'in top 10' },
          { label: 'Map Pack',    value: inMapPack,                   sub: 'appearing' },
        ].map(s => (
          <Card key={s.label} className="text-center py-4">
            <div className="text-2xl font-bold text-hub-text">{s.value}</div>
            <div className="text-xs font-medium text-hub-text-secondary mt-0.5">{s.label}</div>
            <div className="text-[11px] text-hub-text-muted">{s.sub}</div>
          </Card>
        ))}
      </div>

      {/* Rankings table */}
      <Card padding={false}>
        <div className="px-5 py-3 border-b border-hub-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-hub-text">Keyword Rankings</h2>
          <Button size="sm" variant="ghost" onClick={() => navigate('/rank-tracker')}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Keyword
          </Button>
        </div>

        {/* Header */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_36px] gap-3 px-5 py-2 text-[11px] font-semibold text-hub-text-muted uppercase tracking-wide border-b border-hub-border/50">
          <span>Keyword</span>
          <span>Location</span>
          <span>Rank</span>
          <span>Change</span>
          <span>Trend</span>
          <span />
        </div>

        <div className="divide-y divide-hub-border/50">
          {keywords.map(kw => {
            const isExpanded = !!expanded[kw.id]
            const hist = histories[kw.id] || []
            return (
              <div key={kw.id}>
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px_36px] gap-3 items-center px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-hub-text truncate">{kw.keyword}</p>
                    <p className="text-[11px] text-hub-text-muted font-mono truncate">{kw.domain}</p>
                  </div>
                  <span className="text-xs text-hub-text-muted">{kw.city}, {kw.state}</span>
                  <RankBadge rank={kw.currentRank} />
                  <RankChange current={kw.currentRank} previous={kw.previousRank} />
                  <Sparkline history={hist} />
                  <button
                    onClick={() => toggleExpand(kw.id)}
                    className="p-1 rounded hover:bg-hub-input transition-colors text-hub-text-muted"
                  >
                    {isExpanded
                      ? <ChevronUp className="w-4 h-4" />
                      : <ChevronDown className="w-4 h-4" />
                    }
                  </button>
                </div>

                {/* Expanded history */}
                {isExpanded && (
                  <div className="px-5 pb-4 bg-hub-input/20">
                    <p className="text-xs font-medium text-hub-text-secondary mb-2">Check History</p>
                    {hist.length === 0 ? (
                      <p className="text-xs text-hub-text-muted">No checks yet — click "Check" on the Keywords page.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {hist.map(h => {
                          const d = h.checkedAt?.toDate ? h.checkedAt.toDate() : new Date(h.checkedAt || 0)
                          return (
                            <div key={h.id} className="flex items-center gap-4 text-xs">
                              <span className="text-hub-text-muted w-32 shrink-0">
                                {d.toLocaleDateString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <RankBadge rank={h.rank} />
                              {h.inLocalPack && <Badge variant="success" size="sm">Map Pack</Badge>}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
