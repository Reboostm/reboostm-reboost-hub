import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { BarChart2 } from 'lucide-react'

export default function RankingsReport() {
  const { hasRankTracker } = useBilling()
  if (!hasRankTracker) return <ToolGate tool="rankTracker" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Rankings Report</h1>
      <EmptyState icon={BarChart2} title="No ranking data yet" description="Rankings are tracked weekly. Add keywords to see your position trends." />
    </div>
  )
}
