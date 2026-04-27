import { Lock } from 'lucide-react'
import Button from './Button'
import { redirectToCheckout, PRICES } from '../../services/stripe'
import { useState } from 'react'
import { useToast } from '../../hooks/useToast'

const TOOL_INFO = {
  citations: {
    name: 'Citations Manager',
    description: 'Get your business listed in 100–300+ directories. Proven to boost local SEO and drive more calls.',
    plans: [
      { label: 'Starter — 100 directories', priceId: PRICES.citations_starter, price: '$97 one-time' },
      { label: 'Pro — 200 directories', priceId: PRICES.citations_pro, price: '$147 one-time' },
      { label: 'Premium — 300+ directories', priceId: PRICES.citations_premium, price: '$197 one-time' },
    ],
  },
  leads: {
    name: 'Lead Generator',
    description: 'Scrape Google Maps for qualified local business leads. Export as CSV, build outreach sequences.',
    plans: [
      { label: '100 lead credits', priceId: PRICES.lead_credits_100, price: '$29 one-time' },
      { label: '500 lead credits', priceId: PRICES.lead_credits_500, price: '$99 one-time' },
    ],
  },
  scheduler: {
    name: 'Content Scheduler',
    description: 'Schedule and auto-publish posts across Facebook, Instagram, LinkedIn, GMB, and more.',
    plans: [
      { label: 'Basic — 3 platforms', priceId: PRICES.scheduler_basic, price: '$47/mo' },
      { label: 'Pro — all platforms + AI Creator', priceId: PRICES.scheduler_pro, price: '$97/mo' },
    ],
  },
  creator: {
    name: 'AI Content Creator',
    description: 'Generate ready-to-post captions and images with AI. Included in the Scheduler Pro plan.',
    plans: [
      { label: 'Scheduler Pro (includes AI Creator)', priceId: PRICES.scheduler_pro, price: '$97/mo' },
    ],
  },
  calendar: {
    name: 'Celebrity Content Calendar',
    description: 'Niche-specific content library with Fabric.js editor. Auto-populates your business info.',
    plans: [
      { label: 'One niche — lifetime access', priceId: PRICES.calendar_niche, price: '$197 one-time' },
    ],
  },
  reviewManager: {
    name: 'Review Manager',
    description: 'Monitor Google & Yelp reviews, respond directly, and send automated review request campaigns.',
    plans: [
      { label: 'Review Manager', priceId: PRICES.review_manager, price: '$67/mo' },
    ],
  },
  rankTracker: {
    name: 'Local Rank Tracker',
    description: 'Track your keyword positions week over week. Prove SEO ROI with before/after ranking charts.',
    plans: [
      { label: 'Rank Tracker', priceId: PRICES.rank_tracker, price: '$47/mo' },
    ],
  },
}

export default function ToolGate({ tool }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(null)
  const info = TOOL_INFO[tool]

  if (!info) return null

  const handleBuy = async (plan) => {
    if (!plan.priceId) {
      toast('Pricing not yet configured — contact support.', 'warning')
      return
    }
    setLoading(plan.priceId)
    try {
      await redirectToCheckout(plan.priceId, 'payment')
    } catch {
      toast('Could not start checkout. Please try again.', 'error')
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-lg w-full text-center">
        <div className="w-16 h-16 bg-hub-card border border-hub-border rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-hub-text-muted" />
        </div>
        <h2 className="text-2xl font-semibold text-hub-text mb-3">{info.name}</h2>
        <p className="text-hub-text-secondary mb-8 leading-relaxed">{info.description}</p>

        <div className="flex flex-col gap-3">
          {info.plans.map(plan => (
            <div
              key={plan.label}
              className="flex items-center justify-between bg-hub-card border border-hub-border rounded-xl px-5 py-4"
            >
              <div className="text-left">
                <p className="text-sm font-medium text-hub-text">{plan.label}</p>
                <p className="text-hub-blue font-semibold mt-0.5">{plan.price}</p>
              </div>
              <Button
                size="sm"
                loading={loading === plan.priceId}
                onClick={() => handleBuy(plan)}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
