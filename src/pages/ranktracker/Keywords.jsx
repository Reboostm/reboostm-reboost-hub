import { useState, useEffect } from 'react'
import { useBilling } from '../../hooks/useBilling'
import { useAuth } from '../../hooks/useAuth'
import ToolGate from '../../components/ui/ToolGate'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useToast } from '../../hooks/useToast'
import { subscribeToKeywords, addKeyword, deleteKeyword } from '../../services/firestore'
import { checkKeywordRank } from '../../services/functions'
import { NICHES, US_STATES } from '../../config'
import {
  TrendingUp, TrendingDown, Minus, Plus, Trash2,
  RefreshCw, Monitor, Smartphone, MapPin, Clock,
} from 'lucide-react'

function rankBadge(rank) {
  if (rank === null || rank === undefined) return { label: 'Not found', variant: 'gray' }
  if (rank <= 3)  return { label: `#${rank} — Top 3`,   variant: 'success' }
  if (rank <= 10) return { label: `#${rank} — Page 1`,  variant: 'info'    }
  if (rank <= 20) return { label: `#${rank} — Page 2`,  variant: 'warning' }
  return { label: `#${rank} — Deep`, variant: 'error' }
}

function RankDelta({ current, previous }) {
  if (current === null || previous === null || current === previous) {
    return <Minus className="w-4 h-4 text-hub-text-muted" />
  }
  const improved = current < previous
  const delta = Math.abs(current - previous)
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${improved ? 'text-hub-green' : 'text-hub-red'}`}>
      {improved
        ? <TrendingUp className="w-3.5 h-3.5" />
        : <TrendingDown className="w-3.5 h-3.5" />
      }
      {delta}
    </span>
  )
}

function AddKeywordModal({ isOpen, onClose, userId, onAdded }) {
  const { toast } = useToast()
  const [keyword, setKeyword] = useState('')
  const [domain,  setDomain]  = useState('')
  const [city,    setCity]    = useState('')
  const [state,   setState]   = useState('')
  const [device,  setDevice]  = useState('mobile')
  const [saving,  setSaving]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!keyword.trim() || !domain.trim() || !city.trim() || !state) {
      toast('All fields except niche are required.', 'error')
      return
    }
    setSaving(true)
    try {
      await addKeyword({ userId, keyword: keyword.trim(), domain: domain.trim().replace(/^https?:\/\//, '').split('/')[0], city: city.trim(), state, device })
      toast('Keyword added.', 'success')
      setKeyword(''); setDomain(''); setCity(''); setState(''); setDevice('mobile')
      onAdded()
      onClose()
    } catch (err) {
      console.error('Add keyword error:', err)
      toast(err.message || 'Failed to add keyword. Check console for details.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Track New Keyword"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={handleSubmit}>Add Keyword</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Keyword to track"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="e.g. plumber salt lake city"
        />
        <Input
          label="Your domain"
          value={domain}
          onChange={e => setDomain(e.target.value)}
          placeholder="myplumbingbusiness.com"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="City"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Salt Lake City"
          />
          <Select
            label="State"
            value={state}
            onChange={e => setState(e.target.value)}
            options={US_STATES}
            placeholder="State"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">Device</label>
          <div className="flex gap-2">
            {[
              { value: 'mobile',  label: 'Mobile',  Icon: Smartphone },
              { value: 'desktop', label: 'Desktop', Icon: Monitor    },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setDevice(value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-sm transition-all ${
                  device === value
                    ? 'border-hub-blue bg-hub-blue/10 text-hub-blue'
                    : 'border-hub-border bg-hub-input text-hub-text-secondary hover:border-hub-blue/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-3 bg-hub-input/30 rounded-lg border border-hub-border text-xs text-hub-text-secondary leading-relaxed">
          Rankings are checked on-demand. Requires <code className="bg-hub-card px-1 rounded text-hub-blue">SERPAPI_KEY</code> in Function env vars.
        </div>
      </form>
    </Modal>
  )
}

export default function Keywords() {
  const { hasRankTracker } = useBilling()
  const { user } = useAuth()
  const { toast } = useToast()

  const [keywords, setKeywords] = useState([])
  const [showAdd, setShowAdd]   = useState(false)
  const [checking, setChecking] = useState({})

  useEffect(() => {
    if (!user) return
    return subscribeToKeywords(user.uid, setKeywords)
  }, [user])

  async function handleCheck(kw) {
    setChecking(prev => ({ ...prev, [kw.id]: true }))
    try {
      const { rank, inLocalPack } = await checkKeywordRank({ keywordId: kw.id })
      const msg = rank
        ? `Ranked #${rank}${inLocalPack ? ' + in Map Pack' : ''}`
        : 'Not found in top 100'
      toast(msg, rank && rank <= 10 ? 'success' : 'warning')
    } catch (err) {
      toast(err.message || 'Check failed. Verify SERPAPI_KEY env var.', 'error')
    } finally {
      setChecking(prev => ({ ...prev, [kw.id]: false }))
    }
  }

  async function handleDelete(kw) {
    if (!window.confirm(`Remove "${kw.keyword}"?`)) return
    try {
      await deleteKeyword(kw.id)
    } catch {
      toast('Failed to delete.', 'error')
    }
  }

  function formatChecked(ts) {
    if (!ts) return 'Never checked'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!hasRankTracker) return <ToolGate tool="rankTracker" />

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">My Keywords</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">
            {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} tracked
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Keyword
        </Button>
      </div>

      {keywords.length === 0 ? (
        <Card className="text-center py-12">
          <TrendingUp className="w-10 h-10 text-hub-text-muted mx-auto mb-4 opacity-40" />
          <p className="text-hub-text-secondary font-medium mb-1">No keywords tracked yet</p>
          <p className="text-hub-text-muted text-sm mb-5">
            Add keywords to start tracking your Google rankings week over week.
          </p>
          <Button onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Your First Keyword
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {keywords.map(kw => {
            const badge = rankBadge(kw.currentRank)
            const isChecking = !!checking[kw.id]
            return (
              <Card key={kw.id} padding={false}>
                <div className="flex items-center gap-4 p-4">
                  {/* Rank display */}
                  <div className="w-16 text-center shrink-0">
                    <div className={`text-3xl font-bold leading-none ${
                      kw.currentRank === null ? 'text-hub-text-muted' :
                      kw.currentRank <= 3  ? 'text-hub-green' :
                      kw.currentRank <= 10 ? 'text-hub-blue'  :
                      kw.currentRank <= 20 ? 'text-hub-yellow': 'text-hub-red'
                    }`}>
                      {kw.currentRank ?? '—'}
                    </div>
                    <div className="mt-1">
                      <RankDelta current={kw.currentRank} previous={kw.previousRank} />
                    </div>
                  </div>

                  {/* Keyword info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-medium text-sm text-hub-text">{kw.keyword}</span>
                      <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
                      {kw.inLocalPack && (
                        <Badge variant="success" size="sm">📍 Map Pack</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-hub-text-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {kw.city}, {kw.state}
                      </span>
                      <span className="flex items-center gap-1">
                        {kw.device === 'mobile'
                          ? <Smartphone className="w-3 h-3" />
                          : <Monitor className="w-3 h-3" />
                        }
                        {kw.device}
                      </span>
                      <span className="font-mono">{kw.domain}</span>
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {formatChecked(kw.lastChecked)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Check ranking now"
                      loading={isChecking}
                      onClick={() => handleCheck(kw)}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? '' : ''}`} />
                      <span className="ml-1 hidden sm:inline">Check</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Remove keyword"
                      onClick={() => handleDelete(kw)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-hub-red" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <AddKeywordModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        userId={user?.uid}
        onAdded={() => {}}
      />
    </div>
  )
}
