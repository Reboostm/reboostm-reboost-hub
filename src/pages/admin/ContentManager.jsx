import { useState, useEffect } from 'react'
import { Image as ImageIcon, Plus, Trash2, Loader2, Upload } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { db } from '../../services/firebase'
import {
  collection, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { useToast } from '../../hooks/useToast'
import { NICHES } from '../../config'

export default function ContentManager() {
  const { toast } = useToast()
  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    niche: '',
    title: '',
    description: '',
    imageUrl: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
  })

  // Load content
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'content'), snap => {
      setContent(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      )
      setLoading(false)
    })
    return unsub
  }, [])

  function resetForm() {
    setForm({
      niche: '',
      title: '',
      description: '',
      imageUrl: '',
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.niche || !form.title || !form.imageUrl) {
      toast('Niche, title, and image URL are required.', 'error')
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, 'content'), {
        ...form,
        createdAt: serverTimestamp(),
      })
      toast('Content uploaded!', 'success')
      resetForm()
      setShowForm(false)
    } catch (err) {
      toast('Failed to upload content.', 'error')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function deleteContent(id) {
    if (!window.confirm('Delete this content?')) return
    try {
      await deleteDoc(doc(db, 'content', id))
      toast('Content deleted.', 'success')
    } catch {
      toast('Failed to delete content.', 'error')
    }
  }

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i)

  // Group by niche
  const contentByNiche = NICHES.reduce((acc, niche) => {
    acc[niche] = content.filter(c => c.niche === niche)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Celebrity Content Manager</h1>
          <p className="text-hub-text-secondary text-sm mt-1">
            Upload pre-made content templates for each niche. Users will see content matching their selected niche.
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Upload Content
        </Button>
      </div>

      {/* Upload form */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Upload Celebrity Content</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Niche"
                value={form.niche}
                onChange={e => setForm(p => ({ ...p, niche: e.target.value }))}
                options={NICHES.map(n => ({ value: n, label: n }))}
                placeholder="Select niche"
              />
              <Input
                label="Content Title"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g., 'Spring Maintenance Tips'"
              />
            </div>

            <Textarea
              label="Description (optional)"
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="What should users post with this?"
              rows={2}
            />

            <Input
              label="Image URL"
              value={form.imageUrl}
              onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
              placeholder="https://..."
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Month"
                value={form.month}
                onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                options={months.map(m => ({ value: m, label: m }))}
              />
              <Select
                label="Year"
                value={form.year}
                onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))}
                options={years.map(y => ({ value: y, label: String(y) }))}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={saving}>Save Content</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {/* Content by niche */}
      {loading ? (
        <div className="flex items-center gap-3 py-8">
          <Spinner size="sm" />
          <span className="text-sm text-hub-text-secondary">Loading content…</span>
        </div>
      ) : (
        <div className="space-y-6">
          {NICHES.map(niche => {
            const nicheContent = contentByNiche[niche]
            return (
              <Card key={niche}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{niche}</CardTitle>
                    <Badge variant="info">{nicheContent.length} items</Badge>
                  </div>
                </CardHeader>

                {nicheContent.length === 0 ? (
                  <div className="p-4 text-center text-hub-text-muted text-sm">
                    No content yet. {' '}
                    <button onClick={() => setShowForm(true)} className="text-hub-blue hover:underline">
                      Upload some
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {nicheContent.map(item => (
                      <div key={item.id} className="border border-hub-border rounded-lg overflow-hidden bg-hub-input/30">
                        {item.imageUrl && (
                          <div className="w-full h-40 bg-hub-input flex items-center justify-center overflow-hidden">
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={e => {
                                e.target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-medium text-sm text-hub-text mb-1">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-hub-text-muted mb-2 line-clamp-2">{item.description}</p>
                          )}
                          <p className="text-xs text-hub-text-muted mb-3">
                            {item.month} {item.year}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteContent(item.id)}
                            className="w-full text-hub-red"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
