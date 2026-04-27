import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { Send } from 'lucide-react'

export default function ReviewRequests() {
  const { hasReviewManager } = useBilling()
  if (!hasReviewManager) return <ToolGate tool="reviewManager" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Send Review Requests</h1>
      <EmptyState icon={Send} title="Review request campaigns" description="Paste a customer email list and send automated review request emails via your Gmail." />
    </div>
  )
}
