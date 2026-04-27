import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { BookOpen } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'

export default function CitationsHome() {
  const { hasCitations } = useBilling()

  if (!hasCitations) return <ToolGate tool="citations" />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Citations</h1>
          <p className="text-hub-text-secondary text-sm mt-1">Track your directory submissions and job status.</p>
        </div>
        <Badge variant="success">Active</Badge>
      </div>
      <EmptyState
        icon={BookOpen}
        title="Citations module loading"
        description="Citation tracking and job management coming in the next build phase."
      />
    </div>
  )
}
