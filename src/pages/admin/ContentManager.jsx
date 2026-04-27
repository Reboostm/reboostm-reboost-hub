import { useState, useEffect } from 'react'
import { Image, Plus, Trash2, Loader2, ExternalLink, Upload } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { db } from '../../services/firebase'
import {
  collection, query, orderBy, getDocs, addDoc,
  serverTimestamp, doc, deleteDoc,
} from 'firebase/firestore'
import { useToast } from '../../hooks/useToast'
import { formatDate } from '../../utils/helpers'

const NICHES = [
  'General', 'Plumbing', 'HVAC', 'Electrical', 'Roofing', 'Landscaping',
  'Painting', 'Pest Control', 'Cleaning', 'Auto Repair', 'Dentist',
  'Chiropractor', 'Real Estate', 'Restaurant', 'Fitness', 'Other',
]

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function UploadForm({ onSaved }) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', niche: 'General', month: '', year: new Date().getFullYear().toString(),
    contentUrl: '', previewUrl: '', description: '',
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    if (!form.title || !form.contentUrl) {
      toast('Title and content URL are required.', 'warning')
      return
    }
    setSaving(true)
    try {
      await addDoc(collection(db, 'contentLibrary'), {
        ...form,
        year: parseInt(form.year, 10),
        createdAt: serverTimestamp(),
      })
      toast('Content uploaded!', 'success')
      setForm({ title: '', niche: 'General', month: '', year: new Date().getFullYear().toString(), contentUrl: '', previewUrl: '', description: '' })
      onSaved()
    } catch {
      toast('Failed to save content.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <h3 className="text-sm font-semibold text-hub-text mb-4">Upload Content</h3>
      <div className="space-y-3">
        <input placeholder="Title *" value={form.title} onChange={e => set('title', e.target.value)}
          className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue" />

        <div className="grid grid-cols-3 gap-3">
          <select value={form.niche} onChange={e => set('niche', e.target.value)}
            className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue">
            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select value={form.month} onChange={e => set('month', e.target.value)}
            className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text focus:outline-none focus:border-hub-blue">
            <option value="">— Month —</option>
            {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input placeholder="Year" value={form.year} onChange={e => set('year', e.target.value)}
            className="bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue" />
        </div>

        <input placeholder="Content URL (Drive, Dropbox, etc.) *" value={form.contentUrl} onChange={e => set('contentUrl', e.target.value)}
          className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue" />
        <input placeholder="Preview image URL (optional)" value={form.previewUrl} onChange={e => set('previewUrl', e.target.value)}
          className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue" />
        <textarea placeholder="Description (optional)" value={form.description} onChange={e => set('description', e.target.value)}
          rows={2}
          className="w-full bg-hub-input border border-hub-border rounded-lg px-3 py-2.5 text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue resize-none" />
      </div>
      <div className="mt-4">
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload
        </Button>
      </div>
    </Card>
  )
}

export default function ContentManager() {
  const { toast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    getDocs(query(collection(db, 'contentLibrary'), orderBy('createdAt', 'desc')))
      .then(snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this content item?')) return
    setDeleting(id)
    try {
      await deleteDoc(doc(db, 'contentLibrary', id))
      setItems(prev => prev.filter(i => i.id !== id))
      toast('Deleted.', 'success')
    } catch {
      toast('Failed to delete.', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-hub-text">Content Manager</h1>
        <p className="text-hub-text-secondary text-sm mt-0.5">
          Upload Celebrity Calendar content. It appears in clients' Content Library based on their niche.
        </p>
      </div>

      <UploadForm onSaved={load} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </div>
      ) : items.length === 0 ? (
        <Card className="text-center py-10">
          <Image className="w-8 h-8 text-hub-text-muted mx-auto mb-3 opacity-40" />
          <p className="text-hub-text-muted text-sm">No content uploaded yet.</p>
        </Card>
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-hub-border">
            {items.map(item => (
              <div key={item.id} className="flex items-center gap-4 px-5 py-3.5">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-hub-input" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-hub-input flex items-center justify-center flex-shrink-0">
                    <Image className="w-4 h-4 text-hub-text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-hub-text truncate">{item.title}</p>
                  <p className="text-xs text-hub-text-muted">
                    {item.niche} · {[item.month, item.year].filter(Boolean).join(' ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-hub-text-muted hidden md:block">{formatDate(item.createdAt)}</span>
                  {item.contentUrl && (
                    <a href={item.contentUrl} target="_blank" rel="noopener noreferrer"
                      className="text-hub-text-muted hover:text-hub-blue transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="text-hub-text-muted hover:text-hub-red transition-colors disabled:opacity-40"
                  >
                    {deleting === item.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
