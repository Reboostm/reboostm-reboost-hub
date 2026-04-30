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
import { subscribeToKeywords, addKeyword, deleteKeyword, getRankHistory } from '../../services/firestore'
import { checkKeywordRank, getGoogleKeywordSuggestions } from '../../services/functions'
import { NICHES, US_STATES } from '../../config'
import {
  TrendingUp, TrendingDown, Minus, Plus, Trash2,
  RefreshCw, Monitor, Smartphone, MapPin, Clock, ChevronDown, ChevronUp, Download,
} from 'lucide-react'

const NICHE_KEYWORD_DATA = {
  plumber:           { primary: 'plumber',              services: ['drain cleaning', 'water heater repair', 'leak repair', 'pipe repair', 'sewer repair', 'toilet repair', 'faucet repair', 'emergency plumbing'] },
  hvac:              { primary: 'hvac company',          services: ['ac repair', 'furnace repair', 'air conditioning repair', 'heating repair', 'ac installation', 'hvac maintenance', 'heat pump repair'] },
  electrician:       { primary: 'electrician',           services: ['electrical repair', 'panel upgrade', 'wiring installation', 'outlet installation', 'electrical inspection', 'generator installation'] },
  roofer:            { primary: 'roofing contractor',    services: ['roof repair', 'roof replacement', 'roof inspection', 'shingle replacement', 'gutter installation', 'storm damage repair'] },
  landscaping:       { primary: 'landscaping company',   services: ['lawn care service', 'tree trimming', 'lawn mowing service', 'landscape design', 'yard cleanup', 'irrigation repair', 'sod installation'] },
  cleaning:          { primary: 'cleaning service',      services: ['house cleaning', 'maid service', 'deep cleaning service', 'move out cleaning', 'office cleaning', 'commercial cleaning'] },
  pest_control:      { primary: 'pest control company',  services: ['exterminator', 'termite treatment', 'rodent control', 'ant exterminator', 'bed bug treatment', 'wasp removal'] },
  general_contractor:{ primary: 'general contractor',    services: ['home remodeling', 'bathroom remodel', 'kitchen remodel', 'home addition', 'basement remodel', 'deck builder'] },
  painter:           { primary: 'painting contractor',   services: ['interior painting', 'exterior painting', 'house painter', 'commercial painting', 'cabinet painting'] },
  carpet_cleaning:   { primary: 'carpet cleaning service',services: ['upholstery cleaning', 'rug cleaning', 'tile and grout cleaning', 'steam cleaning', 'pet stain removal'] },
  flooring:          { primary: 'flooring company',      services: ['hardwood flooring', 'tile flooring installation', 'carpet installation', 'vinyl plank flooring', 'laminate flooring'] },
  windows_doors:     { primary: 'window replacement company', services: ['window installation', 'door replacement', 'sliding door repair', 'energy efficient windows', 'storm door installation'] },
  auto_repair:       { primary: 'auto repair shop',      services: ['car repair service', 'oil change', 'brake repair', 'transmission repair', 'engine repair', 'tire rotation'] },
  car_wash:          { primary: 'car wash',              services: ['auto detailing', 'car detailing', 'full detail service', 'mobile car wash', 'interior detailing'] },
  tire_shop:         { primary: 'tire shop',             services: ['tire installation', 'tire rotation service', 'wheel alignment', 'flat tire repair', 'new tires'] },
  auto_body:         { primary: 'auto body shop',        services: ['collision repair', 'dent repair', 'auto paint service', 'bumper repair', 'windshield replacement'] },
  dentist:           { primary: 'dentist',               services: ['dental cleaning', 'teeth whitening', 'dental implants', 'emergency dentist', 'cosmetic dentist', 'family dentist'] },
  chiropractor:      { primary: 'chiropractor',          services: ['back pain chiropractor', 'neck pain relief', 'spinal adjustment', 'sports chiropractor', 'car accident chiropractor'] },
  physical_therapy:  { primary: 'physical therapy clinic',services: ['sports rehab', 'physical therapist', 'injury rehabilitation', 'back pain physical therapy', 'knee pain physical therapy'] },
  massage:           { primary: 'massage therapist',     services: ['deep tissue massage', 'swedish massage', 'sports massage', 'prenatal massage', 'therapeutic massage'] },
  gym:               { primary: 'gym',                   services: ['fitness center', 'personal trainer', 'weight loss gym', 'crossfit gym', 'workout classes'] },
  yoga:              { primary: 'yoga studio',           services: ['yoga classes', 'hot yoga', 'beginner yoga', 'meditation classes', 'pilates studio'] },
  accountant:        { primary: 'accountant',            services: ['cpa firm', 'tax preparation', 'bookkeeping service', 'tax accountant', 'small business accounting', 'payroll service'] },
  lawyer:            { primary: 'attorney',              services: ['personal injury lawyer', 'family law attorney', 'criminal defense attorney', 'divorce lawyer', 'estate planning attorney'] },
  real_estate:       { primary: 'real estate agent',     services: ['homes for sale', 'realtor', 'buy a house', 'sell my home', 'listing agent', 'buyer agent', 'real estate broker'] },
  insurance:         { primary: 'insurance agency',      services: ['auto insurance', 'home insurance', 'life insurance', 'business insurance', 'health insurance broker'] },
  restaurant:        { primary: 'restaurant',            services: ['best restaurants', 'food near me', 'lunch restaurant', 'dinner restaurant', 'takeout restaurant', 'family restaurant'] },
  coffee_shop:       { primary: 'coffee shop',           services: ['best coffee', 'espresso bar', 'cafe near me', 'specialty coffee', 'wifi coffee shop'] },
  bar_pub:           { primary: 'bar',                   services: ['sports bar', 'cocktail bar', 'happy hour bar', 'pub near me', 'live music bar'] },
  catering:          { primary: 'catering company',      services: ['wedding catering', 'corporate catering', 'event catering', 'food catering service', 'buffet catering'] },
  retail:            { primary: 'local shop',            services: ['local boutique', 'specialty store', 'shopping near me'] },
  salon:             { primary: 'hair salon',            services: ['haircut', 'hair color', 'balayage highlights', 'blowout service', 'hair stylist', 'keratin treatment'] },
  barbershop:        { primary: 'barber shop',           services: ['mens haircut', 'fade haircut', 'beard trim', 'straight razor shave', 'boys haircut'] },
  spa:               { primary: 'day spa',               services: ['facial treatment', 'body massage', 'waxing service', 'nail salon', 'couples massage', 'skin care treatment'] },
  photography:       { primary: 'photographer',          services: ['wedding photographer', 'family portrait photographer', 'headshot photographer', 'newborn photographer', 'event photographer'] },
  event_planning:    { primary: 'event planner',         services: ['wedding planner', 'party planner', 'corporate event planner', 'birthday party planner', 'event coordinator'] },
  tutoring:          { primary: 'tutoring service',      services: ['math tutor', 'reading tutor', 'sat prep tutor', 'homework help', 'online tutoring', 'college prep'] },
  dog_grooming:      { primary: 'dog groomer',           services: ['pet grooming', 'dog bath', 'dog haircut', 'mobile dog grooming', 'cat grooming', 'dog nail trim'] },
}

