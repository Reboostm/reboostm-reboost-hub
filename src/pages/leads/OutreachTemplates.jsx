import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { Mail } from 'lucide-react'

export default function OutreachTemplates() {
  const { hasOutreachTemplates } = useBilling()
  if (!hasOutreachTemplates) return <ToolGate tool="leads" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Outreach Templates</h1>
      <EmptyState icon={Mail} title="No templates yet" description="Generate AI outreach sequences from your lead finder results." />
    </div>
  )
}
