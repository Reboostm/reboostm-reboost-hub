import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card from '../../components/ui/Card'
import EmptyState from '../../components/ui/EmptyState'
import { PlusCircle } from 'lucide-react'

export default function SchedulePost() {
  const { hasScheduler } = useBilling()
  if (!hasScheduler) return <ToolGate tool="scheduler" />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Schedule a Post</h1>
      <Card>
        <EmptyState icon={PlusCircle} title="Post composer coming soon" description="Connect your social accounts first, then compose and schedule posts here." />
      </Card>
    </div>
  )
}
