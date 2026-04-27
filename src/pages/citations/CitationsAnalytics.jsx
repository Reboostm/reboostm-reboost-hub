import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { BarChart2 } from 'lucide-react'

export default function CitationsAnalytics() {
  const { hasCitations } = useBilling()
  if (!hasCitations) return <ToolGate tool="citations" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Citations Analytics</h1>
      <EmptyState icon={BarChart2} title="No data yet" description="Analytics will populate once your first citations job completes." />
    </div>
  )
}
