import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { Users } from 'lucide-react'

const NICHES = [
  { value: 'plumber', label: 'Plumber' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'dentist', label: 'Dentist' },
  { value: 'roofer', label: 'Roofer' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'restaurant', label: 'Restaurant' },
]

export default function LeadFinder() {
  const { hasLeadCredits, leadCredits } = useBilling()
  if (!hasLeadCredits) return <ToolGate tool="leads" />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Lead Generator</h1>
          <p className="text-hub-text-secondary text-sm mt-1">Scrape Google Maps for qualified local business leads.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-hub-text-muted">Credits remaining</p>
          <p className="text-lg font-bold text-hub-blue">{leadCredits}</p>
        </div>
      </div>

      <Card>
        <div className="space-y-4">
          <Select label="Business niche" options={NICHES} placeholder="Select niche…" />
          <Input label="City + State" placeholder="Salt Lake City, UT" />
          <Input label="Radius (miles)" type="number" placeholder="25" defaultValue="25" />
          <Button className="w-full" size="lg">
            Find Leads
          </Button>
        </div>
      </Card>

      <div className="mt-8">
        <EmptyState icon={Users} title="No results yet" description="Search above to find leads in your target market." />
      </div>
    </div>
  )
}
