import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { Package, Plus } from 'lucide-react'

export default function AdminPackages() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Packages & Pricing</h1>
        <Button size="sm"><Plus className="w-4 h-4" /> Add Package</Button>
      </div>
      <EmptyState
        icon={Package}
        title="Package management"
        description="Configure Stripe price IDs for each package here. Coming in next admin build phase."
      />
    </div>
  )
}
