import { useState, useEffect } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { useToast } from '../../hooks/useToast'
import { schedulePost } from '../../services/functions'
import { useNavigate } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import { Share2, Image, Briefcase, MapPin, CheckCircle, AlertCircle } from 'lucide-react'

const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook',             icon: Share2,    color: 'text-blue-500',  limit: 63206 },
  { id: 'instagram', label: 'Instagram',             icon: Image,     color: 'text-pink-400',  limit: 2200  },
  { id: 'linkedin',  label: 'LinkedIn',              icon: Briefcase, color: 'text-sky-400',   limit: 3000  },
  { id: 'gmb',       label: 'Google My Business',    icon: MapPin,    color: 'text-hub-green', limit: 1500  },
]

function defaultDateTime() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(10, 0, 0, 0)
  const pad = n => String(n).padStart(2, '0')
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  }
}

export default function SchedulePost() {
  const { hasScheduler } = useBilling()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const { state: navState } = useLocation()
  const defaults = defaultDateTime()
  const [accounts, setAccounts] = useState({})
  const [selected, setSelected] = useState([])
  const [caption, setCaption] = useState(navState?.caption || '')
  const [imageUrl, setImageUrl] = useState(navState?.imageUrl || '')
  const [schedDate, setSchedDate] = useState(defaults.date)
  const [schedTime, setSchedTime] = useState(defaults.time)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      setAccounts(snap.data()?.connectedAccounts || {})
    })
    return unsub
  }, [user])

  const connected = PLATFORMS.filter(p => accounts[p.id]?.connected)
  const unconnected = PLATFORMS.filter(p => !accounts[p.id]?.connected)

  function toggle(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const shortestLimit = selected.reduce((min, id) => {
    const p = PLATFORMS.find(p => p.id === id)
    return p ? Math.min(min, p.limit) : min
  }, Infinity)
  const overLimit = selected.length > 0 && caption.length > shortestLimit

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selected.length)   { toast('Select at least one platform.', 'error'); return }
    if (!caption.trim())     { toast('Caption is required.', 'error'); return }
    if (!schedDate || !schedTime) { toast('Set a date and time.', 'error'); return }

    const scheduledAt = new Date(`${schedDate}T${schedTime}`).toISOString()
    if (new Date(scheduledAt) <= new Date()) {
      toast('Scheduled time must be in the future.', 'error')
      return
    }

    setSubmitting(true)
    try {
      await schedulePost({
        platforms: selected,
        caption: caption.trim(),
        imageUrl: imageUrl.trim() || null,
        scheduledAt,
      })
      toast('Post scheduled!', 'success')
      navigate('/scheduler')
    } catch (err) {
      toast(err.message || 'Failed to schedule post.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!hasScheduler) return <ToolGate tool="scheduler" />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Schedule a Post</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Compose once, publish across all your connected platforms.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Platforms */}
        <Card>
          <CardHeader>
            <CardTitle>Platforms</CardTitle>
          </CardHeader>
          {connected.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-hub-text-secondary mb-3">No accounts connected yet.</p>
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => navigate('/scheduler/accounts')}
              >
                Connect Accounts
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {connected.map(platform => {
                  const Icon = platform.icon
                  const isSelected = selected.includes(platform.id)
                  return (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => toggle(platform.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        isSelected
                          ? 'border-hub-blue bg-hub-blue/10 text-hub-blue'
                          : 'border-hub-border bg-hub-input text-hub-text-secondary hover:border-hub-blue/30'
                      }`}
                    >
                      {isSelected
                        ? <CheckCircle className="w-4 h-4 text-hub-blue shrink-0" />
                        : <Icon className={`w-4 h-4 ${platform.color} shrink-0`} />
                      }
                      <span className="truncate">{platform.label}</span>
                    </button>
                  )
                })}
              </div>
              {unconnected.length > 0 && (
                <p className="text-xs text-hub-text-muted mt-3">
                  {unconnected.map(p => p.label).join(', ')} not connected —{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/scheduler/accounts')}
                    className="text-hub-blue hover:underline"
                  >
                    connect them
                  </button>
                </p>
              )}
            </>
          )}
        </Card>

        {/* Caption */}
        <Card>
          <CardHeader>
            <CardTitle>Caption</CardTitle>
          </CardHeader>
          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Write your post caption here…"
            rows={5}
            className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30 resize-none"
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-xs ${overLimit ? 'text-hub-red' : 'text-hub-text-muted'}`}>
              {caption.length} characters
              {selected.length > 0 && shortestLimit !== Infinity && (
                <span> · limit {shortestLimit.toLocaleString()} for selected platforms</span>
              )}
            </span>
            {overLimit && (
              <span className="text-xs text-hub-red flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Over limit
              </span>
            )}
          </div>
        </Card>

        {/* Image */}
        <Card>
          <CardHeader>
            <CardTitle>
              Image
              <span className="text-hub-text-muted font-normal text-xs ml-2">optional</span>
            </CardTitle>
          </CardHeader>
          <Input
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
          {imageUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-hub-border bg-hub-input h-40 flex items-center justify-center">
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-full max-w-full object-contain"
                onError={e => { e.target.style.display = 'none' }}
              />
            </div>
          )}
        </Card>

        {/* Schedule time */}
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Time</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">Date</label>
              <input
                type="date"
                value={schedDate}
                onChange={e => setSchedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">Time</label>
              <input
                type="time"
                value={schedTime}
                onChange={e => setSchedTime(e.target.value)}
                className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
              />
            </div>
          </div>
        </Card>

        <Button
          type="submit"
          className="w-full"
          loading={submitting}
          disabled={!selected.length || !caption.trim() || overLimit}
        >
          Schedule Post
        </Button>
      </form>
    </div>
  )
}
