import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { Users } from 'lucide-react'

export default function MyLeads() {
  const { hasLeadCredits } = useBilling()
  if (!hasLeadCredits) return <ToolGate tool="leads" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">My Lead Lists</h1>
      <EmptyState icon={Users} title="No saved lead lists" description="Run a search to generate and save a lead list." />
    </div>
  )
}
