import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Upload, X, Search } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import Input from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { db, storage } from '../../services/firebase'
import {
  collection, onSnapshot, addDoc, doc, deleteDoc, serverTimestamp,
} from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { useToast } from '../../hooks/useToast'
import { NICHES } from '../../config'

const CATEGORIES = [
  { value: 'funny', label: 'Funny' },
  { value: 'educational', label: 'Educational' },
  { value: 'promotional', label: 'Promotional' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'story', label: 'Story' },
  { value: 'seasonal', label: 'Seasonal' },
]

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export { CATEGORIES }

export default function ContentManager() {
  const { toast } = useToast()
  const fileInputRef = useRef(null)

  const [content, setContent] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [nicheSearch, setNicheSearch] = useState('')

  const [form, setForm] = useState({
    niche: '',
    title: '',
    description: '',
    category: '',
    imageUrl: '',
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
  })

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
      category: '',
      imageUrl: '',
      month: new Date().toLocaleString('default', { month: 'long' }),
      year: new Date().getFullYear(),
    })
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function compressImage(file, maxDimension = 1920, quality = 0.82) {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        let { width, height } = img
        if (width > maxDimension || height > maxDimension) {
          if (width > height) { height = Math.round(height * maxDimension / width); width = maxDimension }
          else { width = Math.round(width * maxDimension / height); height = maxDimension }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => resolve(blob || file), 'image/jpeg', quality)
      }
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
      img.src = url
    })
  }

  async function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast('Please select an image file.', 'error')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast('Image must be under 50MB.', 'error')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    let uploadFile = file
    if (file.size > 500 * 1024) {
      uploadFile = await compressImage(file)
    }

    const ext = uploadFile.type === 'image/jpeg' ? 'jpg' : file.name.split('.').pop()
    const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_').replace(/\.[^.]+$/, '')}.${ext}`
    const storageRef = ref(storage, `content-images/${filename}`)
    const uploadTask = uploadBytesResumable(storageRef, uploadFile)

    uploadTask.on(
      'state_changed',
      snapshot => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        setUploadProgress(pct)
      },
      () => {
        toast('Image upload failed.', 'error')
        setUploading(false)
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        setForm(p => ({ ...p, imageUrl: url }))
        setUploading(false)
        setUploadProgress(100)
      }
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.niche || !form.title || !form.imageUrl) {
      toast('Niche, title, and image are required.', 'error')
      return
    }
    if (uploading) {
      toast('Please wait for the image to finish uploading.', 'error')
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

  const years = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i)

  const contentByNiche = NICHES.reduce((acc, niche) => {
    acc[niche.value] = content.filter(c => c.niche === niche.value)
    return acc
  }, {})

  const visibleNiches = nicheSearch
    ? NICHES.filter(n => n.label.toLowerCase().includes(nicheSearch.toLowerCase()))
    : NICHES

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-hub-text">Celebrity Content Manager</h1>
          <p className="text-hub-text-secondary text-sm mt-1">
            Upload pre-made content templates for each niche. Users see content matching their niche.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-hub-text-muted" />
            <input
              type="text"
              placeholder="Filter niches…"
              value={nicheSearch}
              onChange={e => setNicheSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg bg-hub-input border border-hub-border text-sm text-hub-text placeholder:text-hub-text-muted focus:outline-none focus:border-hub-blue w-44"
            />
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Upload Content
          </Button>
        </div>
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
                options={NICHES}
                placeholder="Select niche"
              />
              <Input
                label="Content Title"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g., 'Spring Maintenance Tips'"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Category"
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                options={CATEGORIES}
                placeholder="Select category (optional)"
              />
              <Select
                label="Month"
                value={form.month}
                onChange={e => setForm(p => ({ ...p, month: e.target.value }))}
                options={MONTHS.map(m => ({ value: m, label: m }))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Year"
                value={form.year}
                onChange={e => setForm(p => ({ ...p, year: parseInt(e.target.value) }))}
                options={years.map(y => ({ value: y, label: String(y) }))}
              />
              <Textarea
                label="Description (optional)"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What should users post with this?"
                rows={2}
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-hub-text-secondary mb-1.5">
                Content Image <span className="text-hub-red">*</span>
              </label>

              {form.imageUrl ? (
                <div className="flex items-start gap-4">
                  <div className="w-32 h-32 rounded-lg overflow-hidden border border-hub-border bg-hub-input flex-shrink-0">
                    <img src={form.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-2 pt-1">
                    <span className="text-sm text-hub-text-secondary">Image uploaded</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setForm(p => ({ ...p, imageUrl: '' }))
                        setUploadProgress(0)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <X className="w-3.5 h-3.5 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    uploading
                      ? 'border-hub-border cursor-not-allowed'
                      : 'border-hub-border hover:border-hub-blue cursor-pointer'
                  }`}
                >
                  {uploading ? (
                    <div className="space-y-2">
                      <Spinner size="sm" className="mx-auto" />
                      <p className="text-sm text-hub-text-secondary">Uploading… {uploadProgress}%</p>
                      <div className="w-full bg-hub-input rounded-full h-1.5 max-w-xs mx-auto">
                        <div
                          className="bg-hub-blue h-1.5 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-hub-text-muted mx-auto" />
                      <p className="text-sm text-hub-text-secondary">
                        Click to upload image <span className="text-hub-text-muted">(JPG, PNG, WebP — max 20MB)</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" loading={saving} disabled={uploading}>Save Content</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); resetForm() }}>Cancel</Button>
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
          {visibleNiches.map(niche => {
            const nicheContent = contentByNiche[niche.value]
            return (
              <Card key={niche.value}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{niche.label}</CardTitle>
                    <Badge variant="info">{nicheContent.length} items</Badge>
                  </div>
                </CardHeader>

                {nicheContent.length === 0 ? (
                  <div className="p-4 text-center text-hub-text-muted text-sm">
                    No content yet.{' '}
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
                              onError={e => { e.target.style.display = 'none' }}
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-medium text-sm text-hub-text mb-1">{item.title}</p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {item.category && (
                              <Badge variant="default" className="text-[10px] capitalize">
                                {item.category}
                              </Badge>
                            )}
                            <span className="text-xs text-hub-text-muted">{item.month} {item.year}</span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-hub-text-muted mb-2 line-clamp-2">{item.description}</p>
                          )}
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
