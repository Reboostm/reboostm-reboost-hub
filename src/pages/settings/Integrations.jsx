import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { Mail, Globe } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { getGmailAuthUrl, disconnectGmail } from '../../services/functions'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useState } from 'react'

export default function Integrations() {
  const { user, userProfile } = useAuth()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)

  const gmailEmail     = userProfile?.gmailEmail || null
  const gmailConnected = !!userProfile?.gmailRefreshToken

  // Handle redirect back from Google OAuth
  useEffect(() => {
    const status = searchParams.get('gmail')
    if (!status) return

    if (status === 'connected') {
      const email = searchParams.get('email') || ''
      toast(`Gmail connected${email ? `: ${email}` : ''}`, 'success')
    } else if (status === 'denied') {
      toast('Gmail connection cancelled.', 'warning')
    } else if (status === 'error') {
      const msg = searchParams.get('msg') || 'Connection failed.'
      toast(msg, 'error')
    }

    // Clear the query params so a refresh doesn't re-show the toast
    setSearchParams({}, { replace: true })
  }, [])

  async function handleConnect() {
    setConnecting(true)
    try {
      const { url } = await getGmailAuthUrl()
      window.location.href = url
    } catch (err) {
      toast(err?.message || 'Failed to start Gmail connection.', 'error')
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!window.confirm('Disconnect Gmail? Review request emails will stop working until you reconnect.')) return
    setDisconnecting(true)
    try {
      await disconnectGmail()
      toast('Gmail disconnected.', 'success')
    } catch {
      // Fallback: update Firestore directly
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          gmailRefreshToken: null,
          gmailEmail: null,
          gmailConnectedAt: null,
        })
        toast('Gmail disconnected.', 'success')
      } catch {
        toast('Failed to disconnect Gmail.', 'error')
      }
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-hub-text mb-2">Integrations</h1>
      <p className="text-hub-text-secondary text-sm mb-6">
        Connect your accounts to enable email features.
      </p>

      <div className="space-y-3">

        {/* Gmail */}
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-hub-text">Gmail</p>
                {gmailConnected && gmailEmail ? (
                  <p className="text-xs text-hub-text-muted">{gmailEmail}</p>
                ) : (
                  <p className="text-xs text-hub-text-muted">
                    Sends review requests from your own Gmail address
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {gmailConnected && <Badge variant="success">Connected</Badge>}
              {gmailConnected ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  loading={disconnecting}
                  className="text-hub-red"
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleConnect}
                  loading={connecting}
                >
                  {connecting ? 'Redirecting…' : 'Connect Gmail'}
                </Button>
              )}
            </div>
          </div>

          {!gmailConnected && (
            <div className="mt-3 pt-3 border-t border-hub-border">
              <p className="text-xs text-hub-text-muted leading-relaxed">
                <span className="font-medium text-hub-text-secondary">How it works:</span>{' '}
                Clicking "Connect Gmail" opens Google's sign-in. After you approve,
                review request emails will be sent directly from your Gmail — showing your name and address to customers,
                landing in their inbox just like a normal email from you.
              </p>
            </div>
          )}
        </Card>

        {/* Google My Business — placeholder for future */}
        <Card>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-hub-green/10 rounded-xl flex items-center justify-center shrink-0">
                <Globe className="w-5 h-5 text-hub-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-hub-text">Google My Business</p>
                <p className="text-xs text-hub-text-muted">For posting and review responses — coming soon</p>
              </div>
            </div>
            <Badge variant="default">Coming Soon</Badge>
          </div>
        </Card>

      </div>
    </div>
  )
}
