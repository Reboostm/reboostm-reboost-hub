import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useBilling } from '../../hooks/useBilling'
import { redirectToPortal } from '../../services/stripe'
import { useToast } from '../../hooks/useToast'
import { useState } from 'react'
import { CreditCard } from 'lucide-react'

export default function Billing() {
  const billing = useBilling()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const openPortal = async () => {
    setLoading(true)
    try {
      await redirectToPortal()
    } catch (err) {
      const msg = err.message?.includes('No Stripe customer')
        ? 'Complete a purchase first to access the billing portal.'
        : 'Could not open billing portal. Please try again.'
      toast(msg, 'error')
      setLoading(false)
    }
  }

  const subs = [
    { label: 'Content Scheduler', active: billing.hasScheduler, tier: billing.subscriptions.scheduler?.tier },
    { label: 'Review Manager', active: billing.hasReviewManager },
    { label: 'Rank Tracker', active: billing.hasRankTracker },
  ]

  const purchases = [
    { label: 'Citations Package', active: billing.hasCitations },
    { label: 'Lead Credits', value: billing.leadCredits > 0 ? `${billing.leadCredits} remaining` : null },
    { label: 'Content Calendar', active: billing.hasCalendar },
    { label: 'Outreach Templates', active: billing.hasOutreachTemplates },
  ]

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Billing</h1>

      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-hub-text">Stripe Billing Portal</h2>
            <p className="text-xs text-hub-text-muted mt-0.5">Manage subscriptions, download invoices, update payment method.</p>
          </div>
          <Button variant="secondary" size="sm" loading={loading} onClick={openPortal}>
            <CreditCard className="w-4 h-4" /> Manage
          </Button>
        </div>
      </Card>

      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-hub-text mb-4">Subscriptions</h2>
        <div className="space-y-2">
          {subs.map(s => (
            <div key={s.label} className="flex items-center justify-between py-2 border-b border-hub-border last:border-0">
              <span className="text-sm text-hub-text-secondary">{s.label}</span>
              <div className="flex items-center gap-2">
                {s.tier && <span className="text-xs text-hub-text-muted capitalize">{s.tier}</span>}
                <Badge variant={s.active ? 'success' : 'locked'}>{s.active ? 'Active' : 'Inactive'}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-hub-text mb-4">One-Time Purchases</h2>
        <div className="space-y-2">
          {purchases.map(p => (
            <div key={p.label} className="flex items-center justify-between py-2 border-b border-hub-border last:border-0">
              <span className="text-sm text-hub-text-secondary">{p.label}</span>
              {p.value
                ? <span className="text-xs text-hub-blue">{p.value}</span>
                : <Badge variant={p.active ? 'success' : 'locked'}>{p.active ? 'Purchased' : 'Not purchased'}</Badge>
              }
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
