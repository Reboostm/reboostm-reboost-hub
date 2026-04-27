import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Globe, Share2, Image, MapPin } from 'lucide-react'

const PLATFORMS = [
  { icon: Share2, label: 'Facebook', color: 'text-blue-500' },
  { icon: Image, label: 'Instagram', color: 'text-pink-400' },
  { icon: Share2, label: 'LinkedIn', color: 'text-blue-400' },
  { icon: Globe, label: 'Google My Business', color: 'text-hub-green' },
  { icon: MapPin, label: 'Google Maps', color: 'text-hub-red' },
]

export default function ConnectedAccounts() {
  const { hasScheduler } = useBilling()
  if (!hasScheduler) return <ToolGate tool="scheduler" />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Connected Accounts</h1>
      <div className="space-y-3">
        {PLATFORMS.map(({ icon: Icon, label, color }) => (
          <Card key={label} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-sm font-medium text-hub-text">{label}</span>
            </div>
            <Button variant="secondary" size="sm">Connect</Button>
          </Card>
        ))}
      </div>
    </div>
  )
}
