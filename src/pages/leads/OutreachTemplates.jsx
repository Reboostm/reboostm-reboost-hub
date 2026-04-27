import { useState, useEffect } from 'react'
import { Mail, Copy, Download, Sparkles, Check } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import ToolGate from '../../components/ui/ToolGate'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import { useToast } from '../../hooks/useToast'
import { getLeadsBatches } from '../../services/firestore'
import { generateOutreachSequence } from '../../services/functions'
import { NICHES } from '../../config'

function EmailCard({ email, index }) {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const colors = ['text-hub-blue', 'text-hub-purple', 'text-hub-orange']
  const bgColors = ['bg-hub-blue/10', 'bg-hub-purple/10', 'bg-hub-orange/10']
  const labels = ['Email 1 — Introduction', 'Email 2 — Follow-Up', 'Email 3 — Break-Up']

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
          <span className="text-sm font-medium text-hub-text">{labels[index] || `Email ${email.number}`}</span>
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
          <p className="text-xs text-hub-text-muted mb-1 uppercase tracking-wide">Subject</p>
          <p className="text-sm font-medium text-hub-text">{email.subject}</p>
        </div>
        <div>
          <p className="text-xs text-hub-text-muted mb-1 uppercase tracking-wide">Body</p>
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
  const [generating, setGenerating] = useState(false)
  const [emails, setEmails] = useState(null)
  const [currentNiche, setCurrentNiche] = useState('')
  const [currentCity, setCurrentCity] = useState('')

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

  async function handleGenerate() {
    if (!selectedBatchId) { toast('Select a lead list first.', 'error'); return }

    const niche = selectedBatch?.niche || ''
    const city = selectedBatch?.city || ''

    // Return cached sequence if already saved on batch doc
    if (selectedBatch?.outreachSequence) {
      setEmails(selectedBatch.outreachSequence)
      setCurrentNiche(niche)
      setCurrentCity(city)
      toast('Loaded saved outreach sequence.', 'success')
      return
    }

    setGenerating(true)
    setEmails(null)
    try {
      const data = await generateOutreachSequence({ niche, city, batchId: selectedBatchId })
      setEmails(data.emails)
      setCurrentNiche(niche)
      setCurrentCity(city)
      toast('Outreach sequence generated!', 'success')
    } catch (err) {
      toast(err.message || 'Generation failed. Please try again.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Outreach Templates</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          AI-generated 3-email cold outreach sequence tailored to your target niche.
        </p>
      </div>

      {/* Generator */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Sequence</CardTitle>
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
              label="Pick a lead list"
              value={selectedBatchId}
              onChange={e => { setSelectedBatchId(e.target.value); setEmails(null) }}
              options={batchOptions}
              placeholder="Select a batch…"
            />
            {selectedBatch?.outreachSequence && (
              <p className="text-xs text-hub-green flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Saved sequence available — click Generate to reload it.
              </p>
            )}
            <Button
              className="w-full"
              size="lg"
              loading={generating}
              disabled={generating || !selectedBatchId}
              onClick={handleGenerate}
            >
              {generating ? 'Writing emails with AI…' : (
                <span className="flex items-center gap-2 justify-center">
                  <Sparkles className="w-4 h-4" /> Generate 3-Email Sequence
                </span>
              )}
            </Button>
          </div>
        )}
      </Card>

      {/* Loading */}
      {generating && (
        <div className="flex flex-col items-center py-12 gap-4">
          <Spinner size="lg" />
          <p className="text-hub-text-secondary text-sm">Writing your outreach emails…</p>
        </div>
      )}

      {/* Results */}
      {!generating && emails && emails.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-hub-text">Your Outreach Sequence</h2>
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
            <p className="text-xs text-hub-text-secondary leading-relaxed">
              <span className="font-medium text-hub-text">How to use:</span> Replace{' '}
              <code className="bg-hub-card px-1 rounded text-hub-blue">{'{{firstName}}'}</code>,{' '}
              <code className="bg-hub-card px-1 rounded text-hub-blue">{'{{businessName}}'}</code>, and{' '}
              <code className="bg-hub-card px-1 rounded text-hub-blue">{'{{senderName}}'}</code>{' '}
              before sending. Send Email 1 on day 1, Email 2 on day 4, Email 3 on day 8.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
