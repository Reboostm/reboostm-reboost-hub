import { useState, useEffect, useMemo } from 'react'
import {
  CheckCircle, List, Activity, Mail, ChevronRight, Package, Loader2, AlertCircle,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import { useToast } from '../../hooks/useToast'
import ToolGate from '../../components/ui/ToolGate'
import CitationsPackageBar from '../../components/citations/CitationsPackageBar'
import CitationExclusionModal from '../../components/citations/CitationExclusionModal'
import { subscribeToCitationsBatches } from '../../services/firestore'
import { startCitationsJob } from '../../services/functions'
import { cn } from '../../utils/cn'
import { db } from '../../services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const STATUS_BADGE = {
  queued:    { label: 'Queued',    variant: 'gray' },
  running:   { label: 'Running',   variant: 'info' },
  paused:    { label: 'Paused',    variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  failed:    { label: 'Failed',    variant: 'error' },
}

export default function CitationsHome() {
  const { hasCitations } = useBilling()
  const { userProfile, user } = useAuth()
  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [showExclusionModal, setShowExclusionModal] = useState(false)
  const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)
  const [lastPackageId, setLastPackageId] = useState(null)
  const [offers, setOffers] = useState([])
  const [packages, setPackages] = useState([])

  useEffect(() => {
    if (!userProfile?.id) return
    const unsub = subscribeToCitationsBatches(userProfile.id, data => {
      setBatches(data)
      setBatchesLoading(false)
    })
    return unsub
  }, [userProfile?.id])

  // Load offers and packages
  useEffect(() => {
    const loadData = async () => {
      try {
        const offersQuery = query(
          collection(db, 'offers'),
          where('unlocksFeature', '==', 'citations'),
          where('active', '==', true)
        )
        const offersSnap = await getDocs(offersQuery)
        const citationOffers = offersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))

        const packagesSnap = await getDocs(collection(db, 'citation_packages'))
        const citationPackages = packagesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))

        setOffers(citationOffers)
        setPackages(citationPackages)
      } catch (err) {
        console.error('Error loading offers/packages:', err)
      }
    }

    loadData()
  }, [])

  // Show exclusion modal on first citation purchase
  useEffect(() => {
    if (userProfile?.showCitationExclusionList && hasCitations) {
      setShowExclusionModal(true)
    }
  }, [userProfile?.showCitationExclusionList, hasCitations])

  // Show upgrade confirmation when package changes
  useEffect(() => {
    const currentId = userProfile?.purchases?.citationsPackageId
    if (lastPackageId && currentId && lastPackageId !== currentId && hasCitations) {
      setShowUpgradeConfirm(true)
    }
    setLastPackageId(currentId)
  }, [userProfile?.purchases?.citationsPackageId, hasCitations])

  const packageId = userProfile?.purchases?.citationsPackageId

  // Look up the offer and package for the user's current plan
  const tier = useMemo(() => {
    if (!packageId) return { label: 'Starter', count: 100, variant: 'info', rank: 1 }

    const pkg = packages.find(p => p.id === packageId)
    if (!pkg) return { label: 'Starter', count: 100, variant: 'info', rank: 1 }

    const offer = offers.find(o => o.tier === packageId)

    return {
      label: offer?.name || 'Starter',
      count: pkg.count || 100,
      variant: 'info',
      rank: 1,
    }
  }, [packageId, offers, packages])

  if (!hasCitations) return <ToolGate tool="citations" />

  const activeBatch = batches.find(b => b.status === 'running' || b.status === 'queued')
  const latestBatch = batches[0]

  const totalLive = batches.reduce((s, b) => s + (b.live || 0), 0)
  const totalSubmitted = batches.reduce((s, b) => s + (b.submitted || 0), 0)
  const totalPending = batches.reduce((s, b) => s + (b.pending || 0), 0)
  const totalFailed = batches.reduce((s, b) => s + (b.failed || 0), 0)

  const livePercent = latestBatch
    ? Math.round(((latestBatch.live || 0) / (latestBatch.total || tier.count)) * 100)
    : 0

  return (
    <div className="p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-hub-text tracking-tight">Citations</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Business listings across {tier.count} directories
        </p>
      </div>

      {/* Package tier bar */}
      <CitationsPackageBar />

      {/* Overall stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Live', value: batchesLoading ? '—' : totalLive, color: 'text-hub-green', icon: CheckCircle },
          { label: 'Submitted', value: batchesLoading ? '—' : totalSubmitted, color: 'text-hub-blue', icon: List },
          { label: 'Pending', value: batchesLoading ? '—' : totalPending, color: 'text-hub-yellow', icon: AlertCircle },
          { label: 'Failed', value: batchesLoading ? '—' : totalFailed, color: 'text-hub-red', icon: Activity },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="text-center py-4">
            <Icon className={cn('w-5 h-5 mx-auto mb-2 opacity-70', color)} />
            <p className={cn('text-2xl font-bold', color)}>{value}</p>
            <p className="text-xs text-hub-text-muted mt-1">{label}</p>
          </Card>
        ))}
      </div>

      {/* Job Progress */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Submission Progress</CardTitle>
            {activeBatch && (
              <span className="flex items-center gap-1.5 text-xs text-hub-blue">
                <span className="w-1.5 h-1.5 rounded-full bg-hub-blue animate-pulse" />
                Live
              </span>
            )}
          </div>
        </CardHeader>

        {batchesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
          </div>
        ) : latestBatch ? (
          <div className="space-y-4">
            {/* Progress bar */}
            <div>
              <div className="flex justify-between text-xs text-hub-text-secondary mb-1.5">
                <span>{latestBatch.live || 0} live of {latestBatch.total || tier.count}</span>
                <span>{livePercent}%</span>
              </div>
              <div className="h-3 bg-hub-input rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-hub-blue to-hub-green rounded-full transition-all duration-700"
                  style={{ width: `${livePercent}%` }}
                />
              </div>
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Live', value: latestBatch.live || 0, color: 'text-hub-green' },
                { label: 'Submitted', value: latestBatch.submitted || 0, color: 'text-hub-blue' },
                { label: 'Pending', value: latestBatch.pending || 0, color: 'text-hub-yellow' },
                { label: 'Failed', value: latestBatch.failed || 0, color: 'text-hub-red' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-hub-input rounded-lg px-3 py-3 text-center">
                  <p className={cn('text-lg font-bold', color)}>{value}</p>
                  <p className="text-xs text-hub-text-muted mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <p className="text-xs text-hub-text-muted px-1">
              Started {formatDate(latestBatch.createdAt)} · Status: <Badge variant={STATUS_BADGE[latestBatch.status]?.variant || 'gray'} size="sm">{STATUS_BADGE[latestBatch.status]?.label}</Badge>
            </p>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Package className="w-12 h-12 text-hub-text-muted opacity-40 mx-auto mb-3" />
            <p className="text-sm text-hub-text-secondary">No submissions yet</p>
            <p className="text-xs text-hub-text-muted mt-1">Complete your business info to get started</p>
          </div>
        )}
      </Card>

      {/* Email routing breakdown */}
      {latestBatch && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Routing
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-hub-input rounded-lg">
              <div>
                <p className="text-sm font-semibold text-hub-text">Your Email</p>
                <p className="text-xs text-hub-text-muted">Top-tier sites requiring verification</p>
              </div>
              <p className="text-xl font-bold text-hub-orange">{latestBatch.topTierCount || 0}</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-hub-input rounded-lg">
              <div>
                <p className="text-sm font-semibold text-hub-text">System Email</p>
                <p className="text-xs text-hub-text-muted">Managed by ReBoost HUB</p>
              </div>
              <p className="text-xl font-bold text-hub-blue">{latestBatch.systemEmailCount || 0}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Exclusion modal */}
      <CitationExclusionModal
        isOpen={showExclusionModal}
        onClose={() => setShowExclusionModal(false)}
        userId={user?.uid}
      />

      {/* Upgrade confirmation modal */}
      <UpgradeConfirmationModal
        isOpen={showUpgradeConfirm}
        onClose={() => setShowUpgradeConfirm(false)}
        previousTier={lastPackageId}
        currentTier={packageId}
        tier={tier}
        newDirs={Math.max(0, (packages.find(p => p.id === packageId)?.count || 0) - (packages.find(p => p.id === lastPackageId)?.count || 0))}
      />
    </div>
  )
}

