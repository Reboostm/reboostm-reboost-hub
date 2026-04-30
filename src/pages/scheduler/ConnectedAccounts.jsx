import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../hooks/useToast'
import { Share2, Image, Briefcase, MapPin, Link, ExternalLink } from 'lucide-react'

const PLATFORMS = [
  {
    id: 'facebook',
    label: 'Facebook',
    icon: Share2,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    hint: 'Facebook Page account ID from Zernio',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: Image,
    color: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    hint: 'Instagram account ID from Zernio',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    icon: Briefcase,
    color: 'text-sky-400',
    bg: 'bg-sky-400/10',
    border: 'border-sky-400/20',
    hint: 'LinkedIn page or profile ID from Zernio',
  },
  {
    id: 'gmb',
    label: 'Google My Business',
    icon: MapPin,
    color: 'text-hub-green',
    bg: 'bg-hub-green/10',
    border: 'border-hub-green/20',
    hint: 'GMB location ID from Zernio',
  },
]

function ConnectModal({ platform, existing, onClose, onSave }) {
  const [accountName, setAccountName] = useState(existing?.accountName || '')
  const [accountId, setAccountId] = useState(existing?.zernioAccountId || '')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleSave() {
    if (!accountName.trim() || !accountId.trim()) {
      toast('Both fields are required.', 'error')
      return
    }
    setSaving(true)
    try {
      await onSave(platform.id, accountName.trim(), accountId.trim())
      onClose()
    } catch {
      toast('Failed to save connection.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Connect ${platform.label}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>Save Connection</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-hub-input/30 rounded-lg border border-hub-border text-xs text-hub-text-secondary leading-relaxed">
          In your{' '}
          <a
            href="https://zernio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-hub-blue hover:underline inline-flex items-center gap-0.5"
          >
            Zernio dashboard <ExternalLink className="w-3 h-3" />
          </a>
          , connect your {platform.label} account and copy the account ID shown there.
        </div>
        <Input
          label={`${platform.label} Account Name`}
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
          placeholder={`e.g. My Business ${platform.label} Page`}
        />
        <Input
          label="Zernio Account ID"
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          placeholder={platform.hint}
        />
      </div>
    </Modal>
  )
}

export default function ConnectedAccounts() {
  const { hasScheduler } = useBilling()
  const { user } = useAuth()
  const { toast } = useToast()
  const [accounts, setAccounts] = useState({})
  const [connectingPlatform, setConnectingPlatform] = useState(null)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      setAccounts(snap.data()?.connectedAccounts || {})
    })
    return unsub
  }, [user])

  async function handleSave(platformId, accountName, zernioAccountId) {
    await setDoc(doc(db, 'users', user.uid), {
      connectedAccounts: {
        [platformId]: {
          connected: true,
          accountName,
          zernioAccountId,
          connectedAt: serverTimestamp(),
        },
      },
    }, { merge: true })
    toast(`${PLATFORMS.find(p => p.id === platformId)?.label} connected.`, 'success')
  }

  async function handleDisconnect(platform) {
    if (!window.confirm(`Disconnect ${platform.label}? Existing scheduled posts won't be cancelled.`)) return
    try {
      await setDoc(doc(db, 'users', user.uid), {
        connectedAccounts: {
          [platform.id]: { connected: false, accountName: null, zernioAccountId: null },
        },
      }, { merge: true })
      toast(`${platform.label} disconnected.`, 'success')
    } catch {
      toast('Failed to disconnect.', 'error')
    }
  }

  if (!hasScheduler) return <ToolGate tool="scheduler" />

  const connectedCount = PLATFORMS.filter(p => accounts[p.id]?.connected).length

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Connected Accounts</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Connect your social platforms via Zernio to enable post scheduling.
          {connectedCount > 0 && (
            <span className="ml-1 text-hub-green font-medium">
              {connectedCount} of {PLATFORMS.length} connected.
            </span>
          )}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {PLATFORMS.map(platform => {
          const acct = accounts[platform.id]
          const isConnected = !!acct?.connected
          const Icon = platform.icon

          return (
            <div
              key={platform.id}
              className={`rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                isConnected
                  ? `${platform.bg} ${platform.border}`
                  : 'border-hub-border bg-hub-card'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isConnected ? platform.bg : 'bg-hub-input'
              }`}>
                <Icon className={`w-5 h-5 ${isConnected ? platform.color : 'text-hub-text-muted'}`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-hub-text">{platform.label}</span>
                  {isConnected && <Badge variant="success" size="sm">Connected</Badge>}
                </div>
                <p className="text-xs text-hub-text-muted mt-0.5 truncate">
                  {isConnected ? (acct.accountName || 'Connected') : 'Not connected'}
                </p>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Button size="sm" variant="ghost" onClick={() => setConnectingPlatform(platform)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDisconnect(platform)}>
                      <span className="text-hub-red text-xs">Disconnect</span>
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setConnectingPlatform(platform)}>
                    <Link className="w-3.5 h-3.5 mr-1.5" /> Connect
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 bg-hub-input/30 rounded-xl border border-hub-border">
        <p className="text-xs text-hub-text-secondary leading-relaxed">
          <strong className="text-hub-text">How it works:</strong> ReBoost Hub uses{' '}
          <a
            href="https://zernio.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-hub-blue hover:underline"
          >
            Zernio
          </a>{' '}
          to publish posts to your social platforms. Sign up for Zernio ($49/mo), connect your
          accounts there, then paste each account's ID here. Posts you schedule in ReBoost Hub
          are sent to Zernio automatically at your chosen time.
        </p>
      </div>

      {connectingPlatform && (
        <ConnectModal
          platform={connectingPlatform}
          existing={accounts[connectingPlatform.id]}
          onClose={() => setConnectingPlatform(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
