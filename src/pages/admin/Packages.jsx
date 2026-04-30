import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import {
  BookOpen, Users, Calendar, Sparkles, Image,
  Star, TrendingUp, DollarSign,
} from 'lucide-react'

const PACKAGES = [
  {
    group: 'Citations',
    icon: BookOpen,
    color: 'text-hub-blue',
    bg: 'bg-hub-blue/10',
    tiers: [
      { name: 'Starter',  desc: '100 directories',  price: '$97 one-time',  id: 'citations_starter'  },
      { name: 'Pro',      desc: '200 directories',  price: '$147 one-time', id: 'citations_pro'      },
      { name: 'Premium',  desc: '300 directories',  price: '$197 one-time', id: 'citations_premium'  },
    ],
  },
  {
    group: 'Lead Generator',
    icon: Users,
    color: 'text-hub-green',
    bg: 'bg-hub-green/10',
    tiers: [
      { name: '50 Credits',   desc: '50 lead credits',  price: '$47 one-time',  id: 'leads_50'  },
      { name: '150 Credits',  desc: '150 lead credits', price: '$97 one-time',  id: 'leads_150' },
      { name: '500 Credits',  desc: '500 lead credits', price: '$197 one-time', id: 'leads_500' },
    ],
  },
  {
    group: 'Content Scheduler',
    icon: Calendar,
    color: 'text-hub-purple',
    bg: 'bg-hub-purple/10',
    tiers: [
      { name: 'Basic',  desc: '3 accounts, 30 posts/mo', price: '$49/month', id: 'scheduler_basic' },
      { name: 'Pro',    desc: '10 accounts, unlimited',  price: '$99/month', id: 'scheduler_pro'  },
    ],
  },
  {
    group: 'Review Manager',
    icon: Star,
    color: 'text-hub-yellow',
    bg: 'bg-hub-yellow/10',
    tiers: [
      { name: 'Standard', desc: 'Unlimited review requests', price: '$49/month', id: 'reviews_standard' },
    ],
  },
  {
    group: 'Rank Tracker',
    icon: TrendingUp,
    color: 'text-hub-orange',
    bg: 'bg-hub-orange/10',
    tiers: [
      { name: 'Basic',   desc: '50 keywords',   price: '$29/month', id: 'ranktracker_basic'   },
      { name: 'Premium', desc: '200 keywords',  price: '$59/month', id: 'ranktracker_premium' },
    ],
  },
  {
    group: 'Content Calendar',
    icon: Image,
    color: 'text-hub-pink',
    bg: 'bg-hub-pink/10',
    tiers: [
      { name: 'Single Niche', desc: '1 niche, 30 posts',  price: '$97 one-time',  id: 'calendar_single' },
      { name: 'Multi Niche',  desc: '5 niches, 30 posts', price: '$247 one-time', id: 'calendar_multi'  },
    ],
  },
  {
    group: 'AI Creator',
    icon: Sparkles,
    color: 'text-hub-blue',
    bg: 'bg-hub-blue/10',
    note: 'Included with Scheduler Pro',
    tiers: [],
  },
]

export default function AdminPackages() {
  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-hub-text">Packages & Pricing</h1>
        <p className="text-hub-text-secondary text-sm mt-0.5">
          Tool tiers and their Firestore package IDs. Wire Stripe price IDs here when billing goes live.
        </p>
      </div>

      <div className="space-y-5">
        {PACKAGES.map(pkg => (
          <Card key={pkg.group}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-9 h-9 rounded-xl ${pkg.bg} flex items-center justify-center flex-shrink-0`}>
                <pkg.icon className={`w-4.5 h-4.5 ${pkg.color}`} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-hub-text">{pkg.group}</h2>
                {pkg.note && <p className="text-xs text-hub-text-muted">{pkg.note}</p>}
              </div>
            </div>

            {pkg.tiers.length === 0 ? (
              <p className="text-xs text-hub-text-muted italic">No standalone tiers — bundled feature.</p>
            ) : (
              <div className="space-y-2">
                {pkg.tiers.map(tier => (
                  <div
                    key={tier.id}
                    className="flex items-center gap-3 bg-hub-input/60 rounded-lg px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-hub-text">{tier.name}</p>
                      <p className="text-xs text-hub-text-muted">{tier.desc}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-sm font-semibold text-hub-text">{tier.price}</span>
                      <code className="text-[10px] bg-hub-bg border border-hub-border rounded px-2 py-0.5 text-hub-text-muted font-mono">
                        {tier.id}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}
