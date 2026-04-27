import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { TrendingUp, Plus } from 'lucide-react'

export default function Keywords() {
  const { hasRankTracker } = useBilling()
  if (!hasRankTracker) return <ToolGate tool="rankTracker" />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">My Keywords</h1>
        <Button size="sm"><Plus className="w-4 h-4" /> Add Keyword</Button>
      </div>
      <EmptyState
        icon={TrendingUp}
        title="No keywords tracked yet"
        description="Add keywords to start tracking your local search rankings week over week."
      />
    </div>
  )
}
