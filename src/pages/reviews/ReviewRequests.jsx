import { useState, useEffect } from 'react'
import { doc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../hooks/useToast'
import { sendReviewRequest } from '../../services/functions'
import { useNavigate } from 'react-router-dom'
import { Send, Copy, CheckCircle, ExternalLink, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react'

const PREVIEW_TEMPLATE = (businessName, reviewLink) => `
Hi [Customer Name],

Thank you for choosing ${businessName || 'us'}! We hope you had a great experience.

If you have a moment, we'd love to hear what you think. Your feedback helps us improve and helps others find trusted local businesses.

👉 Leave a Google Review: ${reviewLink || '[review link]'}

It only takes a minute and means the world to us.

Thank you!
${businessName || ''}
`.trim()

function parseCustomerList(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      // Supports: "Name, email" or "Name <email>" or just "email"
      const angleMatch = line.match(/^(.+?)\s*<(.+?)>$/)
      if (angleMatch) return { name: angleMatch[1].trim(), email: angleMatch[2].trim() }
      const commaMatch = line.match(/^(.+?),\s*(.+@.+)$/)
      if (commaMatch) return { name: commaMatch[1].trim(), email: commaMatch[2].trim() }
      if (line.includes('@')) return { name: '', email: line }
      return null
    })
    .filter(Boolean)
}

