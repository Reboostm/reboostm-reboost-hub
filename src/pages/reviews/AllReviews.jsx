import { useState, useEffect } from 'react'
import { doc, onSnapshot, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { fetchReviews } from '../../services/functions'
import { useNavigate } from 'react-router-dom'
import { Star, RefreshCw, Copy, ExternalLink, Search, CheckCircle, Loader2 } from 'lucide-react'

function StarRating({ rating, size = 'sm' }) {
  const full = Math.floor(rating)
  const half = rating % 1 >= 0.5
  const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${iconSize} ${
            i < full
              ? 'text-hub-yellow fill-hub-yellow'
              : i === full && half
              ? 'text-hub-yellow fill-hub-yellow/50'
              : 'text-hub-border fill-hub-border'
          }`}
        />
      ))}
    </div>
  )
}

function SetupForm({ onConnected }) {
  const [placeId, setPlaceId] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleConnect(e) {
    e.preventDefault()
    if (!placeId.trim()) { toast('Enter your Google Place ID.', 'error'); return }
    setLoading(true)
    try {
      const data = await fetchReviews({ placeId: placeId.trim() })
      toast(`Connected: ${data.businessName}`, 'success')
      onConnected(data)
    } catch (err) {
      toast(err.message || 'Could not find that Place ID.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Connect Google My Business</CardTitle>
      </CardHeader>
      <p className="text-sm text-hub-text-secondary mb-5 leading-relaxed">
        Enter your <strong className="text-hub-text">Google Place ID</strong> to pull in your reviews.
      </p>

      <div className="p-3 bg-hub-input/50 rounded-lg border border-hub-border text-xs text-hub-text-secondary leading-relaxed mb-5 space-y-1">
        <p className="font-medium text-hub-text">How to find your Place ID:</p>
        <ol className="list-decimal list-inside space-y-1 pl-1">
          <li>Search your business on <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer" className="text-hub-blue hover:underline">Google Maps</a></li>
          <li>Click your listing → Share → Copy Link</li>
          <li>The URL contains <code className="bg-hub-card px-1 rounded">?mid=</code> or look for the CID / Place ID in the URL</li>
          <li>Or use the <a href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" target="_blank" rel="noopener noreferrer" className="text-hub-blue hover:underline">Place ID Finder tool <ExternalLink className="inline w-3 h-3" /></a></li>
        </ol>
      </div>

      <form onSubmit={handleConnect} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">
            Google Place ID
          </label>
          <input
            value={placeId}
            onChange={e => setPlaceId(e.target.value)}
            placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
            className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text font-mono placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30"
          />
        </div>
        <Button type="submit" className="w-full" loading={loading}>
          <Search className="w-4 h-4 mr-2" /> Connect Business
        </Button>
      </form>
    </Card>
  )
}

export default function AllReviews() {
  const { hasReviewManager } = useBilling()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      setProfile(snap.data()?.reviewProfile || null)
      setLoadingProfile(false)
    })
    return unsub
  }, [user])

  async function handleRefresh() {
    if (!profile?.placeId) return
    setRefreshing(true)
    try {
      await fetchReviews({ placeId: profile.placeId })
      toast('Reviews refreshed.', 'success')
    } catch (err) {
      toast(err.message || 'Refresh failed.', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  async function copyReviewLink() {
    if (!profile?.reviewLink) return
    await navigator.clipboard.writeText(profile.reviewLink)
    setCopiedLink(true)
    toast('Review link copied!', 'success')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  function disconnect() {
    if (!window.confirm('Disconnect this business? Your review history will be cleared.')) return
    updateDoc(doc(db, 'users', user.uid), { reviewProfile: deleteField() })
  }

  if (!hasReviewManager) return <ToolGate tool="reviewManager" />

  if (loadingProfile) {
    return (
      <div className="p-6 flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-hub-text">Review Manager</h1>
          <p className="text-hub-text-secondary text-sm mt-1">
            Monitor your Google reviews and send review request campaigns.
          </p>
        </div>
        <SetupForm onConnected={() => {}} />
      </div>
    )
  }

  const reviews = profile.reviews || []

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Review Manager</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">{profile.businessName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => navigate('/reviews/requests')}>
            Request Reviews
          </Button>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-4xl font-bold text-hub-text">{profile.rating?.toFixed(1) || '—'}</div>
              <StarRating rating={profile.rating || 0} size="lg" />
              <div className="text-xs text-hub-text-muted mt-1">
                {profile.reviewCount?.toLocaleString() || 0} reviews
              </div>
            </div>
            <div className="pl-5 border-l border-hub-border">
              <p className="text-sm font-medium text-hub-text mb-1">Google Review Link</p>
              <p className="text-xs text-hub-text-muted font-mono mb-2 truncate max-w-xs">
                {profile.reviewLink}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={copyReviewLink}>
                  {copiedLink
                    ? <CheckCircle className="w-3.5 h-3.5 text-hub-green mr-1" />
                    : <Copy className="w-3.5 h-3.5 mr-1" />
                  }
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </Button>
                <a
                  href={profile.reviewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-hub-blue hover:underline px-2 py-1.5"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={disconnect}>
            <span className="text-hub-text-muted text-xs">Disconnect</span>
          </Button>
        </div>
      </Card>

      {/* Reviews list */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-hub-text">
            Recent Reviews
            <span className="text-hub-text-muted font-normal text-sm ml-2">
              (up to 5 via Google Places API)
            </span>
          </h2>
          {profile.lastFetchedAt && (
            <span className="text-xs text-hub-text-muted">
              Updated {
                profile.lastFetchedAt.toDate
                  ? profile.lastFetchedAt.toDate().toLocaleDateString()
                  : new Date(profile.lastFetchedAt).toLocaleDateString()
              }
            </span>
          )}
        </div>

        {reviews.length === 0 ? (
          <Card>
            <p className="text-sm text-hub-text-muted text-center py-6">
              No reviews yet. Hit Refresh to pull the latest from Google.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <Card key={i} padding={false}>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {r.authorPhoto ? (
                        <img
                          src={r.authorPhoto}
                          alt={r.authorName}
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-hub-blue/20 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-hub-blue">
                            {(r.authorName || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-hub-text truncate">{r.authorName || 'Anonymous'}</p>
                        <p className="text-xs text-hub-text-muted">{r.relativeTime || ''}</p>
                      </div>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <StarRating rating={r.rating || 0} />
                      <Badge
                        variant={r.rating >= 4 ? 'success' : r.rating >= 3 ? 'warning' : 'error'}
                        size="sm"
                      >
                        {r.rating}★
                      </Badge>
                    </div>
                  </div>
                  {r.text ? (
                    <p className="text-sm text-hub-text-secondary leading-relaxed">{r.text}</p>
                  ) : (
                    <p className="text-xs text-hub-text-muted italic">No written review</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* CTA */}
      <Card className="text-center py-6 bg-hub-blue/5 border-hub-blue/20">
        <p className="text-sm font-medium text-hub-text mb-1">Want more reviews?</p>
        <p className="text-xs text-hub-text-secondary mb-4">
          Send personalized review requests directly to your customers.
        </p>
        <Button onClick={() => navigate('/reviews/requests')}>
          Send Review Requests
        </Button>
      </Card>
    </div>
  )
}
