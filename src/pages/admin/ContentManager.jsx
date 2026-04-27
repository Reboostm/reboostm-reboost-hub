import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { LayoutGrid, Plus } from 'lucide-react'

export default function ContentManager() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Content Manager</h1>
        <Button size="sm"><Plus className="w-4 h-4" /> Upload Content</Button>
      </div>
      <EmptyState
        icon={LayoutGrid}
        title="No content uploaded yet"
        description="Upload Celebrity Calendar content here. It will appear in clients' content libraries based on niche."
      />
    </div>
  )
}
