import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBilling } from '../../hooks/useBilling'
import { useAuth } from '../../hooks/useAuth'
import ToolGate from '../../components/ui/ToolGate'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { useToast } from '../../hooks/useToast'
import { generateAIContent } from '../../services/functions'
import { Sparkles, Copy, CheckCircle, Calendar } from 'lucide-react'

const PLATFORMS = [
  { value: 'facebook',  label: 'Facebook',             limit: 500  },
  { value: 'instagram', label: 'Instagram',             limit: 2200 },
  { value: 'linkedin',  label: 'LinkedIn',              limit: 3000 },
  { value: 'gmb',       label: 'Google My Business',    limit: 1500 },
]

const TONES = [
  { value: 'professional', label: 'Professional' },
  { value: 'friendly',     label: 'Friendly & Casual' },
  { value: 'urgent',       label: 'Urgency / Promo' },
  { value: 'educational',  label: 'Educational' },
]

const EXAMPLES = [
  'Promote our spring HVAC tune-up special — $79 this month only',
  'Announce a new service: same-day emergency plumbing available',
  'Share a 5-star review we just received from a happy client',
  'Remind followers to schedule their annual roof inspection',
  'Introduce our team and why customers trust us for over 15 years',
]

export default function GenerateContent() {
  const { hasAICreator } = useBilling()
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [platform, setPlatform] = useState('facebook')
  const [tone, setTone]         = useState('professional')
  const [prompt, setPrompt]     = useState('')
  const [result, setResult]     = useState('')
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]     = useState(false)

  const selectedPlatform = PLATFORMS.find(p => p.value === platform)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!prompt.trim()) { toast('Describe the post first.', 'error'); return }
    setGenerating(true)
    setResult('')
    try {
      const { content } = await generateAIContent({
        platform,
        tone,
        prompt: prompt.trim(),
        businessName: userProfile?.businessName || '',
        niche: userProfile?.niche || '',
      })
      setResult(content)
    } catch (err) {
      toast(err.message || 'Generation failed. Check ANTHROPIC_API_KEY env var.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    toast('Copied to clipboard.', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  function handleUseInScheduler() {
    navigate('/scheduler/new', { state: { caption: result } })
  }

  if (!hasAICreator) return <ToolGate tool="creator" />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">AI Content Creator</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Describe your post idea — AI writes platform-optimized copy in seconds.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Post Settings</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Platform"
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              options={PLATFORMS.map(p => ({ value: p.value, label: p.label }))}
            />
            <Select
              label="Tone"
              value={tone}
              onChange={e => setTone(e.target.value)}
              options={TONES}
            />
          </div>
          {selectedPlatform && (
            <p className="text-xs text-hub-text-muted mt-2">
              {selectedPlatform.label} character limit: {selectedPlatform.limit.toLocaleString()}
            </p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Describe Your Post</CardTitle>
          </CardHeader>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="What should this post be about? Include any key details, offers, or calls to action…"
            rows={4}
            className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue focus:ring-1 focus:ring-hub-blue/30 resize-none"
          />
          <div className="mt-3">
            <p className="text-[11px] text-hub-text-muted mb-2">Examples:</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="text-[11px] text-hub-text-secondary bg-hub-input border border-hub-border rounded px-2 py-1 hover:border-hub-blue/40 hover:text-hub-blue transition-colors"
                >
                  {ex.length > 45 ? ex.substring(0, 45) + '…' : ex}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={generating}
          disabled={!prompt.trim()}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generating ? 'Generating…' : 'Generate Caption'}
        </Button>
      </form>

      {/* Result */}
      {result && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Generated Caption</CardTitle>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${result.length > (selectedPlatform?.limit || 500) ? 'text-hub-red' : 'text-hub-text-muted'}`}>
                {result.length} chars
              </span>
              <Button size="sm" variant="ghost" onClick={handleCopy}>
                {copied
                  ? <CheckCircle className="w-3.5 h-3.5 text-hub-green" />
                  : <Copy className="w-3.5 h-3.5" />
                }
                <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
          </CardHeader>

          <div className="bg-hub-input border border-hub-border rounded-lg p-4 text-sm text-hub-text whitespace-pre-wrap leading-relaxed">
            {result}
          </div>

          <div className="flex gap-3 mt-4">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setResult('')}>
              Try Again
            </Button>
            <Button size="sm" className="flex-1" onClick={handleUseInScheduler}>
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Use in Scheduler
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