// Fun upgrade confirmation modal
function UpgradeConfirmationModal({ isOpen, onClose, currentTier, tier, newDirs }) {
  const { toast } = useToast()
  const [step, setStep] = useState('confirm') // confirm, progress, done
  const [submitting, setSubmitting] = useState(false)

  const handleAutoSubmit = async () => {
    setStep('progress')
    setSubmitting(true)
    try {
      await startCitationsJob({})
      setTimeout(() => {
        setStep('done')
      }, 2000)
    } catch (err) {
      toast(err.message || 'Failed to start submission', 'error')
      setSubmitting(false)
      setStep('confirm')
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={submitting ? undefined : onClose} size="lg" title="">
      {step === 'confirm' && (
        <div className="text-center space-y-6 py-6">
          <div className="text-5xl">🎉</div>
          <div>
            <h2 className="text-2xl font-bold text-hub-text mb-2">Payment Received!</h2>
            <p className="text-hub-text-secondary">We're about to submit you to {newDirs.toLocaleString()} new directories</p>
          </div>

          <div className="bg-hub-input rounded-xl p-4 space-y-2 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-hub-text-muted">Tier</span>
              <span className="font-semibold text-hub-text">{tier.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-hub-text-muted">Total Directories</span>
              <span className="font-semibold text-hub-text">{tier.count}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-hub-border pt-2">
              <span className="text-hub-text-muted">New Directories</span>
              <span className="font-bold text-hub-green">+{newDirs.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full"
              onClick={handleAutoSubmit}
              loading={submitting}
            >
              <span>🚀</span> Let's Go! Auto-Submit Now
            </Button>
          </div>
        </div>
      )}

      {step === 'progress' && (
        <div className="text-center space-y-6 py-8">
          <div className="text-4xl animate-bounce">⚡</div>
          <div>
            <h2 className="text-2xl font-bold text-hub-text mb-2">Submitting Your Listings</h2>
            <p className="text-hub-text-secondary">This usually takes a few minutes. We'll notify you when complete!</p>
          </div>

          <div className="space-y-2">
            <div className="h-2 bg-hub-input rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-hub-blue to-hub-green rounded-full animate-pulse" style={{ width: '33%' }} />
            </div>
            <p className="text-xs text-hub-text-muted">Initializing submission queue...</p>
          </div>

          <Button disabled className="w-full">
            <Loader2 className="w-4 h-4 animate-spin" />
            In Progress
          </Button>
        </div>
      )}

      {step === 'done' && (
        <div className="text-center space-y-6 py-8">
          <div className="text-5xl">✅</div>
          <div>
            <h2 className="text-2xl font-bold text-hub-text mb-2">Submission Started!</h2>
            <p className="text-hub-text-secondary">Your {newDirs} new directories are being submitted right now.</p>
          </div>

          <div className="bg-hub-green/10 border border-hub-green/25 rounded-lg p-4">
            <p className="text-sm text-hub-green font-medium">Check the Submission Progress card below to track real-time status.</p>
          </div>

          <Button className="w-full" onClick={onClose}>
            Got It! Close Modal
          </Button>
        </div>
      )}
    </Modal>
  )
}
