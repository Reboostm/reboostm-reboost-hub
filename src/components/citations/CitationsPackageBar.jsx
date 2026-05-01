import { useState, useEffect } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { getActiveOffers, redirectToCheckout } from '../../services/stripe'
import { cn } from '../../utils/cn'
import { db } from '../../services/firebase'
import { collection, getDocs } from 'firebase/firestore'

// Fixed tier definitions — rank maps to the user's citationsPackageId
const TIERS = [
  {
    rank: 1,
    ids: ['citations_starter', 'starter'],
    defaultLabel: 'Starter',
    count: 100,
    color: 'hub-blue',
  },
  {
    rank: 2,
    ids: ['citations_pro', 'pro'],
    defaultLabel: 'Growth',
    count: 200,
    color: 'hub-green',
  },
  {
    rank: 3,
    ids: ['citations_premium', 'premium'],
    defaultLabel: 'Dominator',
    count: 300,
    color: 'hub-orange',
  },
]

function getTierRank(packageId) {
  return TIERS.find(t => t.ids.includes(packageId))?.rank || 1
}

export default function CitationsPackageBar() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [allOffers, setAllOffers] = useState([])
  const [packages, setPackages] = useState([])
  const [purchasing, setPurchasing] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Use real-time listener for offers instead of cached getActiveOffers()
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

        setAllOffers(citationOffers)
        setPackages(citationPackages)
      } catch (err) {
        console.error('Error loading offers/packages:', err)
      }
    }

    loadData()
    // Reload every 2 seconds to catch new/deleted offers
    const interval = setInterval(loadData, 2000)
    return () => clearInterval(interval)
  }, [])

  const packageId = userProfile?.purchases?.citationsPackageId
  const currentRank = getTierRank(packageId)

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

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {TIERS.map(tier => {
        const isCurrent = tier.rank === currentRank
        const isLower = tier.rank < currentRank
        const isUpgrade = tier.rank > currentRank

        // Match offer by tier rank — check if offer has correct directory count OR is named for this tier
        const tierCount = [100, 200, 300][tier.rank - 1]

        const offer = allOffers.find(o => {
          // First try: match by linked package ID + directory count
          const linkedPackage = packages.find(p => p.id === o.tier)
          if (linkedPackage && linkedPackage.count === tierCount) return true

          // Fallback: match by offer's tier name if it follows the pattern
          // This handles cases where tier field might be wrong or the offer name suggests the tier
          const tierNameLower = tier.defaultLabel.toLowerCase()
          const offerNameLower = o.name?.toLowerCase() || ''

          // Check if offer name contains the tier name
          if (offerNameLower.includes(tierNameLower)) {
            return true
          }

          return false
        })

        const linkedPackage = offer && offer.tier ? packages.find(p => p.id === offer.tier) : null
        const displayName = offer?.name || tier.defaultLabel
        const directoryCount = linkedPackage?.count || tierCount
        const description = offer?.description || ''

        return (
          <div
            key={tier.rank}
            className={cn(
              'rounded-xl border p-4 transition-all',
              isCurrent
                ? 'border-hub-green/50 bg-hub-green/5 ring-1 ring-hub-green/20'
                : isLower
                ? 'border-hub-border opacity-35'
                : 'border-hub-border hover:border-hub-blue/40 bg-hub-card/40'
            )}
          >
            {/* Tier name + current badge */}
            <div className="flex items-start justify-between mb-2 gap-2">
              <p className={cn(
                'text-sm font-bold leading-tight',
                isCurrent ? 'text-hub-text' : isLower ? 'text-hub-text-muted' : 'text-hub-text'
              )}>
                {displayName}
              </p>
              {isCurrent && (
                <span className="flex items-center gap-1 text-xs font-semibold text-hub-green bg-hub-green/15 rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Current
                </span>
              )}
            </div>

            {/* Description */}
            {description && (
              <p className={cn(
                'text-xs mb-2 leading-snug',
                isCurrent ? 'text-hub-text-secondary' : isLower ? 'text-hub-text-muted/60' : 'text-hub-text-secondary'
              )}>
                {description}
              </p>
            )}

            {/* Citation count */}
            <div className="mb-3">
              <p className={cn(
                'text-3xl font-black',
                isCurrent ? 'text-hub-green' : isLower ? 'text-hub-text-muted' : 'text-hub-text'
              )}>
                {directoryCount}
              </p>
              <p className="text-xs text-hub-text-muted -mt-0.5">directories</p>
            </div>

            {/* Action area */}
            {isCurrent ? (
              <div className="w-full py-2 rounded-lg bg-hub-green/10 border border-hub-green/25 text-center">
                <p className="text-xs font-semibold text-hub-green">✓ Active</p>
              </div>
            ) : isUpgrade ? (
              offer ? (
                <div>
                  <p className="text-hub-blue font-bold text-base mb-2">
                    ${offer.price}
                    <span className="text-xs font-normal text-hub-text-muted ml-1">
                      {offer.type === 'subscription' ? '/mo' : 'one-time'}
                    </span>
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    loading={purchasing === offer.id}
                    onClick={() => handleUpgrade(offer.id)}
                  >
                    Upgrade Now
                  </Button>
                </div>
              ) : (
                <div className="w-full py-2 rounded-lg bg-hub-input border border-hub-border text-center">
                  <p className="text-xs font-medium text-hub-text-muted">Coming Soon</p>
                </div>
              )
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