function buildSuggestions(niche, city, state) {
  if (!city.trim()) return { universal: [], serviceSpecific: [] }

  const data = NICHE_KEYWORD_DATA[niche]
  const term = data?.primary || 'local business'
  const services = data?.services || []
  const c = city.trim()
  const s = state || ''

  const universal = [
    `${term} ${c}`,
    `${term} near me`,
    `best ${term} ${c}`,
    `${term} in ${c}`,
    ...(s ? [`${term} ${c} ${s}`] : []),
    `local ${term} ${c}`,
    `affordable ${term} ${c}`,
    `top rated ${term} ${c}`,
    `trusted ${term} ${c}`,
    `professional ${term} ${c}`,
    `licensed ${term} ${c}`,
    `insured ${term} ${c}`,
    `${term} company ${c}`,
    `${term} service ${c}`,
    `${term} near ${c}`,
    `find ${term} ${c}`,
    `hire ${term} ${c}`,
    `${term} reviews ${c}`,
    `${term} quotes ${c}`,
    `${term} cost ${c}`,
    `emergency ${term} ${c}`,
    `same day ${term} ${c}`,
    `24/7 ${term} ${c}`,
    `${term} open now ${c}`,
    `free estimate ${term} ${c}`,
    `best rated ${term} ${c}`,
    `cheap ${term} ${c}`,
    `residential ${term} ${c}`,
    `commercial ${term} ${c}`,
    `how much does a ${term} cost in ${c}`,
  ]

  const serviceSpecific = services.flatMap(svc => [
    `${svc} ${c}`,
    `${svc} near me`,
  ])

  return {
    universal: [...new Set(universal.filter(Boolean))],
    serviceSpecific: [...new Set(serviceSpecific.filter(Boolean))],
  }
}

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

