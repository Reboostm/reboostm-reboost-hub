import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, CheckCircle, XCircle, Clock, Loader2,
  Play, ChevronRight, AlertCircle, Package,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import { useToast } from '../../hooks/useToast'
import ToolGate from '../../components/ui/ToolGate'
import { subscribeToCitationsBatches } from '../../services/firestore'
import { startCitationsJob } from '../../services/functions'
import { cn } from '../../utils/cn'

const PACKAGE_TIERS = {
  citations_starter: { label: 'Starter', count: 100 },
  citations_pro:     { label: 'Pro',     count: 200 },
  citations_premium: { label: 'Premium', count: 300 },
  starter:           { label: 'Starter', count: 100 },
  pro:               { label: 'Pro',     count: 200 },
  premium:           { label: 'Premium', count: 300 },
}

const STATUS_CONFIG = {
  queued:    { label: 'Queued',    variant: 'gray',    icon: Clock,         color: 'text-hub-text-muted' },
  running:   { label: 'Running',   variant: 'info',    icon: Loader2,       color: 'text-hub-blue',   spin: true },
  paused:    { label: 'Paused',    variant: 'warning', icon: AlertCircle,   color: 'text-hub-yellow' },
  completed: { label: 'Completed', variant: 'success', icon: CheckCircle,   color: 'text-hub-green'  },
  failed:    { label: 'Failed',    variant: 'error',   icon: XCircle,       color: 'text-hub-red'    },
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(startTs, endTs) {
  if (!startTs) return null
  const start = startTs.toDate ? startTs.toDate() : new Date(startTs)
  const end = endTs ? (endTs.toDate ? endTs.toDate() : new Date(endTs)) : new Date()
  const mins = Math.round((end - start) / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
}

function JobProgressBar({ batch, targetCount }) {
  const livePercent     = Math.min(100, Math.round(((batch.live      || 0) / (batch.total || targetCount || 1)) * 100))
  const submittedPct    = Math.min(100, Math.round(((batch.submitted || 0) / (batch.total || targetCount || 1)) * 100))

  return (
    <div>
      <div className="flex justify-between text-xs text-hub-text-secondary mb-1.5">
        <span>
          {batch.live || 0} live · {batch.submitted || 0} submitted · {batch.pending || 0} pending
        </span>
        <span>{livePercent}% live</span>
      </div>
      {/* Stacked progress bar: live (green) + submitted (blue) */}
      <div className="h-3 bg-hub-input rounded-full overflow-hidden flex">
        <div
          className="h-full bg-hub-green transition-all duration-700"
          style={{ width: `${livePercent}%` }}
        />
        <div
          className="h-full bg-hub-blue/60 transition-all duration-700"
          style={{ width: `${Math.max(0, submittedPct - livePercent)}%` }}
        />
      </div>
      <div className="flex items-center gap-4 mt-2 text-xs text-hub-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-hub-green" />
          Live
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-hub-blue/60" />
          Submitted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-hub-input border border-hub-border" />
          Pending
        </span>
      </div>
    </div>
  )
}

function JobCard({ batch, targetCount, isActive }) {
  const cfg = STATUS_CONFIG[batch.status] || STATUS_CONFIG.queued
  const Icon = cfg.icon

  return (
    <Card className={cn(isActive && 'border-hub-blue/40 ring-1 ring-hub-blue/20')}>
      <CardHeader>
        <div className="flex items-center gap-3 flex-wrap">
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-hub-input')}>
            <Icon className={cn('w-4.5 h-4.5', cfg.color, cfg.spin && 'animate-spin')} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>
                {batch.packageTier
                  ? `${batch.packageTier.charAt(0).toUpperCase() + batch.packageTier.slice(1)} Submission`
                  : 'Submission Job'}
              </CardTitle>
              <Badge variant={cfg.variant}>{cfg.label}</Badge>
              {isActive && (
                <span className="flex items-center gap-1 text-xs text-hub-blue">
                  <span className="w-1.5 h-1.5 rounded-full bg-hub-blue animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <p className="text-xs text-hub-text-muted mt-0.5">
              Started {formatDate(batch.createdAt)}
              {(batch.startedAt || batch.completedAt) &&
                ` · Duration: ${formatDuration(batch.startedAt || batch.createdAt, batch.completedAt)}`}
            </p>
          </div>
        </div>
        <Link
          to="/citations/directories"
          className="text-xs text-hub-blue hover:underline flex items-center gap-1 whitespace-nowrap"
        >
          View dirs <ChevronRight className="w-3 h-3" />
        </Link>
      </CardHeader>

      <JobProgressBar batch={batch} targetCount={targetCount} />

      <div className="grid grid-cols-4 gap-3 mt-4">
        {[
          { label: 'Live',      value: batch.live      || 0, color: 'text-hub-green'  },
          { label: 'Submitted', value: batch.submitted || 0, color: 'text-hub-blue'   },
          { label: 'Pending',   value: batch.pending   || 0, color: 'text-hub-yellow' },
          { label: 'Failed',    value: batch.failed    || 0, color: 'text-hub-red'    },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-hub-input rounded-lg px-3 py-2.5 text-center">
            <p className={cn('text-lg font-bold', color)}>{value}</p>
            <p className="text-xs text-hub-text-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {batch.errorMessage && (
        <div className="mt-4 bg-hub-red/10 border border-hub-red/20 rounded-lg px-4 py-3">
          <p className="text-xs text-hub-red font-medium mb-0.5">Job Error</p>
          <p className="text-xs text-hub-text-secondary">{batch.errorMessage}</p>
        </div>
      )}
    </Card>
  )
}

export default function CitationsJobs() {
  const { hasCitations } = useBilling()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!userProfile?.id) return
    const unsub = subscribeToCitationsBatches(userProfile.id, data => {
      setBatches(data)
      setLoading(false)
    })
    return unsub
  }, [userProfile?.id])

  if (!hasCitations) return <ToolGate tool="citations" />

  const packageId = userProfile?.purchases?.citationsPackageId
  const tier = PACKAGE_TIERS[packageId] || { label: 'Active', count: 100 }

  const activeJobs   = batches.filter(b => b.status === 'running' || b.status === 'queued')
  const pastJobs     = batches.filter(b => b.status !== 'running' && b.status !== 'queued')
  const canStartNew  = activeJobs.length === 0

  const handleStartJob = async () => {
    setStarting(true)
    try {
      await startCitationsJob({})
      toast('Submission job queued!', 'success')
    } catch (err) {
      toast(err.message || 'Could not start job — please try again.', 'error')
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Jobs &amp; Progress</h1>
          <p className="text-hub-text-secondary text-sm mt-1">
            Real-time tracking for all citation submission jobs.
          </p>
        </div>
        {canStartNew && !loading && batches.length > 0 && (
          <Button onClick={handleStartJob} loading={starting}>
            <Play className="w-4 h-4" />
            Run Again
          </Button>
        )}
      </div>

      {loading ? (
        <Card className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </Card>
      ) : batches.length === 0 ? (
        <Card className="text-center py-14">
          <div className="w-14 h-14 rounded-2xl bg-hub-input flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-hub-text-muted opacity-60" />
          </div>
          <p className="text-hub-text font-semibold mb-1">No submission jobs yet</p>
          <p className="text-hub-text-secondary text-sm mb-5 max-w-xs mx-auto">
            Start your first job to submit your business to {tier.count} directories automatically.
          </p>
          <Button onClick={handleStartJob} loading={starting}>
            <Play className="w-4 h-4" />
            Start First Submission
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active jobs */}
          {activeJobs.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-hub-text mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-hub-blue" />
                Active
                <span className="text-hub-text-muted font-normal">({activeJobs.length})</span>
              </h2>
              <div className="space-y-4">
                {activeJobs.map(b => (
                  <JobCard key={b.id} batch={b} targetCount={tier.count} isActive />
                ))}
              </div>
            </section>
          )}

          {/* Completed/past jobs */}
          {pastJobs.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-hub-text mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-hub-text-muted" />
                History
                <span className="text-hub-text-muted font-normal">({pastJobs.length})</span>
              </h2>
              <div className="space-y-4">
                {pastJobs.map(b => (
                  <JobCard key={b.id} batch={b} targetCount={tier.count} isActive={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
