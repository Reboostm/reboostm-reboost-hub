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

function AddKeywordModal({ isOpen, onClose, userId, onAdded }) {
  const { toast } = useToast()
  const { userProfile } = useAuth()
  const [keyword, setKeyword] = useState('')
  const [domain,  setDomain]  = useState('')
  const [city,    setCity]    = useState('')
  const [state,   setState]   = useState('')
  const [devices, setDevices] = useState({ mobile: true, desktop: true })
  const [saving,  setSaving]  = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState({ universal: [], serviceSpecific: [] })

  function handleGenerateSuggestions() {
    const result = buildSuggestions(userProfile?.niche, city, state)
    setSuggestions(result)
    setShowSuggestions(true)
  }

  async function handleAddKeyword(kw) {
    if (!domain.trim() || !city.trim() || !state || !Object.values(devices).some(v => v)) {
      toast('Please fill all fields and select at least one device.', 'error')
      return
    }
    setSaving(true)
    try {
      const cleanDomain = domain.trim().replace(/^https?:\/\//, '').split('/')[0]
      const devicesToTrack = []
      if (devices.mobile) devicesToTrack.push('mobile')
      if (devices.desktop) devicesToTrack.push('desktop')

      for (const device of devicesToTrack) {
        await addKeyword({
          userId,
          keyword: kw.trim(),
          domain: cleanDomain,
          city: city.trim(),
          state,
          device,
        })
      }
      toast(`Keyword "${kw}" added for ${devicesToTrack.join(' & ')}.`, 'success')
      setKeyword('')
      setDomain('')
      setCity('')
      setState('')
      setDevices({ mobile: true, desktop: true })
      setSuggestions({ universal: [], serviceSpecific: [] })
      setShowSuggestions(false)
      onAdded()
      onClose()
    } catch (err) {
      console.error('Add keyword error:', err)
      toast(err.message || 'Failed to add keyword. Check console for details.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!keyword.trim()) {
      toast('Enter a keyword or select from suggestions.', 'error')
      return
    }
    handleAddKeyword(keyword)
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

        {!showSuggestions && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={handleGenerateSuggestions}
            disabled={!city.trim()}
          >
            💡 Get Keyword Suggestions ({NICHE_KEYWORD_DATA[userProfile?.niche] ? '50+' : '30'} ideas)
          </Button>
        )}

        {showSuggestions && (
          <div className="bg-hub-input/50 rounded-lg p-3 border border-hub-border space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium text-hub-text-secondary">
                {suggestions.universal.length + suggestions.serviceSpecific.length} keyword ideas — click to use
              </p>
              <button type="button" onClick={() => setShowSuggestions(false)} className="text-xs text-hub-text-muted hover:text-hub-text">✕ close</button>
            </div>

            {suggestions.serviceSpecific.length > 0 && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-hub-blue mt-2">Service-Specific</p>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {suggestions.serviceSpecific.map((s, i) => (
                    <button key={i} type="button" onClick={() => { setKeyword(s); setShowSuggestions(false) }}
                      className="w-full text-left text-xs px-3 py-1.5 bg-hub-card rounded hover:bg-hub-blue/20 transition-colors text-hub-text">
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-[10px] font-semibold uppercase tracking-wider text-hub-text-muted mt-2">Universal Local</p>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {suggestions.universal.map((s, i) => (
                <button key={i} type="button" onClick={() => { setKeyword(s); setShowSuggestions(false) }}
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
          {(() => {
            // Group keywords by (keyword, domain, city, state)
            const grouped = keywords.reduce((acc, kw) => {
              const key = `${kw.keyword}|${kw.domain}|${kw.city}|${kw.state}`
              if (!acc[key]) acc[key] = {}
              acc[key][kw.device] = kw
              return acc
            }, {})

            return Object.entries(grouped).map(([groupKey, devices]) => {
              const mobileKw = devices.mobile
              const desktopKw = devices.desktop
              const displayKw = mobileKw || desktopKw

              const isCheckingMobile = !!checking[mobileKw?.id]
              const isCheckingDesktop = !!checking[desktopKw?.id]

              return (
                <Card key={groupKey} padding={false}>
                  <div className="flex items-center gap-4 p-4">
                    {/* Rank display — both devices */}
                    <div className="flex gap-4 shrink-0">
                      {mobileKw && (
                        <div className="text-center">
                          <div className="text-xs text-hub-text-muted mb-1 flex items-center gap-1 justify-center">
                            <Smartphone className="w-3 h-3" /> Mobile
                          </div>
                          <div className={`text-2xl font-bold leading-none ${
                            mobileKw.currentRank === null ? 'text-hub-text-muted' :
                            mobileKw.currentRank <= 3  ? 'text-hub-green' :
                            mobileKw.currentRank <= 10 ? 'text-hub-blue'  :
                            mobileKw.currentRank <= 20 ? 'text-hub-yellow': 'text-hub-red'
                          }`}>
                            {mobileKw.currentRank ?? '—'}
                          </div>
                          <div className="mt-1">
                            <RankDelta current={mobileKw.currentRank} previous={mobileKw.previousRank} />
                          </div>
                        </div>
                      )}
                      {desktopKw && (
                        <div className="text-center">
                          <div className="text-xs text-hub-text-muted mb-1 flex items-center gap-1 justify-center">
                            <Monitor className="w-3 h-3" /> Desktop
                          </div>
                          <div className={`text-2xl font-bold leading-none ${
                            desktopKw.currentRank === null ? 'text-hub-text-muted' :
                            desktopKw.currentRank <= 3  ? 'text-hub-green' :
                            desktopKw.currentRank <= 10 ? 'text-hub-blue'  :
                            desktopKw.currentRank <= 20 ? 'text-hub-yellow': 'text-hub-red'
                          }`}>
                            {desktopKw.currentRank ?? '—'}
                          </div>
                          <div className="mt-1">
                            <RankDelta current={desktopKw.currentRank} previous={desktopKw.previousRank} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Keyword info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-sm text-hub-text">{displayKw.keyword}</span>
                        {mobileKw && <Badge variant={rankBadge(mobileKw.currentRank).variant} size="sm">{rankBadge(mobileKw.currentRank).label}</Badge>}
                        {desktopKw && <Badge variant={rankBadge(desktopKw.currentRank).variant} size="sm">{rankBadge(desktopKw.currentRank).label}</Badge>}
                        {(mobileKw?.inLocalPack || desktopKw?.inLocalPack) && (
                          <Badge variant="success" size="sm">📍 Map Pack</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-hub-text-muted flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {displayKw.city}, {displayKw.state}
                        </span>
                        <span className="font-mono">{displayKw.domain}</span>
                        <span className="flex items-center gap-1 ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatChecked(mobileKw?.lastChecked || desktopKw?.lastChecked)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {mobileKw && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Check mobile ranking"
                          loading={isCheckingMobile}
                          onClick={() => handleCheck(mobileKw)}
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {desktopKw && (
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Check desktop ranking"
                          loading={isCheckingDesktop}
                          onClick={() => handleCheck(desktopKw)}
                        >
                          <Monitor className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        title="Remove keyword"
                        onClick={() => {
                          if (window.confirm(`Remove "${displayKw.keyword}"?`)) {
                            if (mobileKw) handleDelete(mobileKw)
                            if (desktopKw) handleDelete(desktopKw)
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-hub-red" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          })()}
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
