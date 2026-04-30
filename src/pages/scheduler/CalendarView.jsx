import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBilling } from '../../hooks/useBilling'
import { useAuth } from '../../hooks/useAuth'
import ToolGate from '../../components/ui/ToolGate'
import Button from '../../components/ui/Button'
import { useToast } from '../../hooks/useToast'
import { subscribeToScheduledPosts, deleteScheduledPost } from '../../services/firestore'
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2 } from 'lucide-react'

const PLATFORM_CHIP = {
  facebook:  { label: 'FB',  bg: 'bg-blue-500' },
  instagram: { label: 'IG',  bg: 'bg-pink-400' },
  linkedin:  { label: 'LI',  bg: 'bg-sky-400'  },
  gmb:       { label: 'GMB', bg: 'bg-hub-green' },
}

const STATUS_COLOR = {
  scheduled: 'text-hub-blue',
  published: 'text-hub-green',
  failed:    'text-hub-red',
  cancelled: 'text-hub-text-muted',
}

function toDate(val) {
  if (!val) return null
  if (val.toDate) return val.toDate()
  return new Date(val)
}

export default function CalendarView() {
  const { hasScheduler } = useBilling()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [posts, setPosts] = useState([])
  const [selectedDay, setSelectedDay] = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    if (!user) return
    return subscribeToScheduledPosts(user.uid, setPosts)
  }, [user])

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDay(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDay(null)
  }

  function postsForDay(day) {
    return posts.filter(p => {
      const d = toDate(p.scheduledAt)
      return d && d.getFullYear() === year && d.getMonth() === month && d.getDate() === day
    })
  }

  async function handleDelete(post) {
    if (!window.confirm('Cancel this scheduled post?')) return
    setDeleting(post.id)
    try {
      await deleteScheduledPost(post.id)
      toast('Post cancelled.', 'success')
      setSelectedDay(null)
    } catch {
      toast('Failed to cancel post.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  if (!hasScheduler) return <ToolGate tool="scheduler" />

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = new Date(year, month, 1).getDay()
  const monthLabel = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length
  const selectedPosts = selectedDay ? postsForDay(selectedDay) : []

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Celebrity Content</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">
            {scheduledCount > 0
              ? `${scheduledCount} post${scheduledCount !== 1 ? 's' : ''} scheduled`
              : 'No posts scheduled yet'}
          </p>
        </div>
        <Button onClick={() => navigate('/scheduler/new')}>
          <Plus className="w-4 h-4 mr-1.5" /> Schedule Post
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="bg-hub-card border border-hub-border rounded-2xl overflow-hidden mb-5">

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-hub-border">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-hub-input transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-hub-text" />
          </button>
          <h2 className="text-sm font-semibold text-hub-text">{monthLabel}</h2>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-hub-input transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-hub-text" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-hub-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-2 text-center text-[11px] font-medium text-hub-text-muted">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {/* Leading empty cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className={`min-h-[80px] p-1.5 border-b border-hub-border/40 ${i < 6 ? 'border-r' : ''}`}
            />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dayPosts = postsForDay(day)
            const colIndex = (firstDayOfWeek + i) % 7
            const isLastCol = colIndex === 6
            const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day
            const isSelected = selectedDay === day

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                className={`min-h-[80px] p-1.5 border-b border-hub-border/40 cursor-pointer transition-colors ${
                  !isLastCol ? 'border-r border-hub-border/40' : ''
                } ${isSelected ? 'bg-hub-blue/5' : 'hover:bg-hub-input/40'}`}
              >
                <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-medium mb-1 ${
                  isToday ? 'bg-hub-blue text-white' : 'text-hub-text'
                }`}>
                  {day}
                </div>
                <div className="space-y-0.5">
                  {dayPosts.slice(0, 3).map(p => {
                    const pl = p.platforms?.[0]
                    const chip = PLATFORM_CHIP[pl] || { label: '?', bg: 'bg-hub-text-muted' }
                    return (
                      <div
                        key={p.id}
                        className={`text-[10px] text-white px-1 py-0.5 rounded truncate ${chip.bg} ${
                          p.status !== 'scheduled' ? 'opacity-40' : ''
                        }`}
                      >
                        {chip.label} {p.caption?.substring(0, 14)}
                      </div>
                    )
                  })}
                  {dayPosts.length > 3 && (
                    <div className="text-[10px] text-hub-text-muted px-1">
                      +{dayPosts.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected day detail */}
      {selectedDay && (
        <div className="bg-hub-card border border-hub-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-hub-text">
              {new Date(year, month, selectedDay).toLocaleDateString('default', {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </h3>
            <Button size="sm" onClick={() => navigate('/scheduler/new')}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Post
            </Button>
          </div>

          {selectedPosts.length === 0 ? (
            <p className="text-sm text-hub-text-muted text-center py-6">
              No posts on this day.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedPosts.map(p => {
                const d = toDate(p.scheduledAt)
                const timeStr = d?.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' }) || ''
                const statusColor = STATUS_COLOR[p.status] || 'text-hub-text-muted'
                const statusLabel = p.status
                  ? p.status.charAt(0).toUpperCase() + p.status.slice(1)
                  : 'Scheduled'

                return (
                  <div
                    key={p.id}
                    className="flex items-start gap-3 p-3 rounded-xl border border-hub-border bg-hub-input/30"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {p.platforms?.map(pl => {
                          const chip = PLATFORM_CHIP[pl]
                          return chip ? (
                            <span
                              key={pl}
                              className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded ${chip.bg}`}
                            >
                              {chip.label}
                            </span>
                          ) : null
                        })}
                        <span className={`text-xs ${statusColor} capitalize`}>{statusLabel}</span>
                        <span className="text-xs text-hub-text-muted ml-auto">{timeStr}</span>
                      </div>
                      <p className="text-sm text-hub-text line-clamp-2">{p.caption}</p>
                      {p.imageUrl && (
                        <p className="text-xs text-hub-text-muted mt-1">Image attached</p>
                      )}
                    </div>

                    {p.status === 'scheduled' && (
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={!!deleting}
                        className="shrink-0 p-1.5 rounded-lg hover:bg-hub-card transition-colors text-hub-text-muted hover:text-hub-red disabled:opacity-50"
                        title="Cancel post"
                      >
                        {deleting === p.id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty state when no posts exist at all */}
      {posts.length === 0 && !selectedDay && (
        <div className="text-center py-8">
          <p className="text-hub-text-secondary text-sm mb-3">
            No posts scheduled yet. Create your first one!
          </p>
          <Button variant="secondary" onClick={() => navigate('/scheduler/new')}>
            <Plus className="w-4 h-4 mr-1.5" /> Schedule Your First Post
          </Button>
        </div>
      )}
    </div>
  )
}
