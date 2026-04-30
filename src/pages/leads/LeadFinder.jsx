import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, ChevronLeft, ChevronRight, Star, Globe, Phone, MapPin } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import ToolGate from '../../components/ui/ToolGate'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import { useToast } from '../../hooks/useToast'
import { searchLeads } from '../../services/functions'
import { markLeadsBatchExported } from '../../services/firestore'
import { NICHES, US_STATES, STATE_CITIES } from '../../config'

const RADIUS_OPTIONS = [
  { value: '5',  label: '5 miles' },
  { value: '10', label: '10 miles' },
  { value: '25', label: '25 miles' },
  { value: '50', label: '50 miles' },
]

const PAGE_SIZE = 10

function exportCSV(results, filename = 'leads.csv') {
  const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Email', 'Rating', 'Reviews', 'Place ID']
  const rows = results.map(r => [
    r.businessName, r.address, r.phone, r.website, r.email,
    r.rating ?? '', r.reviewCount ?? '', r.placeId,
  ])
  const csv = [headers, ...rows]
    .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function LeadFinder() {
  const { userProfile } = useAuth()
  const { hasLeadCredits, leadCredits } = useBilling()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [niche, setNiche] = useState('')
  const [state, setState] = useState('')
  const [city, setCity] = useState('')
  const [searchMode, setSearchMode] = useState('city') // 'city' or 'state'
  const [radius, setRadius] = useState('25')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [batchId, setBatchId] = useState(null)
  const [page, setPage] = useState(1)
  const [exported, setExported] = useState(false)
  const [citiesSearched, setCitiesSearched] = useState(0)

  if (!hasLeadCredits) return <ToolGate tool="leads" />

  const totalPages = results ? Math.ceil(results.length / PAGE_SIZE) : 0
  const pageResults = results ? results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : []

  async function handleSearch(e) {
    e.preventDefault()
    if (!niche) { toast('Select a business niche.', 'error'); return }

    const creditCost = searchMode === 'state' ? 10 : 1
    if (leadCredits < creditCost) {
      toast(`Need ${creditCost} credits (you have ${leadCredits}). Upgrade to continue.`, 'error')
      return
    }

    if (searchMode === 'city' && !city.trim()) {
      toast('Enter a city.', 'error')
      return
    }

    if (searchMode === 'state' && !state) {
      toast('Select a state.', 'error')
      return
    }

    setLoading(true)
    setResults(null)
    setBatchId(null)
    setPage(1)
    setExported(false)

    try {
      const searchParams = { niche, radius: Number(radius) }
      if (searchMode === 'city') {
        searchParams.city = city.trim()
      } else {
        searchParams.state = state
      }

      const data = await searchLeads(searchParams)
      setResults(data.results || [])
      setBatchId(data.batchId)
      setCitiesSearched(data.citiesSearched || 0)
      if ((data.results || []).length === 0) {
        toast('No businesses found. Try a different niche or city.', 'warning')
      } else {
        toast(`Found ${data.results.length} leads! Saved to My Lead Lists.`, 'success')
      }
    } catch (err) {
      toast(err.message || 'Search failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    if (!results) return
    const nicheLabel = NICHES.find(n => n.value === niche)?.label || niche
    const location = searchMode === 'state' ? state : city
    const filename = `leads-${nicheLabel}-${location.replace(/[^a-z0-9]/gi, '-')}.csv`.toLowerCase()
    exportCSV(results, filename)
    if (batchId && !exported) {
      await markLeadsBatchExported(batchId)
      setExported(true)
    }
    toast('CSV downloaded.', 'success')
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Lead Generator</h1>
          <p className="text-hub-text-secondary text-sm mt-1">Find qualified local businesses via Google Maps. Each lead includes: Business Name, Phone, Website, Address, Rating & Reviews.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-hub-text-muted">Credits remaining</p>
          <p className="text-2xl font-bold text-hub-blue">{leadCredits === 9999 ? '∞' : leadCredits}</p>
        </div>
      </div>

      {/* Search form */}
      <Card className="mb-6">
        <form onSubmit={handleSearch}>
          {/* Search mode toggle */}
          <div className="mb-6">
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => { setSearchMode('city'); setState('') }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchMode === 'city'
                    ? 'bg-hub-blue text-white'
                    : 'bg-hub-card border border-hub-border text-hub-text hover:bg-hub-input'
                }`}
              >
                Single City (1 credit)
              </button>
              <button
                type="button"
                onClick={() => { setSearchMode('state'); setCity('') }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  searchMode === 'state'
                    ? 'bg-hub-orange text-white'
                    : 'bg-hub-card border border-hub-border text-hub-text hover:bg-hub-input'
                }`}
              >
                Multi-City Search (10 credits)
              </button>
            </div>

            {/* Credit explanation */}
            <div className="bg-hub-card border border-hub-border rounded-lg p-3">
              {searchMode === 'city' ? (
                <div className="text-xs text-hub-text-secondary">
                  <p className="font-medium text-hub-text mb-1">Single City: 20-60 leads (1 credit)</p>
                  <p>Searches one city. Fast results in 5-10 seconds.</p>
                </div>
              ) : (
                <div className="text-xs text-hub-text-secondary">
                  <p className="font-medium text-hub-text mb-1">Multi-City: 100-300+ leads (10 credits)</p>
                  <p>Searches 5-7 major cities in your state. More comprehensive, takes 30-60 seconds.</p>
                </div>
              )}
            </div>
          </div>

          {/* Show cities for multi-city search */}
          {searchMode === 'state' && state && (
            <div className="mb-4 p-3 bg-hub-input rounded-lg">
              <p className="text-xs font-medium text-hub-text-muted mb-2">Cities to be searched:</p>
              <div className="flex flex-wrap gap-1">
                {STATE_CITIES[state]?.map(city => (
                  <span key={city} className="text-xs bg-hub-blue/20 text-hub-blue px-2 py-1 rounded">
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Select
              label="Business niche"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              options={NICHES}
              placeholder="Select niche…"
            />
            {searchMode === 'city' ? (
              <Input
                label="City"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g., Salt Lake City"
              />
            ) : (
              <Select
                label="State"
                value={state}
                onChange={e => setState(e.target.value)}
                options={US_STATES}
                placeholder="Select state…"
              />
            )}
            <Select
              label="Search radius"
              value={radius}
              onChange={e => setRadius(e.target.value)}
              options={RADIUS_OPTIONS}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" loading={loading} disabled={loading}>
            {loading ? 'Searching Google Maps…' : (
              <span className="flex items-center gap-2 justify-center">
                <Search className="w-4 h-4" /> Find Leads ({searchMode === 'city' ? '1 credit' : '10 credits, 100+ leads'})
              </span>
            )}
          </Button>
        </form>
      </Card>

      {/* Loading skeleton */}
      {loading && (
        <Card>
          <div className="flex flex-col items-center py-12 gap-4">
            <Spinner size="lg" />
            <p className="text-hub-text-secondary text-sm">
              {searchMode === 'city'
                ? 'Searching Google Maps and enriching results…'
                : 'Searching 5-7 major cities and enriching results… (this takes 30-60 seconds)'}
            </p>
          </div>
        </Card>
      )}

      {/* Results */}
      {!loading && results !== null && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {results.length > 0 ? `${results.length} leads found` : 'No results'}
                </CardTitle>
                {citiesSearched > 0 && (
                  <p className="text-xs text-hub-text-muted mt-1">Searched {citiesSearched} cities</p>
                )}
              </div>
              {results.length > 0 && (
                <Button size="sm" variant="secondary" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1.5" /> Export CSV
                </Button>
              )}
            </div>
          </CardHeader>

          {results.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hub-border text-hub-text-muted text-left">
                      <th className="pb-3 pr-4 font-medium">Business</th>
                      <th className="pb-3 pr-4 font-medium hidden md:table-cell">Address</th>
                      <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Phone</th>
                      <th className="pb-3 pr-4 font-medium hidden lg:table-cell">Website</th>
                      <th className="pb-3 font-medium text-right">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hub-border">
                    {pageResults.map((lead, i) => (
                      <tr key={lead.placeId || i} className="hover:bg-hub-input/40 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-hub-text">{lead.businessName}</p>
                          <p className="text-hub-text-muted text-xs mt-0.5 md:hidden">{lead.address}</p>
                        </td>
                        <td className="py-3 pr-4 text-hub-text-secondary hidden md:table-cell">
                          <span className="flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-hub-text-muted" />
                            <span className="text-xs leading-snug">{lead.address || '—'}</span>
                          </span>
                        </td>
                        <td className="py-3 pr-4 hidden lg:table-cell">
                          {lead.phone ? (
                            <a
                              href={`tel:${lead.phone}`}
                              className="flex items-center gap-1 text-hub-blue hover:text-hub-blue-hover text-xs"
                            >
                              <Phone className="w-3.5 h-3.5" />
                              {lead.phone}
                            </a>
                          ) : <span className="text-hub-text-muted text-xs">—</span>}
                        </td>
                        <td className="py-3 pr-4 hidden lg:table-cell">
                          {lead.website ? (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-hub-blue hover:text-hub-blue-hover text-xs truncate max-w-[160px]"
                            >
                              <Globe className="w-3.5 h-3.5 shrink-0" />
                              {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          ) : <span className="text-hub-text-muted text-xs">—</span>}
                        </td>
                        <td className="py-3 text-right">
                          {lead.rating != null ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <Star className="w-3.5 h-3.5 text-hub-yellow fill-hub-yellow" />
                              <span className="text-hub-text font-medium">{lead.rating}</span>
                              <span className="text-hub-text-muted">({lead.reviewCount})</span>
                            </span>
                          ) : <span className="text-hub-text-muted text-xs">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-hub-border">
                  <p className="text-xs text-hub-text-muted">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, results.length)} of {results.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="flex items-center text-xs text-hub-text-secondary px-2">
                      {page} / {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={page === totalPages}
                      onClick={() => setPage(p => p + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Outreach upsell */}
              <div className="mt-4 pt-4 border-t border-hub-border flex items-center justify-between bg-hub-input/30 rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-hub-text">Turn these leads into booked appointments</p>
                  <p className="text-xs text-hub-text-secondary mt-0.5">Generate a 3-email cold outreach sequence tailored to this niche.</p>
                </div>
                <Button size="sm" onClick={() => navigate('/leads/outreach')}>
                  Get Outreach Templates →
                </Button>
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  )
}
