import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { Calendar } from 'lucide-react'

export default function CalendarView() {
  const { hasScheduler } = useBilling()
  if (!hasScheduler) return <ToolGate tool="scheduler" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Content Scheduler</h1>
      <EmptyState icon={Calendar} title="No scheduled posts" description="Schedule your first post using the 'Schedule a Post' tab." />
    </div>
  )
}
