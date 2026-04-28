import { useState, useEffect } from 'react'
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useToast } from '../../hooks/useToast'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { Key, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, ExternalLink, Info } from 'lucide-react'

const MAPS_KEYS_DOC = doc(db, 'settings', 'googleMapsKeys')

// Firebase Function env vars that need to be set manually
const ENV_VARS = [
  {
    key: 'GOOGLE_PLACES_KEY',
    purpose: 'SEO Audit GMB check · Lead Generator key rotation · Review Manager (fetchReviews)',
    required: true,
    where: 'All Cloud Functions that call Google Places API',
  },
  {
    key: 'PAGESPEED_API_KEY',
    purpose: 'SEO Audit — raises PageSpeed API quota from 400/day to 25,000/day',
    required: false,
    where: 'runSeoAudit function',
  },
  {
    key: 'ZERNIO_API_KEY',
    purpose: 'Content Scheduler — publishes posts to social platforms via Zernio ($49/mo plan)',
    required: true,
    where: 'schedulePost · cancelPost functions',
  },
  {
    key: 'ANTHROPIC_API_KEY',
    purpose: 'AI Content Creator — generates social media captions (Scheduler Pro feature)',
    required: false,
    where: 'generateAIContent function',
  },
  {
    key: 'OPENAI_API_KEY',
    purpose: 'AI Image Generator — creates images via DALL-E 3 (Scheduler Pro feature)',
    required: false,
    where: 'generateAIImage function',
  },
  {
    key: 'SENDGRID_API_KEY',
    purpose: 'Review Manager — sends review request emails to customers via SendGrid',
    required: false,
    where: 'sendReviewRequest function',
  },
  {
    key: 'SERPAPI_KEY',
    purpose: 'Rank Tracker — checks Google keyword rankings via SerpAPI (serpapi.com, $50/mo for 5k searches)',
    required: false,
    where: 'checkKeywordRank function',
  },
  {
    key: 'TWOCAPTCHA_API_KEY',
    purpose: 'Citations Builder — solves CAPTCHAs during automated citation submissions',
    required: false,
    where: 'Cloud Run Citations automation service',
  },
]

function UsageBar({ used, limit }) {
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const color = pct >= 90 ? 'bg-hub-red' : pct >= 70 ? 'bg-hub-yellow' : 'bg-hub-green'
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-hub-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-hub-text-muted whitespace-nowrap">{used} / {limit}</span>
    </div>
  )
}

