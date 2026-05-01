import { useState, useEffect, useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { redirectToCheckout } from '../../services/stripe'
import { cn } from '../../utils/cn'
import { db } from '../../services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

export default function CitationsPackageBar() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const [allOffers, setAllOffers] = useState([])
  const [packages, setPackages] = useState([])
  const [purchasing, setPurchasing] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all active citation offers
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

  // Get the current package's directory count
  const userPackageDoc = packages.find(p => p.id === packageId)
  const userPackageCount = userPackageDoc?.count || 0

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

  // Sort offers by directory count (via linked package)
  const sortedOffers = useMemo(() => {
    return allOffers
      .map(offer => {
        const linkedPkg = packages.find(p => p.id === offer.tier)
        return {
          ...offer,
          directoryCount: linkedPkg?.count || 0,
          aggregatorReach: linkedPkg?.aggregatorReach || 0,
          totalReach: linkedPkg?.totalReach || linkedPkg?.count || 0,
        }
      })
      .sort((a, b) => a.directoryCount - b.directoryCount)
  }, [allOffers, packages])

  // Build the display list:
  // - Base offers form the tier spine (one per package level)
  // - At/below current tier → show base offer (Active or greyed)
  // - Above current tier → swap in the matching upgrade offer if one exists, else fall back to base
  const displayOffers = useMemo(() => {
    const baseOffers = sortedOffers.filter(o => !o.isUpgrade)
    const upgradeOffers = sortedOffers.filter(o => o.isUpgrade)

    if (!packageId) return baseOffers

    return baseOffers.map(base => {
      if (base.directoryCount > userPackageCount) {
        const upgradeForTier = upgradeOffers.find(u => u.tier === base.tier)
        return upgradeForTier || base
      }
      return base
    })
  }, [sortedOffers, packageId, userPackageCount])

  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      {displayOffers.length === 0 ? (
        <div className="col-span-3 text-center py-8 text-hub-text-muted text-sm">
          No citation packages available
        </div>
      ) : (
        displayOffers.map(offer => {
          const isCurrent = offer.tier === packageId
          const isUpgrade = (offer.directoryCount || 0) > userPackageCount
          const isLower = (offer.directoryCount || 0) < userPackageCount

          return (
            <div
              key={offer.id}
              className={cn(
                'rounded-xl border p-4 transition-all',
                isCurrent
                  ? 'border-hub-green/50 bg-hub-green/5 ring-1 ring-hub-green/20'
                  : isLower
                  ? 'border-hub-border opacity-35'
                  : 'border-hub-border hover:border-hub-blue/40 bg-hub-card/40'
              )}
            >
              {/* Offer name + current badge */}
              <div className="flex items-start justify-between mb-2 gap-2">
                <p className={cn(
                  'text-sm font-bold leading-tight',
                  isCurrent ? 'text-hub-text' : isLower ? 'text-hub-text-muted' : 'text-hub-text'
                )}>
                  {offer.name}
                </p>
                {isCurrent && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-hub-green bg-hub-green/15 rounded-full px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                    Current
                  </span>
                )}
              </div>

              {/* Description */}
              {offer.description && (
                <p className={cn(
                  'text-xs mb-2 leading-snug',
                  isCurrent ? 'text-hub-text-secondary' : isLower ? 'text-hub-text-muted/60' : 'text-hub-text-secondary'
                )}>
                  {offer.description}
                </p>
              )}

              {/* Directory count + aggregator reach */}
              <div className="mb-3">
                <p className={cn(
                  'text-3xl font-black',
                  isCurrent ? 'text-hub-green' : isLower ? 'text-hub-text-muted' : 'text-hub-text'
                )}>
                  {offer.totalReach > offer.directoryCount ? `${offer.totalReach}+` : offer.directoryCount}
                </p>
                <p className="text-xs text-hub-text-muted -mt-0.5">total business listings</p>
                {offer.aggregatorReach > 0 && (
                  <p className="text-xs text-hub-text-muted/70 mt-0.5">
                    {offer.directoryCount} direct + {offer.aggregatorReach} via networks
                  </p>
                )}
              </div>

              {/* Action area */}
              {isCurrent ? (
                <div className="w-full py-2 rounded-lg bg-hub-green/10 border border-hub-green/25 text-center">
                  <p className="text-xs font-semibold text-hub-green">✓ Active</p>
                </div>
              ) : isUpgrade ? (
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
              ) : null}
            </div>
          )
        })
      )}
    </div>
  )
}
