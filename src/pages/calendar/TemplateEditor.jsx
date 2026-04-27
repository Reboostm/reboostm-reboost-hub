import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { Pencil } from 'lucide-react'

export default function TemplateEditor() {
  const { hasCalendar } = useBilling()
  if (!hasCalendar) return <ToolGate tool="calendar" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Template Editor</h1>
      <EmptyState
        icon={Pencil}
        title="Fabric.js editor"
        description="The drag-and-drop template editor will load here. Coming in next build phase."
      />
    </div>
  )
}