export default function AdminApiKeys() {
  const { toast } = useToast()
  const [keysData, setKeysData] = useState(null)
  const [loading, setLoading] = useState(true)

  // Add/edit key form state
  const [showForm, setShowForm] = useState(false)
  const [editingIdx, setEditingIdx] = useState(null)
  const [newLabel, setNewLabel] = useState('')
  const [newKey, setNewKey] = useState('')
  const [newLimit, setNewLimit] = useState('500')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(MAPS_KEYS_DOC, snap => {
      if (snap.exists()) {
        setKeysData(snap.data())
      } else {
        setKeysData({ keys: [], lastResetMonth: null })
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function saveKeys(updatedKeys) {
    await setDoc(MAPS_KEYS_DOC, {
      keys: updatedKeys,
      lastResetMonth: keysData?.lastResetMonth ?? null,
    }, { merge: true })
  }

  function openAddForm() {
    setEditingIdx(null)
    setNewLabel('')
    setNewKey('')
    setNewLimit('1800')
    setShowForm(true)
  }

  function openEditForm(idx) {
    const k = keysData.keys[idx]
    setEditingIdx(idx)
    setNewLabel(k.label || '')
    setNewKey(k.key)
    setNewLimit(String(k.limit || 1800))
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingIdx(null)
    setNewLabel('')
    setNewKey('')
    setNewLimit('1800')
  }

  async function handleSaveKey(e) {
    e.preventDefault()
    if (!newLabel.trim() || !newKey.trim()) {
      toast('Label and API key are required.', 'error')
      return
    }
    const limit = parseInt(newLimit, 10) || 1800
    setSaving(true)
    try {
      let updated
      if (editingIdx !== null) {
        // Edit existing key
        updated = keysData.keys.map((k, i) =>
          i === editingIdx
            ? { ...k, label: newLabel.trim(), key: newKey.trim(), limit }
            : k
        )
        await saveKeys(updated)
        toast('API key updated.', 'success')
      } else {
        // Add new key
        updated = [
          ...(keysData?.keys || []),
          { key: newKey.trim(), label: newLabel.trim(), usageThisMonth: 0, limit, active: true },
        ]
        await saveKeys(updated)
        toast('API key added.', 'success')
      }
      closeForm()
    } catch {
      toast('Failed to save key.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(idx) {
    const updated = keysData.keys.map((k, i) =>
      i === idx ? { ...k, active: !k.active } : k
    )
    try {
      await saveKeys(updated)
    } catch {
      toast('Failed to update key.', 'error')
    }
  }

  async function deleteKey(idx) {
    if (!window.confirm('Delete this API key?')) return
    const updated = keysData.keys.filter((_, i) => i !== idx)
    try {
      await saveKeys(updated)
      toast('Key deleted.', 'success')
    } catch {
      toast('Failed to delete key.', 'error')
    }
  }

  async function resetUsage(idx) {
    const updated = keysData.keys.map((k, i) =>
      i === idx ? { ...k, usageThisMonth: 0 } : k
    )
    try {
      await saveKeys(updated)
      toast('Usage reset to 0.', 'success')
    } catch {
      toast('Failed to reset usage.', 'error')
    }
  }

  const keys = keysData?.keys || []
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">API Keys</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Manage Google Maps API key rotation and view required Firebase Function environment variables.
        </p>
      </div>

      {/* ── Google Maps Key Pool ─────────────────────────────── */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Maps API Keys</CardTitle>
              <p className="text-xs text-hub-text-muted mt-0.5">
                Used by the Lead Generator. Google's $200/mo free credit covers ~500 searches per key
                (each search = up to 20 leads). System auto-picks the active key with lowest usage and
                skips any key that hits its limit.
              </p>
            </div>
            <Button size="sm" onClick={openAddForm}>
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Key
            </Button>
          </div>
        </CardHeader>

        {/* Add/edit key form */}
        {showForm && (
          <form onSubmit={handleSaveKey} className="mb-4 p-4 bg-hub-input/30 rounded-xl border border-hub-border space-y-3">
            <h3 className="text-sm font-medium text-hub-text">
              {editingIdx !== null ? 'Edit Google Maps API Key' : 'New Google Maps API Key'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Label"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="e.g. Key #1 (Gmail account)"
              />
              <Input
                label="API Key"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                placeholder="AIzaSy..."
              />
              <Input
                label="Monthly call limit"
                type="number"
                value={newLimit}
                onChange={e => setNewLimit(e.target.value)}
                placeholder="1800"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={saving}>
                {editingIdx !== null ? 'Update Key' : 'Save Key'}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={closeForm}>Cancel</Button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center gap-3 py-6">
            <Spinner size="sm" />
            <span className="text-sm text-hub-text-secondary">Loading keys…</span>
          </div>
        ) : keys.length === 0 ? (
          <div className="py-8 text-center">
            <Key className="w-8 h-8 text-hub-text-muted mx-auto mb-3" />
            <p className="text-sm text-hub-text-secondary mb-1">No Google Maps keys configured yet.</p>
            <p className="text-xs text-hub-text-muted">
              Add at least one key to enable the Lead Generator search.
              Get a key at{' '}
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-hub-blue hover:underline">
                console.cloud.google.com
              </a>
              {' '}— enable <strong>Places API</strong>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-hub-text-muted">Usage resets monthly · Current period: {currentMonth}</p>
              <span className="text-xs text-hub-text-muted">{keys.filter(k => k.active).length} of {keys.length} active</span>
            </div>
            {keys.map((k, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-colors ${
                  k.active ? 'border-hub-border bg-hub-card' : 'border-hub-border/50 bg-hub-card/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-hub-text">{k.label || `Key ${i + 1}`}</span>
                      <Badge variant={k.active ? 'success' : 'gray'} size="sm">
                        {k.active ? 'Active' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-xs text-hub-text-muted font-mono truncate">
                      {k.key.substring(0, 12)}…{k.key.slice(-4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Edit key"
                      onClick={() => openEditForm(i)}
                    >
                      <span className="text-xs">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Reset usage to 0"
                      onClick={() => resetUsage(i)}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title={k.active ? 'Disable key' : 'Enable key'}
                      onClick={() => toggleActive(i)}
                    >
                      {k.active
                        ? <ToggleRight className="w-4 h-4 text-hub-green" />
                        : <ToggleLeft className="w-4 h-4 text-hub-text-muted" />
                      }
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Delete key"
                      onClick={() => deleteKey(i)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-hub-red" />
                    </Button>
                  </div>
                </div>
                <UsageBar used={k.usageThisMonth || 0} limit={k.limit || 1800} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Firebase Function Env Vars ───────────────────────── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Firebase Function Environment Variables</CardTitle>
            <p className="text-xs text-hub-text-muted mt-0.5">
              These must be set in the{' '}
              <a
                href="https://console.firebase.google.com/project/reboost-hub/functions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-hub-blue hover:underline inline-flex items-center gap-0.5"
              >
                Firebase Console <ExternalLink className="w-3 h-3" />
              </a>
              {' '}→ Functions → select the function → Edit → Runtime environment variables.
            </p>
          </div>
        </CardHeader>

        <div className="space-y-3">
          {ENV_VARS.map(v => (
            <div key={v.key} className="p-4 rounded-xl border border-hub-border bg-hub-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-mono text-hub-blue">{v.key}</code>
                    <Badge variant={v.required ? 'error' : 'gray'} size="sm">
                      {v.required ? 'Required' : 'Optional'}
                    </Badge>
                  </div>
                  <p className="text-xs text-hub-text-secondary mb-1">{v.purpose}</p>
                  <p className="text-xs text-hub-text-muted">
                    <span className="font-medium text-hub-text-secondary">Where to set:</span> {v.where}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-hub-input/30 rounded-lg border border-hub-border flex items-start gap-2.5">
          <Info className="w-4 h-4 text-hub-text-muted mt-0.5 shrink-0" />
          <p className="text-xs text-hub-text-secondary leading-relaxed">
            To get a <strong className="text-hub-text">Google Places / Maps key</strong>: go to{' '}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="text-hub-blue hover:underline">
              console.cloud.google.com/apis/credentials
            </a>
            , create a new API key, then enable <strong className="text-hub-text">Places API</strong> and{' '}
            <strong className="text-hub-text">Maps JavaScript API</strong>. Restrict the key to those APIs for safety.
            Add it above for Lead Generator key rotation, and also paste it as{' '}
            <code className="bg-hub-card px-1 rounded text-hub-blue">GOOGLE_PLACES_KEY</code> in the Function env vars for SEO Audit.
          </p>
        </div>
      </Card>
    </div>
  )
}
