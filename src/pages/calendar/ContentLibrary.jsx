import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { LayoutGrid } from 'lucide-react'

export default function ContentLibrary() {
  const { hasCalendar } = useBilling()
  if (!hasCalendar) return <ToolGate tool="calendar" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Content Library</h1>
      <EmptyState
        icon={LayoutGrid}
        title="No content yet"
        description="Your niche-specific content templates will appear here once loaded by the admin."
      />
    </div>
  )
}
