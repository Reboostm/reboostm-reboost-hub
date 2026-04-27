import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { Star } from 'lucide-react'

export default function AllReviews() {
  const { hasReviewManager } = useBilling()
  if (!hasReviewManager) return <ToolGate tool="reviewManager" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">All Reviews</h1>
      <EmptyState icon={Star} title="No reviews yet" description="Connect your Google My Business account to start monitoring reviews." />
    </div>
  )
}
