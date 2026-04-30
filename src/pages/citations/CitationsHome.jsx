import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, CheckCircle, List, Activity, BarChart2,
  Play, Loader2, ChevronRight, Package, Settings, ArrowUpCircle,
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
import { getActiveOffers, redirectToCheckout } from '../../services/stripe'
import { cn } from '../../utils/cn'

const PACKAGE_TIERS = {
  citations_starter: { label: 'Starter', count: 100, variant: 'info',   rank: 1 },
  citations_pro:     { label: 'Pro',     count: 200, variant: 'paid',   rank: 2 },
  citations_premium: { label: 'Premium', count: 300, variant: 'orange', rank: 3 },
  starter:           { label: 'Starter', count: 100, variant: 'info',   rank: 1 },
  pro:               { label: 'Pro',     count: 200, variant: 'paid',   rank: 2 },
  premium:           { label: 'Premium', count: 300, variant: 'orange', rank: 3 },
}

const STATUS_BADGE = {
  queued:    { label: 'Queued',    variant: 'gray' },
  running:   { label: 'Running',   variant: 'info' },
  paused:    { label: 'Paused',    variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed:    { label: 'Failed',    variant: 'error' },
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CitationsHome() {
  const { hasCitations } = useBilling()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [upgradeOffers, setUpgradeOffers] = useState([])
  const [purchasing, setPurchasing] = useState(null)

  useEffect(() => {
    if (!userProfile?.id) return
    const unsub = subscribeToCitationsBatches(userProfile.id, data => {
      setBatches(data)
      setBatchesLoading(false)
    })
    return unsub
  }, [userProfile?.id])

  const packageId = userProfile?.purchases?.citationsPackageId
  const tier = PACKAGE_TIERS[packageId] || { label: 'Active', count: 100, variant: 'info', rank: 1 }

  useEffect(() => {
    if (!hasCitations) return
    getActiveOffers()
      .then(offers => {
        const upgrades = offers.filter(o =>
          o.unlocksFeature === 'citations' &&
          (PACKAGE_TIERS[o.tier]?.rank || 0) > tier.rank
        )
        setUpgradeOffers(upgrades)
      })
      .catch(() => {})
  }, [hasCitations, tier.rank])

  const handleUpgrade = async (offerId) => {
    if (!offerId) return
    setPurchasing(offerId)
    try {
      await redirectToCheckout(offerId)
    } catch {
      toast('Could not start checkout. Please try again.', 'error')
      setPurchasing(null)
    }
  }

  if (!hasCitations) return <ToolGate tool="citations" />

  const activeBatch = batches.find(b => b.status === 'running' || b.status === 'queued')
  const latestBatch = batches[0]

  const totalLive      = batches.reduce((s, b) => s + (b.live      || 0), 0)
  const totalSubmitted = batches.reduce((s, b) => s + (b.submitted || 0), 0)

  const handleStartJob = async () => {
    const required = ['businessName', 'phone', 'address', 'city', 'state', 'zip']
    const missing = required.filter(f => !userProfile?.[f])
    if (missing.length > 0 || !userProfile?.citationsSetupCompleted) {
      toast('Complete your Citations Setup first so we have your business info ready.', 'warning')
      navigate('/citations/setup')
      return
    }
    setStarting(true)
    try {
      await startCitationsJob({})
      toast('Submission job queued! Track progress in Jobs & Progress.', 'success')
    } catch (err) {
      toast(err.message || 'Could not start job — please try again.', 'error')
    } finally {
      setStarting(false)
    }
  }

  const livePercent = latestBatch
    ? Math.round(((latestBatch.live || 0) / (latestBatch.total || tier.count)) * 100)
    : 0

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-hub-blue/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-hub-blue" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-hub-text">Citations</h1>
                <Badge variant={tier.variant}>{tier.label} — {tier.count} dirs</Badge>
              </div>
              <p className="text-hub-text-secondary text-sm mt-0.5">
                Business listings across top directories
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="secondary" onClick={() => navigate('/citations/setup')}>
            <Settings className="w-4 h-4" />
            Business Info
          </Button>
          {!activeBatch && !batchesLoading && (
            <Button onClick={handleStartJob} loading={starting}>
              <Play className="w-4 h-4" />
              Start Submission
            </Button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Live Citations', value: batchesLoading ? '—' : totalLive,      color: 'text-hub-green',          icon: CheckCircle },
          { label: 'Submitted',      value: batchesLoading ? '—' : totalSubmitted, color: 'text-hub-blue',           icon: BookOpen    },
          { label: 'Directories',    value: tier.count,                            color: 'text-hub-text',           icon: List        },
          { label: 'Jobs Run',       value: batchesLoading ? '—' : batches.length, color: 'text-hub-text-secondary', icon: Activity    },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="text-center py-5">
            <Icon className={cn('w-5 h-5 mx-auto mb-2 opacity-80', color)} />
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-hub-text-muted mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Latest job card */}
      {batchesLoading ? (
        <Card className="flex items-center justify-center py-12 mb-6">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </Card>
      ) : latestBatch ? (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>Latest Job</CardTitle>
              {(() => {
                const s = STATUS_BADGE[latestBatch.status] || { label: latestBatch.status, variant: 'gray' }
                return <Badge variant={s.variant}>{s.label}</Badge>
              })()}
              {latestBatch.status === 'running' && (
                <span className="flex items-center gap-1.5 text-xs text-hub-blue">
                  <span className="w-1.5 h-1.5 rounded-full bg-hub-blue animate-pulse" />
                  Live
                </span>
              )}
            </div>
            <Link
              to="/citations/jobs"
              className="text-xs text-hub-blue hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </CardHeader>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-hub-text-secondary mb-1.5">
              <span>{latestBatch.live || 0} live of {latestBatch.total || tier.count} directories</span>
              <span>{livePercent}%</span>
            </div>
            <div className="h-2.5 bg-hub-input rounded-full overflow-hidden">
              <div
                className="h-full bg-hub-green rounded-full transition-all duration-700"
                style={{ width: `${livePercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Live',      value: latestBatch.live      || 0, color: 'text-hub-green'  },
              { label: 'Submitted', value: latestBatch.submitted || 0, color: 'text-hub-blue'   },
              { label: 'Pending',   value: latestBatch.pending   || 0, color: 'text-hub-yellow' },
              { label: 'Failed',    value: latestBatch.failed    || 0, color: 'text-hub-red'    },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-hub-input rounded-lg px-3 py-3 text-center">
                <p className={cn('text-xl font-bold', color)}>{value}</p>
                <p className="text-xs text-hub-text-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-hub-text-muted mt-3">
            Started {formatDate(latestBatch.createdAt)}
          </p>
        </Card>
      ) : (
        <Card className="mb-6 text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-hub-input flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-hub-text-muted opacity-60" />
          </div>
          <p className="text-hub-text font-semibold mb-1">No submission jobs yet</p>
          <p className="text-hub-text-secondary text-sm mb-5 max-w-xs mx-auto">
            Start your first job to get your business listed across {tier.count} directories.
          </p>
          <Button onClick={handleStartJob} loading={starting}>
            <Play className="w-4 h-4" />
            Start Your First Submission
          </Button>
        </Card>
      )}

      {/* Sub-page navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: List,
            label: 'My Directories',
            description: 'View all directories with live / pending / failed status.',
            to: '/citations/directories',
            iconColor: 'text-hub-blue',
            iconBg: 'bg-hub-blue/10',
          },
          {
            icon: Activity,
            label: 'Jobs & Progress',
            description: 'Real-time submission tracking and full job history.',
            to: '/citations/jobs',
            iconColor: 'text-hub-green',
            iconBg: 'bg-hub-green/10',
          },
          {
            icon: BarChart2,
            label: 'Analytics',
            description: 'Live citation count, category breakdown and consistency score.',
            to: '/citations/analytics',
            iconColor: 'text-hub-orange',
            iconBg: 'bg-hub-orange/10',
          },
        ].map(({ icon: Icon, label, description, to, iconColor, iconBg }) => (
          <Link key={to} to={to}>
            <Card className="hover:border-hub-blue/40 transition-colors cursor-pointer h-full">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', iconBg)}>
                <Icon className={cn('w-5 h-5', iconColor)} />
              </div>
              <p className="text-sm font-semibold text-hub-text mb-1">{label}</p>
              <p className="text-xs text-hub-text-muted leading-relaxed">{description}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-hub-blue">
                View <ChevronRight className="w-3 h-3" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Upgrade section — only shown when higher tiers are available */}
      {upgradeOffers.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpCircle className="w-5 h-5 text-hub-blue" />
            <h2 className="text-base font-semibold text-hub-text">Upgrade Your Package</h2>
            <span className="text-xs text-hub-text-muted">Get more directories at a discounted upgrade price</span>
          </div>
          <div className="flex flex-col gap-3">
            {upgradeOffers.map(offer => (
              <div key={offer.id} className="flex items-center justify-between bg-hub-card border border-hub-blue/30 rounded-xl px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-hub-text">{offer.name}</p>
                  <p className="text-xs text-hub-text-muted mt-0.5">
                    {PACKAGE_TIERS[offer.tier]?.count || '?'} directories total
                  </p>
                  <p className="text-hub-blue font-semibold mt-0.5">
                    ${offer.price} {offer.type === 'subscription' ? '/mo' : 'one-time'}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={!offer.stripePriceId}
                  loading={purchasing === offer.id}
                  onClick={() => handleUpgrade(offer.id)}
                >
                  {offer.stripePriceId ? 'Upgrade Now' : 'Coming Soon'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
