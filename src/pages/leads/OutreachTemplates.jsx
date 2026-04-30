import { useState, useEffect } from 'react'
import { Copy, Download, Check, Mail, ChevronDown } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import ToolGate from '../../components/ui/ToolGate'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import { useToast } from '../../hooks/useToast'
import { getLeadsBatches } from '../../services/firestore'
import { getOutreachSequence } from './outreachData'
import { NICHES } from '../../config'

function EmailCard({ email, index }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const colors = ['text-hub-blue', 'text-hub-purple', 'text-hub-orange']
  const bgColors = ['bg-hub-blue/10', 'bg-hub-purple/10', 'bg-hub-orange/10']
  const labels = ['Email 1 — Introduction', 'Email 2 — Follow-Up (Day 4)', 'Email 3 — Break-Up (Day 8)']

  async function copy() {
    const text = `Subject: ${email.subject}\n\n${email.body}`
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast('Copied to clipboard.', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-hub-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-hub-border bg-hub-input/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full ${bgColors[index]} flex items-center justify-center text-xs font-bold ${colors[index]}`}>
            {email.number}
          </span>
          <span className="text-sm font-medium text-hub-text">{labels[index]}</span>
        </div>
        <Button size="sm" variant="ghost" onClick={copy}>
          {copied
            ? <><Check className="w-3.5 h-3.5 mr-1 text-hub-green" /> Copied</>
            : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>
          }
        </Button>
      </div>
      <div className="px-4 py-4">
        <div className="mb-3">
          <p className="text-xs text-hub-text-muted mb-1 uppercase tracking-wide font-medium">Subject</p>
          <p className="text-sm font-medium text-hub-text">{email.subject}</p>
        </div>
        <div>
          <p className="text-xs text-hub-text-muted mb-1 uppercase tracking-wide font-medium">Body</p>
          <p className="text-sm text-hub-text-secondary leading-relaxed whitespace-pre-line">{email.body}</p>
        </div>
      </div>
    </div>
  )
}

function downloadSequence(emails, niche, city) {
  const text = emails
    .map(e => `=== EMAIL ${e.number} ===\nSubject: ${e.subject}\n\n${e.body}`)
    .join('\n\n' + '─'.repeat(50) + '\n\n')
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `outreach-${niche}-${(city || 'general').replace(/[^a-z0-9]/gi, '-')}.txt`.toLowerCase()
  a.click()
  URL.revokeObjectURL(url)
}

export default function OutreachTemplates() {
  const { userProfile } = useAuth()
  const { hasOutreachTemplates } = useBilling()
  const { toast } = useToast()

  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(true)

  // Mode: 'batch' = pick from saved list, 'manual' = pick niche + city directly
  const [mode, setMode] = useState('batch')
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [manualNiche, setManualNiche] = useState('')
  const [manualCity, setManualCity] = useState('')

  const [emails, setEmails] = useState(null)
  const [activeNiche, setActiveNiche] = useState('')
  const [activeCity, setActiveCity] = useState('')

  useEffect(() => {
    if (!userProfile?.id) return
    getLeadsBatches(userProfile.id)
      .then(data => { setBatches(data); setBatchesLoading(false) })
      .catch(() => setBatchesLoading(false))
  }, [userProfile?.id])

  if (!hasOutreachTemplates) return <ToolGate tool="outreachTemplates" />

  const batchOptions = batches.map(b => {
    const nicheLabel = NICHES.find(n => n.value === b.niche)?.label || b.niche
    return { value: b.id, label: `${nicheLabel} in ${b.city} (${b.totalFound} leads)` }
  })

  const selectedBatch = batches.find(b => b.id === selectedBatchId)

  function handleGenerate() {
    let niche, city
    if (mode === 'batch') {
      if (!selectedBatchId) { toast('Select a lead list.', 'error'); return }
      niche = selectedBatch?.niche || ''
      city = selectedBatch?.city || ''
    } else {
      if (!manualNiche) { toast('Select a niche.', 'error'); return }
      niche = manualNiche
      city = manualCity.trim()
    }
    const sequence = getOutreachSequence(niche, city)
    setEmails(sequence)
    setActiveNiche(niche)
    setActiveCity(city)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Outreach Templates</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          3-email cold outreach sequence for your target niche. Fill in the placeholders before sending.
        </p>
      </div>

      {/* Picker card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Sequence</CardTitle>
        </CardHeader>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMode('batch'); setEmails(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
              mode === 'batch'
                ? 'bg-hub-blue/10 border-hub-blue text-hub-blue'
                : 'border-hub-border text-hub-text-muted hover:text-hub-text'
            }`}
          >
            From a Lead List
          </button>
          <button
            onClick={() => { setMode('manual'); setEmails(null) }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
              mode === 'manual'
                ? 'bg-hub-blue/10 border-hub-blue text-hub-blue'
                : 'border-hub-border text-hub-text-muted hover:text-hub-text'
            }`}
          >
            Choose Niche Manually
          </button>
        </div>

        {mode === 'batch' ? (
          batchesLoading ? (
            <div className="flex items-center gap-3 py-4">
              <Spinner size="sm" />
              <span className="text-sm text-hub-text-secondary">Loading your lead lists…</span>
            </div>
          ) : batches.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-hub-text-secondary">
                No lead lists saved yet.{' '}
                <a href="/leads" className="text-hub-blue hover:underline">Run a search first</a>
                {' '}or switch to "Choose Niche Manually" above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Select
                label="Lead list"
                value={selectedBatchId}
                onChange={e => { setSelectedBatchId(e.target.value); setEmails(null) }}
                options={batchOptions}
                placeholder="Select a batch…"
              />
              <Button className="w-full" size="lg" disabled={!selectedBatchId} onClick={handleGenerate}>
                <Mail className="w-4 h-4 mr-2" /> Load Outreach Sequence
              </Button>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <Select
              label="Business niche"
              value={manualNiche}
              onChange={e => { setManualNiche(e.target.value); setEmails(null) }}
              options={NICHES}
              placeholder="Select niche…"
            />
            <Input
              label="Target city (optional)"
              value={manualCity}
              onChange={e => { setManualCity(e.target.value); setEmails(null) }}
              placeholder="e.g. Salt Lake City, UT"
            />
            <Button className="w-full" size="lg" disabled={!manualNiche} onClick={handleGenerate}>
              <Mail className="w-4 h-4 mr-2" /> Load Outreach Sequence
            </Button>
          </div>
        )}
      </Card>

      {/* Email sequence */}
      {emails && emails.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-hub-text">Your 3-Email Sequence</h2>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadSequence(emails, activeNiche, activeCity)}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download .txt
            </Button>
          </div>

          <div className="space-y-4">
            {emails.map((email, i) => (
              <EmailCard key={i} email={email} index={i} />
            ))}
          </div>

          <div className="mt-6 p-4 bg-hub-input/30 rounded-xl border border-hub-border">
            <p className="text-xs font-medium text-hub-text mb-2">Replace these placeholders before sending:</p>
            <div className="flex flex-wrap gap-2">
              {['{{firstName}}', '{{businessName}}', '{{city}}', '{{senderName}}'].map(p => (
                <code key={p} className="bg-hub-card px-2 py-1 rounded text-hub-blue text-xs border border-hub-border">
                  {p}
                </code>
              ))}
            </div>
            <p className="text-xs text-hub-text-muted mt-3">
              Send Email 1 on day 1 · Email 2 on day 4 · Email 3 on day 8
            </p>
          </div>
        </>
      )}
    </div>
  )
}