function Sparkline({ history }) {
  if (!history || history.length < 2) return <span className="text-xs text-hub-text-muted">No trend yet</span>
  const ranks = history.map(h => h.rank).filter(r => r !== null)
  if (ranks.length < 2) return <span className="text-xs text-hub-text-muted">No trend yet</span>
  const max = Math.max(...ranks)
  const min = Math.min(...ranks)
  const range = max - min || 1
  const W = 80, H = 24
  const points = ranks.slice(0, 10).reverse().map((r, i) => {
    const x = (i / (ranks.length - 1)) * W
    const y = H - ((r - min) / range) * H
    return `${x},${y}`
  }).join(' ')
  const lastImproved = ranks[0] <= ranks[1]
  return (
    <svg width={W} height={H} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={lastImproved ? 'var(--color-hub-green, #22c55e)' : 'var(--color-hub-red, #ef4444)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function RankChange({ current, previous }) {
  if (current === null) return <span className="text-hub-text-muted text-xs">—</span>
  if (previous === null || current === previous) {
    return <span className="flex items-center gap-1 text-hub-text-muted text-xs"><Minus className="w-3.5 h-3.5" /> New</span>
  }
  const improved = current < previous
  const delta = Math.abs(current - previous)
  return (
    <span className={`flex items-center gap-0.5 text-xs font-semibold ${improved ? 'text-hub-green' : 'text-hub-red'}`}>
      {improved ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
      {delta}
    </span>
  )
}

function AddKeywordModal({ isOpen, onClose, userId, onAdded }) {
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const [keywordInput, setKeywordInput] = useState('')
  const [selectedKeywords, setSelectedKeywords] = useState([])
  const [domain,  setDomain]  = useState(() => userProfile?.website?.replace(/^https?:\/\//, '').split('/')[0] || '')
  const [city,    setCity]    = useState(() => userProfile?.city || '')
  const [state,   setState]   = useState(() => userProfile?.state || '')
  const [nicheOverride, setNicheOverride] = useState(() => userProfile?.niche || '')
  const [devices, setDevices] = useState({ mobile: true, desktop: true })
  const [saving,  setSaving]  = useState(false)
  const [fetchingGoogle, setFetchingGoogle] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState({ universal: [], serviceSpecific: [], google: [] })

  async function handleGenerateSuggestions() {
    if (!city.trim()) { toast('Enter a city first.', 'error'); return }
    const local = buildSuggestions(nicheOverride, city, state)
    setSuggestions({ ...local, google: [] })
    setShowSuggestions(true)

    // Also fetch real Google autocomplete suggestions via SerpAPI
    if (nicheOverride && NICHE_KEYWORD_DATA[nicheOverride]) {
      setFetchingGoogle(true)
      try {
        const data = NICHE_KEYWORD_DATA[nicheOverride]
        const baseQuery = `${data.primary} ${city.trim()}`
        const result = await getGoogleKeywordSuggestions({ query: baseQuery })
        if (result?.suggestions?.length) {
          setSuggestions(prev => ({ ...prev, google: result.suggestions }))
        }
      } catch {
        // Silently ignore — local suggestions are still shown
      } finally {
        setFetchingGoogle(false)
      }
    }
  }

  function addKeywordToList(kw) {
    if (!kw.trim()) return
    if (selectedKeywords.includes(kw.trim())) {
      toast('This keyword is already added.', 'warning')
      return
    }
    setSelectedKeywords(prev => [...prev, kw.trim()])
    setKeywordInput('')
  }

  function removeKeyword(kw) {
    setSelectedKeywords(prev => prev.filter(k => k !== kw))
  }

  async function handleSaveKeywords() {
    if (!domain.trim() || !city.trim() || !state || !Object.values(devices).some(v => v)) {
      toast('Please fill domain, city, state and select at least one device.', 'error')
      return
    }
    if (selectedKeywords.length === 0) {
      toast('Add at least one keyword.', 'error')
      return
    }

    setSaving(true)
    try {
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '').split('/')[0]
      const devicesToTrack = []
      if (devices.mobile) devicesToTrack.push('mobile')
      if (devices.desktop) devicesToTrack.push('desktop')

      for (const kw of selectedKeywords) {
        for (const device of devicesToTrack) {
          await addKeyword({
            userId,
            keyword: kw,
            domain: cleanDomain,
            city: city.trim(),
            state,
            device,
          })
        }
      }
      toast(`${selectedKeywords.length} keyword${selectedKeywords.length !== 1 ? 's' : ''} added for ${devicesToTrack.join(' & ')}.`, 'success')
      setKeywordInput('')
      setSelectedKeywords([])
      setDomain('')
      setCity('')
      setState('')
      setDevices({ mobile: true, desktop: true })
      setSuggestions({ universal: [], serviceSpecific: [], google: [] })
      setShowSuggestions(false)
      onAdded()
      onClose()
    } catch (err) {
      console.error('Add keyword error:', err)
      toast(err.message || 'Failed to add keywords. Check console for details.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (keywordInput.trim()) {
      addKeywordToList(keywordInput)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Track Multiple Keywords"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button loading={saving} onClick={handleSaveKeywords}>Save All Keywords</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="block text-xs font-medium text-hub-text-secondary mb-2">Track on (select both for detailed comparison)</label>
          <div className="space-y-2">
            {[
              { value: 'mobile',  label: 'Mobile Rankings',  Icon: Smartphone },
              { value: 'desktop', label: 'Desktop Rankings', Icon: Monitor    },
            ].map(({ value, label, Icon }) => (
              <label key={value} className="flex items-center gap-3 p-3 border border-hub-border rounded-lg hover:bg-hub-input/30 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={devices[value]}
                  onChange={e => setDevices(prev => ({ ...prev, [value]: e.target.checked }))}
                  className="w-4 h-4 rounded border-hub-border bg-hub-input accent-hub-blue"
                />
                <Icon className="w-4 h-4 text-hub-text-secondary" />
                <span className="text-sm text-hub-text">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-hub-text-secondary mb-2">Keywords to track</label>
          <div className="flex gap-2 mb-2">
            <Input
              value={keywordInput}
              onChange={e => setKeywordInput(e.target.value)}
              placeholder="e.g. plumber salt lake city"
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addKeywordToList(keywordInput)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
          {selectedKeywords.length > 0 && (
            <div className="space-y-1.5">
              {selectedKeywords.map((kw, idx) => (
                <div key={idx} className="flex items-center justify-between bg-hub-input/50 p-2 rounded border border-hub-border text-sm text-hub-text">
                  <span>{kw}</span>
                  <button
                    type="button"
                    onClick={() => removeKeyword(kw)}
                    className="text-hub-red hover:text-hub-red/80 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Niche selector for suggestions */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-hub-text-secondary mb-1">Business type (for keyword ideas)</label>
            <select
              value={nicheOverride}
              onChange={e => setNicheOverride(e.target.value)}
              className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2 text-sm text-hub-text focus:outline-none focus:border-hub-blue"
            >
              <option value="">— Select niche —</option>
              {NICHES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleGenerateSuggestions}
            disabled={!city.trim()}
            loading={fetchingGoogle}
          >
            💡 Get Ideas
          </Button>
        </div>

        {showSuggestions && (
          <div className="bg-hub-input/50 rounded-lg p-3 border border-hub-border space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-hub-text-secondary">
                Click to add keywords to your list
              </p>
              <button type="button" onClick={() => setShowSuggestions(false)} className="text-xs text-hub-text-muted hover:text-hub-text">✕ close</button>
            </div>

            {suggestions.google.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-hub-green mt-2 flex items-center gap-1">
                  <span>🔍</span> Real Google Searches
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {suggestions.google.map((s, i) => (
                    <button key={i} type="button" onClick={() => addKeywordToList(s)}
                      className="w-full text-left text-xs px-3 py-1.5 bg-hub-card rounded hover:bg-hub-green/20 transition-colors text-hub-text border border-hub-green/20">
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {suggestions.serviceSpecific.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-hub-blue mt-2">Service-Specific</p>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {suggestions.serviceSpecific.map((s, i) => (
                    <button key={i} type="button" onClick={() => addKeywordToList(s)}
                      className="w-full text-left text-xs px-3 py-1.5 bg-hub-card rounded hover:bg-hub-blue/20 transition-colors text-hub-text">
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-[10px] font-semibold uppercase tracking-wider text-hub-text-muted mt-2">Universal Local Patterns</p>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {suggestions.universal.map((s, i) => (
                <button key={i} type="button" onClick={() => addKeywordToList(s)}
                  className="w-full text-left text-xs px-3 py-1.5 bg-hub-card rounded hover:bg-hub-blue/20 transition-colors text-hub-text">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 bg-hub-input/30 rounded-lg border border-hub-border text-xs text-hub-text-secondary leading-relaxed">
          ℹ️ Rankings checked on-demand or automatically every Monday. Requires <code className="bg-hub-card px-1 rounded text-hub-blue">SERPAPI_KEY</code> env var.
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
  const [histories, setHistories] = useState({})
  const [expanded, setExpanded]   = useState({})
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    if (!user) return
    return subscribeToKeywords(user.uid, setKeywords)
  }, [user])

  async function loadHistory(kwId) {
    if (histories[kwId]) return
    const hist = await getRankHistory(kwId)
    setHistories(prev => ({ ...prev, [kwId]: hist }))
  }

  function toggleExpand(kwId) {
    const willExpand = !expanded[kwId]
    setExpanded(prev => ({ ...prev, [kwId]: willExpand }))
    if (willExpand) loadHistory(kwId)
  }

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

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === keywords.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(keywords.map(k => k.id)))
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!window.confirm(`Delete ${selectedIds.size} keyword(s)?`)) return
    setBulkDeleting(true)
    try {
      await Promise.all([...selectedIds].map(id => deleteKeyword(id)))
      toast(`Deleted ${selectedIds.size} keyword(s)`, 'success')
      setSelectedIds(new Set())
    } catch (err) {
      toast('Failed to delete some keywords', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  function formatChecked(ts) {
    if (!ts) return 'Never checked'
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function exportCsv() {
    const rows = [
      ['Keyword', 'Domain', 'Location', 'Device', 'Current Rank', 'Previous Rank', 'Change', 'In Map Pack', 'Last Checked'],
      ...keywords.map(kw => {
        const change = (kw.currentRank !== null && kw.previousRank !== null)
          ? kw.previousRank - kw.currentRank : ''
        const lastChecked = kw.lastChecked?.toDate
          ? kw.lastChecked.toDate().toLocaleDateString() : ''
        return [
          kw.keyword, kw.domain,
          `${kw.city}, ${kw.state}`, kw.device,
          kw.currentRank ?? '', kw.previousRank ?? '',
          change, kw.inLocalPack ? 'Yes' : 'No', lastChecked,
        ]
      }),
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `rankings-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  if (!hasRankTracker) return <ToolGate tool="rankTracker" />

  // Calculate stats
  const tracked    = keywords.length
  const checked    = keywords.filter(k => k.currentRank !== null).length
  const inTop10    = keywords.filter(k => k.currentRank !== null && k.currentRank <= 10).length
  const inMapPack  = keywords.filter(k => k.inLocalPack).length
  const avgRank    = checked > 0
    ? Math.round(keywords.filter(k => k.currentRank !== null).reduce((s, k) => s + k.currentRank, 0) / checked)
    : null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Rank Tracker</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">
            Track week-over-week Google position changes
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Add Keywords
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
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Tracked',     value: tracked,                     sub: 'keywords' },
              { label: 'Avg Position', value: avgRank ?? '—',             sub: checked > 0 ? `across ${checked} checked` : 'none checked yet' },
              { label: 'Page 1',      value: inTop10,                     sub: 'in top 10' },
              { label: 'Map Pack',    value: inMapPack,                   sub: 'appearing' },
            ].map(s => (
              <Card key={s.label} className="text-center py-4">
                <div className="text-2xl font-bold text-hub-text">{s.value}</div>
                <div className="text-xs font-medium text-hub-text-secondary mt-0.5">{s.label}</div>
                <div className="text-[11px] text-hub-text-muted">{s.sub}</div>
              </Card>
            ))}
          </div>

          {/* Rankings table */}
          <Card padding={false}>
            <div className="px-5 py-3 border-b border-hub-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size === keywords.length && keywords.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-hub-border bg-hub-input accent-hub-blue cursor-pointer"
                />
                <h2 className="text-sm font-semibold text-hub-text">Keyword Rankings</h2>
              </div>
              <div className="flex items-center gap-2">
                {selectedIds.size > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBulkDelete}
                    disabled={bulkDeleting}
                    className="text-hub-red hover:text-hub-red"
                  >
                    <Trash2 className="w-3 h-3 mr-1.5" /> Delete {selectedIds.size}
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={exportCsv}>
                  <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
                </Button>
              </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[36px_2fr_1fr_1fr_1fr_80px_36px] gap-3 px-5 py-2 text-[11px] font-semibold text-hub-text-muted uppercase tracking-wide border-b border-hub-border/50">
              <span />
              <span>Keyword</span>
              <span>Location</span>
              <span>Rank</span>
              <span>Change</span>
              <span>Trend</span>
              <span />
            </div>

            <div className="divide-y divide-hub-border/50">
              {keywords.map(kw => {
                const isExpanded = !!expanded[kw.id]
                const hist = histories[kw.id] || []
                return (
                  <div key={kw.id}>
                    <div className="grid grid-cols-[36px_2fr_1fr_1fr_1fr_80px_36px] gap-3 items-center px-5 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(kw.id)}
                        onChange={() => toggleSelect(kw.id)}
                        className="w-4 h-4 rounded border-hub-border bg-hub-input accent-hub-blue cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-hub-text truncate">{kw.keyword}</p>
                        <p className="text-[11px] text-hub-text-muted font-mono truncate">{kw.domain}</p>
                      </div>
                      <span className="text-xs text-hub-text-muted">{kw.city}, {kw.state}</span>
                      <Badge variant={rankBadge(kw.currentRank).variant} size="sm">{rankBadge(kw.currentRank).label}</Badge>
                      <RankChange current={kw.currentRank} previous={kw.previousRank} />
                      <Sparkline history={hist} />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleExpand(kw.id)}
                          className="p-1 rounded hover:bg-hub-input transition-colors text-hub-text-muted"
                        >
                          {isExpanded
                            ? <ChevronUp className="w-4 h-4" />
                            : <ChevronDown className="w-4 h-4" />
                          }
                        </button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Check ranking"
                          loading={checking[kw.id]}
                          onClick={() => handleCheck(kw)}
                          className="hover:bg-hub-input"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Remove keyword"
                          onClick={() => {
                            if (window.confirm(`Remove "${kw.keyword}"?`)) {
                              handleDelete(kw)
                            }
                          }}
                          className="hover:bg-hub-input"
                        >
                          <Trash2 className="w-3 h-3 text-hub-red" />
                        </Button>
                      </div>
                    </div>

                    {/* Expanded history */}
                    {isExpanded && (
                      <div className="px-5 pb-4 bg-hub-input/20">
                        <p className="text-xs font-medium text-hub-text-secondary mb-2">Check History</p>
                        {hist.length === 0 ? (
                          <p className="text-xs text-hub-text-muted">No checks yet — click the refresh icon to check rankings.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {hist.map(h => {
                              const d = h.checkedAt?.toDate ? h.checkedAt.toDate() : new Date(h.checkedAt || 0)
                              return (
                                <div key={h.id} className="flex items-center gap-4 text-xs">
                                  <span className="text-hub-text-muted w-32 shrink-0">
                                    {d.toLocaleDateString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <Badge variant={rankBadge(h.rank).variant} size="sm">{rankBadge(h.rank).label}</Badge>
                                  {h.inLocalPack && <Badge variant="success" size="sm">📍 Map Pack</Badge>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </>
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
