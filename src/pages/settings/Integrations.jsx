import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { Mail, Globe } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

export default function Integrations() {
  const { userProfile } = useAuth()
  const gmailConnected = !!userProfile?.connectedEmail

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Integrations</h1>

      <div className="space-y-3">
        <Card className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center">
              <Mail className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-hub-text">Gmail</p>
              <p className="text-xs text-hub-text-muted">For review requests and holiday campaigns</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {gmailConnected && <Badge variant="success">Connected</Badge>}
            <Button variant="secondary" size="sm">{gmailConnected ? 'Disconnect' : 'Connect'}</Button>
          </div>
        </Card>

        <Card className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-hub-green/10 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-hub-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-hub-text">Google My Business</p>
              <p className="text-xs text-hub-text-muted">For posting and review responses</p>
            </div>
          </div>
          <Button variant="secondary" size="sm">Connect</Button>
        </Card>
      </div>
    </div>
  )
}
