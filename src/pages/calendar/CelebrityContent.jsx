import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import { useToast } from '../../hooks/useToast'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import ToolGate from '../../components/ui/ToolGate'
import ImageEditor from '../../components/ui/ImageEditor'
import { Search, Calendar as CalendarIcon } from 'lucide-react'
import { CATEGORIES } from '../admin/ContentManager'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const CATEGORY_COLORS = {
  funny: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  educational: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  promotional: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  checklist: 'bg-green-500/10 text-green-400 border-green-500/30',
  story: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  seasonal: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
}

export default function CelebrityContent() {
  const navigate = useNavigate()
  const { userProfile, isStaff } = useAuth()
  const { hasCalendar } = useBilling()
  const { toast } = useToast()

  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [editingItem, setEditingItem] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)

  useEffect(() => {
    if (!isStaff && !userProfile?.niche) {
      setLoading(false)
      return
    }

    const q = isStaff
      ? collection(db, 'content')
      : query(collection(db, 'content'), where('niche', '==', userProfile.niche))

    const unsub = onSnapshot(
      q,
      snap => {
        setContent(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [userProfile?.niche, isStaff])

  if (!hasCalendar) {
    return <ToolGate tool="calendar" />
  }

  if (!isStaff && !userProfile?.niche) {
    return (
      <EmptyState
        icon={CalendarIcon}
        title="Complete Your Profile"
        description="Select your niche in settings to see your content library."
        action={<Button onClick={() => navigate('/settings')}>Go to Settings</Button>}
      />
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="text-hub-text-secondary text-sm mt-3">Loading your content library…</p>
        </div>
      </div>
    )
  }

  const filteredContent = content.filter(item => {
    const matchesSearch =
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const monthName = MONTHS[selectedMonth]
  const daysInMonth = selectedMonth === 1 && selectedYear % 4 === 0 ? 29 : DAYS_IN_MONTH[selectedMonth]
  const contentByDay = {}
  content.forEach(item => {
    if (item.month && item.month.toLowerCase() === monthName.toLowerCase()) {
      for (let day = 1; day <= daysInMonth; day++) {
        contentByDay[day] = contentByDay[day] || []
        contentByDay[day].push(item)
      }
    }
  })

  const nicheDisplay = isStaff ? 'All Niches' : (userProfile?.niche || '')

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-hub-text capitalize">
          Celebrity {nicheDisplay} Content
        </h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Your 12-month calendar of pre-made content. Click a day to see posts, edit with your branding, and schedule to social media.
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-hub-text">
              {monthName} {selectedYear}
            </h2>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (selectedMonth === 0) { setSelectedMonth(11); setSelectedYear(selectedYear - 1) }
                  else setSelectedMonth(selectedMonth - 1)
                }}
              >
                ← Previous
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (selectedMonth === 11) { setSelectedMonth(0); setSelectedYear(selectedYear + 1) }
                  else setSelectedMonth(selectedMonth + 1)
                }}
              >
                Next →
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-hub-text-muted py-2">
                {day}
              </div>
            ))}

            {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
              const day = dayIdx + 1
              const dayContent = contentByDay[day] || []
              return (
                <button
                  key={day}
                  onClick={() => {
                    if (dayContent.length > 0) {
                      setEditingItem(dayContent[0])
                      setEditorOpen(true)
                    }
                  }}
                  className={`aspect-square p-2 rounded-lg border transition-all ${
                    dayContent.length > 0
                      ? 'border-hub-blue bg-hub-blue/5 hover:bg-hub-blue/10 cursor-pointer'
                      : 'border-hub-border bg-hub-card'
                  }`}
                >
                  <div className="text-sm font-medium text-hub-text mb-0.5">{day}</div>
                  {dayContent.length > 0 && (
                    <div className="text-[10px] text-hub-blue font-semibold">
                      {dayContent.length} post{dayContent.length > 1 ? 's' : ''}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Content library */}
      <Card>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <h2 className="text-lg font-semibold text-hub-text">Content Library</h2>
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-hub-text-muted" />
              <input
                type="text"
                placeholder="Search content…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-hub-input border border-hub-border text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue"
              />
            </div>
          </div>

          {/* Category filter chips */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedCategory === ''
                  ? 'bg-hub-blue text-white border-hub-blue'
                  : 'bg-hub-input text-hub-text-secondary border-hub-border hover:border-hub-blue'
              }`}
            >
              All
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(selectedCategory === cat.value ? '' : cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                  selectedCategory === cat.value
                    ? 'bg-hub-blue text-white border-hub-blue'
                    : `${CATEGORY_COLORS[cat.value] || 'bg-hub-input text-hub-text-secondary border-hub-border'} hover:border-hub-blue`
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-8 h-8 text-hub-text-muted mx-auto mb-3" />
              <p className="text-hub-text-secondary text-sm">
                {searchTerm || selectedCategory ? 'No content matches your filters.' : 'No content available yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredContent.map(item => (
                <div
                  key={item.id}
                  className="border border-hub-border rounded-lg overflow-hidden bg-hub-input/30 hover:border-hub-blue transition-colors group cursor-pointer"
                  onClick={() => { setEditingItem(item); setEditorOpen(true) }}
                >
                  {item.imageUrl && (
                    <div className="w-full h-40 bg-hub-input flex items-center justify-center overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {item.category && (
                        <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${CATEGORY_COLORS[item.category] || 'bg-hub-card text-hub-text-muted border-hub-border'}`}>
                          {item.category}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-medium text-sm text-hub-text mb-1 line-clamp-2">{item.title}</p>
                    {item.description && (
                      <p className="text-xs text-hub-text-muted mb-2 line-clamp-2">{item.description}</p>
                    )}
                    <p className="text-xs text-hub-text-muted mb-3">
                      {item.month} {item.year}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-full"
                      onClick={e => {
                        e.stopPropagation()
                        setEditingItem(item)
                        setEditorOpen(true)
                      }}
                    >
                      Edit & Download
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Image editor modal */}
      {editorOpen && editingItem && (
        <ImageEditor
          imageUrl={editingItem.imageUrl}
          userProfile={userProfile}
          onSave={canvas => {
            if (canvas) {
              const link = document.createElement('a')
              link.href = canvas.toDataURL('image/png')
              link.download = `${editingItem.title}-${Date.now()}.png`
              link.click()
              toast('Content downloaded! You can now schedule it.', 'success')
              setEditorOpen(false)
            }
          }}
          onClose={() => { setEditorOpen(false); setEditingItem(null) }}
        />
      )}
    </div>
  )
}
