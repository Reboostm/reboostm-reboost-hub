import { useState, useEffect } from 'react'
import { Copy, Download, Check, Mail } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
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
  a.download = `outreach-${niche}-${city.replace(/[^a-z0-9]/gi, '-')}.txt`.toLowerCase()
  a.click()
  URL.revokeObjectURL(url)
}

export default function OutreachTemplates() {
  const { userProfile } = useAuth()
  const { hasOutreachTemplates } = useBilling()
  const { toast } = useToast()

  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(true)
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [emails, setEmails] = useState(null)

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
    if (!selectedBatchId) { toast('Select a lead list first.', 'error'); return }
    const sequence = getOutreachSequence(selectedBatch.niche, selectedBatch.city)
    setEmails(sequence)
  }

  function handleBatchChange(e) {
    setSelectedBatchId(e.target.value)
    setEmails(null)
  }

  const currentNiche = selectedBatch?.niche || ''
  const currentCity = selectedBatch?.city || ''

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Outreach Templates</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          3-email cold outreach sequence for your target niche. Fill in the highlighted placeholders before sending.
        </p>
      </div>

      {/* Picker */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select a Lead List</CardTitle>
        </CardHeader>

        {batchesLoading ? (
          <div className="flex items-center gap-3 py-4">
            <Spinner size="sm" />
            <span className="text-sm text-hub-text-secondary">Loading your lead lists…</span>
          </div>
        ) : batches.length === 0 ? (
          <p className="text-sm text-hub-text-secondary py-2">
            No lead lists yet.{' '}
            <a href="/leads" className="text-hub-blue hover:underline">Run a search first →</a>
          </p>
        ) : (
          <div className="space-y-4">
            <Select
              label="Lead list"
              value={selectedBatchId}
              onChange={handleBatchChange}
              options={batchOptions}
              placeholder="Select a batch…"
            />
            <Button
              className="w-full"
              size="lg"
              disabled={!selectedBatchId}
              onClick={handleGenerate}
            >
              <Mail className="w-4 h-4 mr-2" />
              Load Outreach Sequence
            </Button>
          </div>
        )}
      </Card>

      {/* Emails */}
      {emails && emails.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-hub-text">
              Your 3-Email Sequence
            </h2>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => downloadSequence(emails, currentNiche, currentCity)}
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
            <p className="text-xs font-medium text-hub-text mb-2">Before sending, replace these placeholders:</p>
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
