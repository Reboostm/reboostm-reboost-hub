import { useState, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { getActiveOffers } from '../services/stripe'
import { redirectToCheckout } from '../services/stripe'
import { useToast } from '../hooks/useToast'

const FEATURE_LABELS = {
  scheduler: 'Content Scheduler',
  reviewManager: 'Review Manager',
  rankTracker: 'Rank Tracker',
  citations: 'Citations Package',
  leadCredits: 'Lead Credits',
  calendar: 'Content Calendar',
  outreachTemplates: 'Outreach Templates',
}

const FEATURE_COLORS = {
  scheduler: 'hub-purple',
  reviewManager: 'hub-yellow',
  rankTracker: 'hub-orange',
  citations: 'hub-blue',
  leadCredits: 'hub-green',
  calendar: 'hub-pink',
  outreachTemplates: 'hub-blue',
}

export default function Pricing() {
  const { toast } = useToast()
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(null)

  useEffect(() => {
    getActiveOffers()
      .then(setOffers)
      .catch(err => {
        console.error('Failed to load offers:', err)
        toast('Failed to load pricing options.', 'error')
      })
      .finally(() => setLoading(false))
  }, [])

  const handlePurchase = async (offerId, offerName) => {
    setPurchasing(offerId)
    try {
      await redirectToCheckout(offerId)
    } catch (err) {
      console.error('Checkout failed:', err)
      toast(`Could not start checkout for ${offerName}. Try again.`, 'error')
      setPurchasing(null)
    }
  }

  const groupedByFeature = {}
  offers.forEach(offer => {
    if (!groupedByFeature[offer.unlocksFeature]) {
      groupedByFeature[offer.unlocksFeature] = []
    }
    groupedByFeature[offer.unlocksFeature].push(offer)
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-hub-text mb-2">Upgrade Your Tools</h1>
        <p className="text-hub-text-secondary text-lg">Choose the right plan for your business</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-hub-text-muted" />
        </div>
      ) : Object.keys(groupedByFeature).length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-hub-text-muted">No pricing plans available yet.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByFeature).map(([feature, featureOffers]) => (
            <div key={feature}>
              <h2 className="text-xl font-semibold text-hub-text mb-4">
                {FEATURE_LABELS[feature] || feature}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featureOffers.map(offer => (
                  <Card key={offer.id} className="flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-hub-text">{offer.name}</h3>
                      <p className="text-sm text-hub-text-secondary mt-1">{offer.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-3xl font-bold text-hub-text">${offer.price}</span>
                      <span className="text-sm text-hub-text-muted">
                        {offer.type === 'subscription' ? '/month' : 'one-time'}
                      </span>
                    </div>

                    <div className="mb-6 flex-1">
                      <Badge variant={offer.stripePriceId ? 'success' : 'warning'} className="mb-3">
                        {offer.stripePriceId ? 'Ready to purchase' : 'Coming soon'}
                      </Badge>
                      {offer.tier && (
                        <p className="text-xs text-hub-text-muted capitalize">Tier: {offer.tier}</p>
                      )}
                    </div>

                    <Button
                      onClick={() => handlePurchase(offer.id, offer.name)}
                      disabled={!offer.stripePriceId || purchasing === offer.id}
                      className="w-full"
                      size="sm"
                      loading={purchasing === offer.id}
                    >
                      {offer.stripePriceId ? 'Get Started' : 'Coming Soon'}
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 text-center text-sm text-hub-text-secondary">
        <p>All purchases include 30-day money-back guarantee</p>
      </div>
    </div>
  )
}
