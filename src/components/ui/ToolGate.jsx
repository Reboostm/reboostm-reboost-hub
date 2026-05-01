import { Lock, Loader2 } from 'lucide-react'
import Button from './Button'
import { redirectToCheckout } from '../../services/stripe'
import { useState, useEffect } from 'react'
import { useToast } from '../../hooks/useToast'
import { db } from '../../services/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

const TOOL_NAMES = {
  citations: 'Citations Manager',
  leadCredits: 'Lead Generator',
  scheduler: 'Content Scheduler',
  creator: 'AI Content Creator',
  calendar: 'Celebrity Content Calendar',
  reviewManager: 'Review Manager',
  rankTracker: 'Local Rank Tracker',
  outreachTemplates: 'Outreach Templates',
}

const TOOL_DESCRIPTIONS = {
  citations: 'Get your business listed in 100–300+ directories. Proven to boost local SEO and drive more calls.',
  leadCredits: 'Scrape Google Maps for qualified local business leads. Export as CSV, build outreach sequences.',
  scheduler: 'Schedule and auto-publish posts across Facebook, Instagram, LinkedIn, GMB, and more.',
  creator: 'Generate ready-to-post captions and images with AI. Included in the Scheduler Pro plan.',
  calendar: 'Niche-specific content library with Fabric.js editor. Auto-populates your business info.',
  reviewManager: 'Monitor Google & Yelp reviews, respond directly, and send automated review request campaigns.',
  rankTracker: 'Track your keyword positions week over week. Prove SEO ROI with before/after ranking charts.',
  outreachTemplates: 'AI-generated 3-email cold outreach sequence tailored to your niche. Turn leads into booked calls.',
}

export default function ToolGate({ tool }) {
  const { toast } = useToast()
  const [plans, setPlans] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(true)
  const [purchasing, setPurchasing] = useState(null)
  const toolName = TOOL_NAMES[tool]
  const description = TOOL_DESCRIPTIONS[tool]

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const q = query(
          collection(db, 'offers'),
          where('unlocksFeature', '==', tool),
          where('active', '==', true)
        )
        const snap = await getDocs(q)
        const offers = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setPlans(offers)
      } catch (err) {
        console.error('Failed to load offers:', err)
      } finally {
        setLoadingOffers(false)
      }
    }

    loadOffers()
    // Reload every 2 seconds to catch deleted offers immediately
    const interval = setInterval(loadOffers, 2000)
    return () => clearInterval(interval)
  }, [tool])

  const handleBuy = async (offerId) => {
    if (!offerId) {
      toast('Offer not found.', 'warning')
      return
    }
    setPurchasing(offerId)
    try {
      await redirectToCheckout(offerId)
    } catch {
      toast('Could not start checkout. Please try again.', 'error')
      setPurchasing(null)
    }
  }

  if (!toolName) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-hub-card border border-hub-border rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-hub-text-muted" />
        </div>
        <h2 className="text-2xl font-semibold text-hub-text mb-3">{toolName}</h2>
        <p className="text-hub-text-secondary mb-8 leading-relaxed">{description}</p>

        {loadingOffers ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
          </div>
        ) : plans.length === 0 ? (
          <p className="text-hub-text-muted text-sm">Pricing not available yet. Check back soon!</p>
        ) : (
          <div className="flex flex-col gap-3">
            {plans.map(plan => (
              <div
                key={plan.id}
                className="flex items-center justify-between bg-hub-card border border-hub-border rounded-xl px-5 py-4"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-hub-text">{plan.name}</p>
                  <p className="text-hub-blue font-semibold mt-0.5">
                    ${plan.price} {plan.type === 'subscription' ? '/mo' : 'one-time'}
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={!plan.stripePriceId}
                  loading={purchasing === plan.id}
                  onClick={() => handleBuy(plan.id)}
                >
                  {plan.stripePriceId ? 'Get Started' : 'Coming Soon'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