export default function ReviewRequests() {
  const { hasReviewManager } = useBilling()
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [reviewProfile, setReviewProfile] = useState(null)
  const [fromName, setFromName]     = useState('')
  const [fromEmail, setFromEmail]   = useState('')
  const [customerList, setCustomerList] = useState('')
  const [sending, setSending]       = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [history, setHistory]       = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
      const d = snap.data()
      setReviewProfile(d?.reviewProfile || null)
      if (d?.displayName && !fromName) setFromName(d.displayName)
      if (d?.email && !fromEmail) setFromEmail(d.email)
    })
    return unsub
  }, [user])

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'reviewRequests'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    )
    getDocs(q).then(snap => {
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoadingHistory(false)
    })
  }, [user])

  const parsed = parseCustomerList(customerList)
  const validCustomers = parsed.filter(c => c.email?.includes('@'))
  const reviewLink = reviewProfile?.reviewLink || ''
  const businessName = reviewProfile?.businessName || fromName || ''

  async function handleSend(e) {
    e.preventDefault()
    if (!validCustomers.length) { toast('Add at least one valid customer email.', 'error'); return }
    if (!reviewLink) {
      toast('No review link found. Connect your business in All Reviews first.', 'error')
      return
    }
    setSending(true)
    try {
      const { sent, total } = await sendReviewRequest({
        customers: validCustomers,
        businessName,
        reviewLink,
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
      })
      toast(`Sent ${sent} of ${total} emails.`, sent === total ? 'success' : 'warning')
      setCustomerList('')
      // Refresh history
      const q = query(
        collection(db, 'reviewRequests'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      )
      getDocs(q).then(snap => setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    } catch (err) {
      toast(err.message || 'Send failed. Check SENDGRID_API_KEY env var.', 'error')
    } finally {
      setSending(false)
    }
  }

  async function copyLink() {
    if (!reviewLink) return
    await navigator.clipboard.writeText(reviewLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  if (!hasReviewManager) return <ToolGate tool="reviewManager" />

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Review Requests</h1>
          <p className="text-hub-text-secondary text-sm mt-0.5">
            Send personalized review requests to your customers.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/reviews')}>
          ← All Reviews
        </Button>
      </div>

      {/* Review Link */}
      <Card>
        <CardHeader>
          <CardTitle>Your Google Review Link</CardTitle>
        </CardHeader>
        {reviewLink ? (
          <div className="flex items-center gap-3">
            <code className="flex-1 text-xs text-hub-blue bg-hub-input border border-hub-border rounded-lg px-3 py-2 truncate">
              {reviewLink}
            </code>
            <Button size="sm" variant="ghost" onClick={copyLink}>
              {copiedLink
                ? <CheckCircle className="w-3.5 h-3.5 text-hub-green" />
                : <Copy className="w-3.5 h-3.5" />
              }
            </Button>
            <a
              href={reviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-hub-text-muted hover:text-hub-blue transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-3 bg-hub-yellow/10 border border-hub-yellow/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-hub-yellow shrink-0" />
            <p className="text-xs text-hub-text-secondary">
              No review link yet.{' '}
              <button onClick={() => navigate('/reviews')} className="text-hub-blue hover:underline">
                Connect your business in All Reviews
              </button>{' '}
              first.
            </p>
          </div>
        )}
      </Card>

      {/* Send form */}
      <form onSubmit={handleSend}>
        <Card>
          <CardHeader>
            <CardTitle>Send Requests</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Your Name / Business Name"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                placeholder="ABC Plumbing"
              />
              <Input
                label="Reply-To Email"
                type="email"
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
                placeholder="hello@yourbusiness.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-hub-text-secondary mb-1.5">
                Customer List
                <span className="text-hub-text-muted font-normal ml-1">
                  — one per line: "Name, email" or "Name &lt;email&gt;" or just "email"
                </span>
              </label>
              <textarea
                value={customerList}
                onChange={e => setCustomerList(e.target.value)}
                placeholder={`John Smith, john@example.com\nJane Doe <jane@example.com>\nbob@example.com`}
                rows={5}
                className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30 resize-none font-mono"
              />
              {customerList.trim() && (
                <p className={`text-xs mt-1 ${validCustomers.length === 0 ? 'text-hub-red' : 'text-hub-text-muted'}`}>
                  {validCustomers.length} valid email{validCustomers.length !== 1 ? 's' : ''} parsed
                  {parsed.length !== validCustomers.length && ` (${parsed.length - validCustomers.length} invalid)`}
                </p>
              )}
            </div>

            {/* Email preview toggle */}
            <button
              type="button"
              onClick={() => setShowPreview(v => !v)}
              className="flex items-center gap-1.5 text-xs text-hub-blue hover:underline"
            >
              {showPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showPreview ? 'Hide' : 'Preview'} email template
            </button>

            {showPreview && (
              <div className="bg-hub-input border border-hub-border rounded-lg p-4 text-xs text-hub-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                {PREVIEW_TEMPLATE(businessName, reviewLink)}
              </div>
            )}

            <div className="p-3 bg-hub-input/30 rounded-lg border border-hub-border text-xs text-hub-text-secondary leading-relaxed">
              Requires <code className="bg-hub-card px-1 rounded text-hub-blue">SENDGRID_API_KEY</code> set
              in Firebase Functions env vars (Firebase Console → Functions → sendReviewRequest → Edit → Runtime environment variables).
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={sending}
              disabled={!validCustomers.length || !reviewLink}
            >
              <Send className="w-4 h-4 mr-2" />
              Send to {validCustomers.length || 0} Customer{validCustomers.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </Card>
      </form>

      {/* History */}
      <div>
        <h2 className="text-base font-semibold text-hub-text mb-3">Request History</h2>
        {loadingHistory ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-hub-text-muted" />
          </div>
        ) : history.length === 0 ? (
          <Card>
            <p className="text-sm text-hub-text-muted text-center py-6">
              No requests sent yet.
            </p>
          </Card>
        ) : (
          <Card padding={false}>
            <div className="divide-y divide-hub-border">
              {history.map(req => {
                const sentAt = req.sentAt?.toDate
                  ? req.sentAt.toDate().toLocaleDateString()
                  : req.sentAt
                    ? new Date(req.sentAt).toLocaleDateString()
                    : '—'
                return (
                  <div key={req.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-hub-text truncate">
                        {req.customerName || req.customerEmail}
                      </p>
                      <p className="text-xs text-hub-text-muted truncate">{req.customerEmail}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-hub-text-muted">{sentAt}</span>
                      <Badge variant={req.status === 'sent' ? 'success' : 'error'} size="sm">
                        {req.status}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
