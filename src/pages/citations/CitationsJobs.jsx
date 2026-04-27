import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { Activity } from 'lucide-react'

export default function CitationsJobs() {
  const { hasCitations } = useBilling()
  if (!hasCitations) return <ToolGate tool="citations" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Jobs & Progress</h1>
      <EmptyState icon={Activity} title="No active jobs" description="When you purchase a citations package, your submission jobs will appear here." />
    </div>
  )
}
