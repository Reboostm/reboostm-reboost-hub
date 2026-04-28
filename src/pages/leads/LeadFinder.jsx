import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, ChevronLeft, ChevronRight, Star, Globe, Phone, MapPin, MapIcon, AlertCircle } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import Modal from '../../components/ui/Modal'
import ToolGate from '../../components/ui/ToolGate'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import { useToast } from '../../hooks/useToast'
import { searchLeads } from '../../services/functions'
import { getOffers } from '../../services/firestore'
import { redirectToCheckout } from '../../services/stripe'
import { markLeadsBatchExported } from '../../services/firestore'
import { NICHES } from '../../config'

const RADIUS_OPTIONS = [
  { value: '5',  label: '5 miles' },
  { value: '10', label: '10 miles' },
  { value: '25', label: '25 miles' },
  { value: '50', label: '50 miles' },
]

const PAGE_SIZE = 10
const LEAD_PACKAGE_OFFERS = ['leadCredits50', 'leadCredits150', 'leadCredits500']

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

function PurchaseModal({ isOpen, onClose, previewResults, offers, loading }) {
  const { toast } = useToast()

  if (!previewResults) return null

  const handleSelectOffer = async (offerId) => {
    try {
      await redirectToCheckout(offerId)
      // After they return from Stripe, webhook will have credited their account
      // They can click "Preview Available Leads" again to search with their new balance
    } catch (err) {
      toast(err.message || 'Could not start checkout', 'error')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Get These Leads" size="lg">
      <div className="space-y-6">
        <div className="bg-hub-blue/10 border border-hub-blue/20 rounded-lg p-4">
          <p className="text-sm text-hub-text font-medium">
            Found {previewResults.length} leads matching your search
          </p>
          <p className="text-xs text-hub-text-secondary mt-2">
            Buy a lead package below to unlock and download all of them.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-hub-text mb-3">Lead Packages</h3>
          <div className="space-y-2">
            {offers.length === 0 ? (
              <p className="text-sm text-hub-text-secondary">No packages available yet. Check back soon!</p>
            ) : (
              offers.map(offer => (
                <button
                  key={offer.id}
                  onClick={() => handleSelectOffer(offer.id)}
                  disabled={!offer.stripePriceId}
                  className="w-full text-left p-4 border border-hub-border rounded-lg hover:border-hub-blue transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-hub-text">{offer.name}</p>
                      <p className="text-xs text-hub-text-secondary mt-1">{offer.description}</p>
                    </div>
                    <div className="text-right whitespace-nowrap ml-4">
                      <p className="text-lg font-bold text-hub-blue">${offer.price}</p>
                      {!offer.stripePriceId && (
                        <Badge variant="gray" size="sm" className="mt-1">Soon</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose}>Skip for Now</Button>
        </div>
      </div>
    </Modal>
  )
}

export default function LeadFinder() {
  const { userProfile } = useAuth()
  const { hasLeadCredits, leadCredits } = useBilling()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [niche, setNiche] = useState('')
  const [city, setCity] = useState('')
  const [radius, setRadius] = useState('25')
  const [loading, setLoading] = useState(false)
  const [previewResults, setPreviewResults] = useState(null)
  const [savedResults, setSavedResults] = useState(null)
  const [batchId, setBatchId] = useState(null)
  const [page, setPage] = useState(1)
  const [exported, setExported] = useState(false)
  const [offers, setOffers] = useState([])
  const [showPurchaseModal, setShowPurchaseModal] = useState(false)
  const [purchasingOffer, setPurchasingOffer] = useState(null)

  if (!hasLeadCredits) return <ToolGate tool="leads" />

  const totalPages = savedResults ? Math.ceil(savedResults.length / PAGE_SIZE) : 0
  const pageResults = savedResults ? savedResults.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : []

  async function handlePreview(e) {
    e.preventDefault()
    if (!niche) { toast('Select a business niche.', 'error'); return }
    if (!city.trim()) { toast('Enter a city.', 'error'); return }

    setLoading(true)
    setPreviewResults(null)

    try {
      const data = await searchLeads({ niche, city: city.trim(), radius: Number(radius) })
      const results = data.results || []
      setPreviewResults(results)

      if (results.length === 0) {
        toast('No businesses found. Try a different niche or city.', 'warning')
        return
      }

      // Load lead package offers
      const leadOffers = await getOffers(true)
      const filtered = leadOffers.filter(o => o.unlocksFeature === 'leadCredits').sort((a, b) => a.price - b.price)
      setOffers(filtered)

      toast(`Found ${results.length} leads available!`, 'success')
      setShowPurchaseModal(true)
    } catch (err) {
      toast(err.message || 'Search failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    if (!savedResults) return
    const nicheLabel = NICHES.find(n => n.value === niche)?.label || niche
    const filename = `leads-${nicheLabel}-${city.replace(/[^a-z0-9]/gi, '-')}.csv`.toLowerCase()
    exportCSV(savedResults, filename)
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
          <p className="text-hub-text-secondary text-sm mt-1">
            Find qualified local businesses via Google Maps. Preview what you'll get, then buy lead packages.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-hub-text-muted">Leads remaining</p>
          <p className="text-2xl font-bold text-hub-blue">{leadCredits === 9999 ? '∞' : leadCredits}</p>
        </div>
      </div>

      {/* Search form */}
      <Card className="mb-6">
        <form onSubmit={handlePreview}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Select
              label="Business niche"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              options={NICHES}
              placeholder="Select niche…"
            />
            <Input
              label="City + State"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Salt Lake City, UT"
            />
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
                <MapIcon className="w-4 h-4" /> Preview Available Leads
              </span>
            )}
          </Button>
          <p className="text-xs text-hub-text-muted text-center mt-2">Preview is FREE — see what you'll get before buying</p>
        </form>
      </Card>

      {/* Loading skeleton */}
      {loading && (
        <Card>
          <div className="flex flex-col items-center py-12 gap-4">
            <Spinner size="lg" />
            <p className="text-hub-text-secondary text-sm">Searching Google Maps…</p>
          </div>
        </Card>
      )}

      {/* Saved Results */}
      {!loading && savedResults && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {savedResults.length > 0 ? `${savedResults.length} leads saved` : 'No results'}
              </CardTitle>
              {savedResults.length > 0 && (
                <Button size="sm" variant="secondary" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-1.5" /> Export CSV
                </Button>
              )}
            </div>
          </CardHeader>

          {savedResults.length > 0 && (
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
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-hub-blue hover:text-hub-blue-hover text-xs">
                              <Phone className="w-3.5 h-3.5" />
                              {lead.phone}
                            </a>
                          ) : <span className="text-hub-text-muted text-xs">—</span>}
                        </td>
                        <td className="py-3 pr-4 hidden lg:table-cell">
                          {lead.website ? (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-hub-blue hover:text-hub-blue-hover text-xs truncate max-w-[160px]">
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-hub-border">
                  <p className="text-xs text-hub-text-muted">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, savedResults.length)} of {savedResults.length}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="flex items-center text-xs text-hub-text-secondary px-2">{page} / {totalPages}</span>
                    <Button size="sm" variant="ghost" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

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

      {/* Purchase Modal */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false)
          setSavedResults(previewResults)
        }}
        previewResults={previewResults}
        offers={offers}
        onPurchase={(offerId) => {
          setSavedResults(previewResults)
          setShowPurchaseModal(false)
        }}
        loading={purchasingOffer}
      />
    </div>
  )
}
