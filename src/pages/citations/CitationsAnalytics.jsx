import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart2, CheckCircle, TrendingUp, Clock, Loader2,
  BookOpen, AlertCircle, ArrowLeft,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
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

const PACKAGE_TIERS = {
  citations_starter: { count: 100 },
  citations_pro:     { count: 200 },
  citations_premium: { count: 300 },
  starter:           { count: 100 },
  pro:               { count: 200 },
  premium:           { count: 300 },
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ScoreRing({ score, label, color }) {
  const radius = 36
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ

  const strokeColor = score >= 75 ? '#22C55E' : score >= 50 ? '#4F8EF7' : score >= 30 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--color-hub-input)" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={strokeColor} strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-hub-text">{score}</span>
          <span className="text-xs text-hub-text-muted">/ 100</span>
        </div>
      </div>
      <p className="text-sm font-medium text-hub-text">{label}</p>
    </div>
  )
}

function CategoryBar({ name, live, total, color }) {
  const pct = total > 0 ? Math.round((live / total) * 100) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-hub-text-secondary font-medium">{name}</span>
        <span className="text-hub-text-muted">{live}/{total} live</span>
      </div>
      <div className="h-2 bg-hub-input rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function CitationsAnalytics() {
  const { hasCitations } = useBilling()
  const { userProfile } = useAuth()
  const navigate = useNavigate()
  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [latestDirs, setLatestDirs] = useState([])
  const [dirsLoading, setDirsLoading] = useState(false)

  useEffect(() => {
    if (!userProfile?.id) return
    const unsub = subscribeToCitationsBatches(userProfile.id, data => {
      setBatches(data)
      setBatchesLoading(false)
    })
    return unsub
  }, [userProfile?.id])

  // Subscribe to the latest completed or running batch's directories for category breakdown
  const latestBatchId = useMemo(() => {
    const best = batches.find(b => b.status === 'completed' || b.status === 'running') || batches[0]
    return best?.id || null
  }, [batches])

  useEffect(() => {
    if (!latestBatchId) return
    setDirsLoading(true)
    const unsub = subscribeToCitationsDirectories(latestBatchId, data => {
      setLatestDirs(data)
      setDirsLoading(false)
    })
    return unsub
  }, [latestBatchId])

  if (!hasCitations) return <ToolGate tool="citations" />

  const packageId = userProfile?.purchases?.citationsPackageId
  const tier = PACKAGE_TIERS[packageId] || { count: 100 }

  const totalLive      = batches.reduce((s, b) => s + (b.live      || 0), 0)
  const totalSubmitted = batches.reduce((s, b) => s + (b.submitted || 0), 0)
  const totalFailed    = batches.reduce((s, b) => s + (b.failed    || 0), 0)

  const latestBatch = batches[0]
  const targetCount = latestBatch?.total || tier.count
  const consistencyScore = Math.round((totalLive / targetCount) * 100)

  // Category breakdown from latest batch directories
  const categoryStats = useMemo(() => {
    const map = {}
    latestDirs.forEach(d => {
      const cat = d.category || 'General'
      if (!map[cat]) map[cat] = { live: 0, total: 0 }
      map[cat].total++
      if (d.status === 'live') map[cat].live++
    })
    return Object.entries(map)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8)
  }, [latestDirs])

  const CATEGORY_COLORS = [
    '#4F8EF7', '#22C55E', '#F97316', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#A0AABF',
  ]

  // Job timeline — one entry per completed/running batch
  const timeline = batches
    .filter(b => b.status === 'completed' || b.status === 'running')
    .slice(0, 6)

  const noData = !batchesLoading && batches.length === 0

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/citations')}
          className="flex items-center gap-1.5 text-sm text-hub-text-secondary hover:text-hub-text mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Citations
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-hub-orange/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-hub-orange" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-hub-text">Analytics</h1>
            <p className="text-hub-text-secondary text-sm">Citation coverage and consistency over time.</p>
          </div>
        </div>
      </div>

      <CitationsPackageBar />

      {batchesLoading ? (
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </Card>
      ) : noData ? (
        <Card className="text-center py-14">
          <BarChart2 className="w-10 h-10 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text font-semibold mb-1">No data yet</p>
          <p className="text-hub-text-secondary text-sm max-w-xs mx-auto">
            Analytics will populate once your first citations job has been submitted.
          </p>
        </Card>
      ) : (
        <>
          {/* Score rings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              {latestBatch?.status === 'running' && (
                <Badge variant="info">
                  <span className="w-1.5 h-1.5 rounded-full bg-hub-blue animate-pulse mr-1" />
                  Live update
                </Badge>
              )}
            </CardHeader>
            <div className="flex flex-wrap justify-around gap-6 py-2">
              <ScoreRing score={consistencyScore} label="Consistency Score" />
              <ScoreRing
                score={targetCount > 0 ? Math.round((totalLive / targetCount) * 100) : 0}
                label="Coverage"
              />
              <ScoreRing
                score={totalSubmitted + totalLive > 0
                  ? Math.round((totalLive / (totalSubmitted + totalLive)) * 100)
                  : 0}
                label="Live Rate"
              />
            </div>
          </Card>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Live Citations',  value: totalLive,                icon: CheckCircle, color: 'text-hub-green' },
              { label: 'Submitted',       value: totalSubmitted,           icon: BookOpen,    color: 'text-hub-blue'  },
              { label: 'Failed',          value: totalFailed,              icon: AlertCircle, color: 'text-hub-red'   },
              { label: 'Target',          value: targetCount,              icon: TrendingUp,  color: 'text-hub-text'  },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label} className="text-center py-4">
                <Icon className={cn('w-5 h-5 mx-auto mb-2 opacity-80', color)} />
                <p className={cn('text-2xl font-bold', color)}>{value}</p>
                <p className="text-xs text-hub-text-muted mt-1">{label}</p>
              </Card>
            ))}
          </div>

          {/* Category breakdown */}
          {(dirsLoading || categoryStats.length > 0) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>By Category</CardTitle>
                <span className="text-xs text-hub-text-muted">Latest job</span>
              </CardHeader>
              {dirsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-4 h-4 animate-spin text-hub-text-muted" />
                </div>
              ) : (
                <div className="space-y-4">
                  {categoryStats.map(([name, stats], i) => (
                    <CategoryBar
                      key={name}
                      name={name}
                      live={stats.live}
                      total={stats.total}
                      color={CATEGORY_COLORS[i % CATEGORY_COLORS.length]}
                    />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Job timeline */}
          {timeline.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Job History</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {timeline.map((b, i) => {
                  const live = b.live || 0
                  const total = b.total || tier.count
                  const pct = Math.round((live / total) * 100)
                  return (
                    <div key={b.id} className="flex items-center gap-4">
                      <div className="w-20 text-xs text-hub-text-muted text-right flex-shrink-0">
                        {formatDate(b.createdAt)}
                      </div>
                      <div className="flex-1 h-2 bg-hub-input rounded-full overflow-hidden">
                        <div
                          className="h-full bg-hub-green rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-20 text-xs text-hub-text-secondary text-right flex-shrink-0">
                        {live}/{total} live
                      </div>
                      {b.status === 'running' && (
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-hub-blue animate-pulse" />
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
