import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBilling } from '../../hooks/useBilling'
import ToolGate from '../../components/ui/ToolGate'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import { useToast } from '../../hooks/useToast'
import { generateAIImage } from '../../services/functions'
import { Image, Sparkles, Download, Calendar, AlertCircle } from 'lucide-react'

const STYLES = [
  { value: 'photorealistic', label: 'Photorealistic' },
  { value: 'illustration',   label: 'Digital Illustration' },
  { value: 'cartoon',        label: 'Cartoon / Friendly' },
  { value: 'minimalist',     label: 'Minimalist' },
]

const SIZES = [
  { value: 'square',    label: 'Square  (1:1) — Instagram, Facebook' },
  { value: 'landscape', label: 'Landscape (16:9) — Facebook, LinkedIn' },
  { value: 'portrait',  label: 'Portrait (9:16) — Instagram Stories' },
]

const EXAMPLES = [
  'A friendly plumber fixing pipes in a bright modern kitchen',
  'A professional dentist office waiting room, clean and welcoming',
  'HVAC technician servicing an AC unit on a sunny day',
  'A roofing crew working on a new home, clear blue sky',
  'A before-and-after lawn transformation for a landscaping company',
]

export default function GenerateImage() {
  const { hasAICreator } = useBilling()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [prompt, setPrompt]       = useState('')
  const [style, setStyle]         = useState('photorealistic')
  const [size, setSize]           = useState('square')
  const [imageUrl, setImageUrl]   = useState('')
  const [generating, setGenerating] = useState(false)

  async function handleGenerate(e) {
    e.preventDefault()
    if (!prompt.trim()) { toast('Enter an image description first.', 'error'); return }
    setGenerating(true)
    setImageUrl('')
    try {
      const { imageUrl: url } = await generateAIImage({
        prompt: prompt.trim(),
        style,
        size,
      })
      setImageUrl(url)
    } catch (err) {
      toast(err.message || 'Generation failed. Check OPENAI_API_KEY env var.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = 'generated-image.png'
    a.target = '_blank'
    a.click()
  }

  function handleUseInScheduler() {
    navigate('/scheduler/new', { state: { imageUrl } })
  }

  if (!hasAICreator) return <ToolGate tool="creator" />

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">Generate Image</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Describe a scene — AI creates a unique, business-ready image.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>Image Settings</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Style"
              value={style}
              onChange={e => setStyle(e.target.value)}
              options={STYLES}
            />
            <Select
              label="Size"
              value={size}
              onChange={e => setSize(e.target.value)}
              options={SIZES}
            />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Image Description</CardTitle>
          </CardHeader>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe what you want to see in the image. Be specific about setting, mood, and subject…"
            rows={3}
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

        <div className="p-3 bg-hub-yellow/10 border border-hub-yellow/20 rounded-lg flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-hub-yellow mt-0.5 shrink-0" />
          <p className="text-xs text-hub-text-secondary leading-relaxed">
            Generated images are hosted temporarily by OpenAI (~60 min). Download immediately
            or the link will expire. Requires <code className="bg-hub-card px-1 rounded text-hub-blue">OPENAI_API_KEY</code> env var.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={generating}
          disabled={!prompt.trim()}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generating ? 'Generating image… (up to 30s)' : 'Generate Image'}
        </Button>
      </form>

      {/* Result */}
      {imageUrl && (
        <Card className="mt-5">
          <CardHeader>
            <CardTitle>Generated Image</CardTitle>
          </CardHeader>

          <div className="rounded-xl overflow-hidden border border-hub-border bg-hub-input mb-4">
            <img
              src={imageUrl}
              alt="AI generated"
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" size="sm" className="flex-1" onClick={() => setImageUrl('')}>
              Try Again
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5 mr-1.5" /> Download
            </Button>
            <Button size="sm" className="flex-1" onClick={handleUseInScheduler}>
              <Calendar className="w-3.5 h-3.5 mr-1.5" /> Use in Scheduler
            </Button>
          </div>
        </Card>
      )}

      {!imageUrl && !generating && (
        <div className="mt-8 flex flex-col items-center gap-3 opacity-40">
          <Image className="w-12 h-12 text-hub-text-muted" />
          <p className="text-sm text-hub-text-muted">Generated image will appear here</p>
        </div>
      )}
    </div>
  )
}
