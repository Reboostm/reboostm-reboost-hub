import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card from '../../components/ui/Card'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import { Sparkles } from 'lucide-react'

const PLATFORMS = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'gmb', label: 'Google My Business' },
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly', label: 'Friendly & Casual' },
  { value: 'urgent', label: 'Urgency / Promo' },
  { value: 'educational', label: 'Educational' },
]

export default function GenerateContent() {
  const { hasAICreator } = useBilling()
  if (!hasAICreator) return <ToolGate tool="creator" />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">AI Content Creator</h1>
      <Card>
        <div className="space-y-4">
          <Textarea label="Describe the post" placeholder="e.g. Promote our spring HVAC tune-up special — $79 this month only" rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Platform" options={PLATFORMS} placeholder="Select platform…" />
            <Select label="Tone" options={TONES} placeholder="Select tone…" />
          </div>
          <Button className="w-full" size="lg">
            <Sparkles className="w-4 h-4" /> Generate Content
          </Button>
        </div>
      </Card>
    </div>
  )
}
