import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, ChevronDown, ChevronRight, Download,
  MapPin, Phone, Globe, Star,
} from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Spinner from '../../components/ui/Spinner'
import ToolGate from '../../components/ui/ToolGate'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import { useToast } from '../../hooks/useToast'
import { subscribeToLeadsBatches, getLeadsBatchItems, markLeadsBatchExported } from '../../services/firestore'
import { NICHES } from '../../config'

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function exportCSV(items, filename) {
  const headers = ['Business Name', 'Address', 'Phone', 'Website', 'Email', 'Rating', 'Reviews']
  const rows = items.map(r => [
    r.businessName, r.address, r.phone, r.website, r.email,
    r.rating ?? '', r.reviewCount ?? '',
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

function BatchRow({ batch }) {
  const { toast } = useToast()
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState(null)
  const [loadingItems, setLoadingItems] = useState(false)

  const nicheLabel = NICHES.find(n => n.value === batch.niche)?.label || batch.niche

  async function toggle() {
    if (!expanded && items === null) {
      setLoadingItems(true)
      try {
        const data = await getLeadsBatchItems(batch.id)
        setItems(data)
      } catch {
        toast('Failed to load leads.', 'error')
      } finally {
        setLoadingItems(false)
      }
    }
    setExpanded(v => !v)
  }

  async function handleExport() {
    let exportItems = items
    if (!exportItems) {
      setLoadingItems(true)
      try {
        exportItems = await getLeadsBatchItems(batch.id)
        setItems(exportItems)
      } catch {
        toast('Failed to load leads for export.', 'error')
        setLoadingItems(false)
        return
      }
      setLoadingItems(false)
    }
    const filename = `leads-${nicheLabel}-${batch.city.replace(/[^a-z0-9]/gi, '-')}.csv`.toLowerCase()
    exportCSV(exportItems, filename)
    await markLeadsBatchExported(batch.id)
    toast('CSV downloaded.', 'success')
  }

  return (
    <div className="border border-hub-border rounded-xl overflow-hidden">
      {/* Batch header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-4 hover:bg-hub-input/30 transition-colors text-left"
        onClick={toggle}
      >
        {expanded
          ? <ChevronDown className="w-4 h-4 text-hub-text-muted shrink-0" />
          : <ChevronRight className="w-4 h-4 text-hub-text-muted shrink-0" />
        }
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-hub-text">{nicheLabel}</span>
            <span className="text-hub-text-muted text-sm">in {batch.city}</span>
            {batch.exported && <Badge variant="success" size="sm">Exported</Badge>}
          </div>
          <p className="text-xs text-hub-text-muted mt-0.5">{formatDate(batch.createdAt)} · {batch.totalFound} leads</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={e => { e.stopPropagation(); handleExport() }}
          loading={loadingItems && !expanded}
        >
          <Download className="w-3.5 h-3.5 mr-1" /> CSV
        </Button>
      </button>

      {/* Expanded items table */}
      {expanded && (
        <div className="border-t border-hub-border">
          {loadingItems ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : items && items.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-hub-input/40 text-hub-text-muted text-xs text-left">
                    <th className="px-4 py-2.5 font-medium">Business</th>
                    <th className="px-4 py-2.5 font-medium hidden md:table-cell">Address</th>
                    <th className="px-4 py-2.5 font-medium hidden lg:table-cell">Contact</th>
                    <th className="px-4 py-2.5 font-medium text-right">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hub-border">
                  {items.map((lead, i) => (
                    <tr key={lead.placeId || i} className="hover:bg-hub-input/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-hub-text text-sm">{lead.businessName}</p>
                        <p className="text-hub-text-muted text-xs mt-0.5 md:hidden">{lead.address}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-hub-text-muted" />
                          <span className="text-xs text-hub-text-secondary leading-snug">{lead.address || '—'}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-col gap-1">
                          {lead.phone && (
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-hub-blue hover:text-hub-blue-hover text-xs">
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </a>
                          )}
                          {lead.website && (
                            <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-hub-blue hover:text-hub-blue-hover text-xs truncate max-w-[180px]">
                              <Globe className="w-3 h-3 shrink-0" />
                              {lead.website.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          )}
                          {!lead.phone && !lead.website && <span className="text-hub-text-muted text-xs">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
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
          ) : (
            <p className="text-center text-hub-text-muted text-sm py-6">No items found.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function MyLeads() {
  const { userProfile } = useAuth()
  const { hasLeadCredits } = useBilling()
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userProfile?.id) return
    const unsub = subscribeToLeadsBatches(userProfile.id, data => {
      setBatches(data)
      setLoading(false)
    })
    return unsub
  }, [userProfile?.id])

  if (!hasLeadCredits) return <ToolGate tool="leads" />

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">My Lead Lists</h1>
        <p className="text-hub-text-secondary text-sm mt-1">All saved lead batches. Expand to view leads or re-export CSV.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : batches.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No saved lead lists"
          description="Run a search in the Lead Finder to generate your first batch."
          action={<Link to="/leads" className="text-hub-blue hover:underline text-sm">Find Leads →</Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {batches.map(batch => (
            <BatchRow key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  )
}
