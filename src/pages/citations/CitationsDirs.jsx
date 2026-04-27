import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import EmptyState from '../../components/ui/EmptyState'
import { BookOpen } from 'lucide-react'

export default function CitationsDirs() {
  const { hasCitations } = useBilling()
  if (!hasCitations) return <ToolGate tool="citations" />

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">My Directories</h1>
      <EmptyState icon={BookOpen} title="Directory list coming soon" description="This will show all directories your business has been submitted to." />
    </div>
  )
}
