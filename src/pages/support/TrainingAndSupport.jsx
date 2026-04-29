import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Spinner from '../../components/ui/Spinner'
import { Plus, Trash2, Edit2, Play, FileText, Mail } from 'lucide-react'

// Sections in sidebar order — always shown even when empty
const FIXED_SECTIONS = [
  'SEO Audit',
  'Citations',
  'Rank Tracker',
  'Review Manager',
  'Lead Generator',
  'Celebrity Content',
  'Content Scheduler',
  'AI Creator',
  'DFY Services',
  'Getting Started',
]

function sectionId(name) {
  return `section-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

export default function TrainingAndSupport() {
  const { isStaff } = useAuth()
  const { toast } = useToast()

  const [videos, setVideos] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  // Which section the add-video form is open for (null = closed)
  const [formSection, setFormSection] = useState(null)
  const [editingVideoId, setEditingVideoId] = useState(null)
  const [videoForm, setVideoForm] = useState({ description: '', youtubeUrl: '' })
  const [savingVideo, setSavingVideo] = useState(false)

  const [showArticleForm, setShowArticleForm] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState(null)
  const [articleForm, setArticleForm] = useState({ title: '', content: '' })
  const [savingArticle, setSavingArticle] = useState(false)

  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', email: '' })
  const [sendingTicket, setSendingTicket] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'trainingVideos'),
      snap => {
        setVideos(
          snap.docs
            .filter(d => d.id !== '_sectionOrder')
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
        )
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'helpArticles'),
      snap => {
        setArticles(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      },
      () => {}
    )
    return unsub
  }, [])

  function getYoutubeId(url) {
    const match = url?.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  function openAddForm(section) {
    setEditingVideoId(null)
    setVideoForm({ description: '', youtubeUrl: '' })
    setFormSection(section)
  }

  function openEditForm(video) {
    setEditingVideoId(video.id)
    setVideoForm({ description: video.description || '', youtubeUrl: video.youtubeUrl || '' })
    setFormSection(video.section)
  }

  function closeForm() {
    setFormSection(null)
    setEditingVideoId(null)
    setVideoForm({ description: '', youtubeUrl: '' })
  }

  async function handleSaveVideo(e) {
    e.preventDefault()
    if (!videoForm.youtubeUrl) {
      toast('YouTube URL is required.', 'error')
      return
    }
    if (!getYoutubeId(videoForm.youtubeUrl)) {
      toast('Invalid YouTube URL.', 'error')
      return
    }

    setSavingVideo(true)
    try {
      if (editingVideoId) {
        await updateDoc(doc(db, 'trainingVideos', editingVideoId), {
          section: formSection,
          ...videoForm,
          updatedAt: serverTimestamp(),
        })
        toast('Video updated!', 'success')
      } else {
        await addDoc(collection(db, 'trainingVideos'), {
          section: formSection,
          ...videoForm,
          createdAt: serverTimestamp(),
        })
        toast('Video added!', 'success')
      }
      closeForm()
    } catch {
      toast('Failed to save video.', 'error')
    } finally {
      setSavingVideo(false)
    }
  }

  async function handleDeleteVideo(id) {
    if (!window.confirm('Delete this video?')) return
    try {
      await deleteDoc(doc(db, 'trainingVideos', id))
      toast('Video deleted.', 'success')
    } catch {
      toast('Failed to delete video.', 'error')
    }
  }

  async function handleSaveArticle(e) {
    e.preventDefault()
    if (!articleForm.title || !articleForm.content) {
      toast('Title and content are required.', 'error')
      return
    }
    setSavingArticle(true)
    try {
      if (editingArticleId) {
        await updateDoc(doc(db, 'helpArticles', editingArticleId), { ...articleForm, updatedAt: serverTimestamp() })
        toast('Article updated!', 'success')
      } else {
        await addDoc(collection(db, 'helpArticles'), { ...articleForm, createdAt: serverTimestamp() })
        toast('Article added!', 'success')
      }
      setArticleForm({ title: '', content: '' })
      setEditingArticleId(null)
      setShowArticleForm(false)
    } catch {
      toast('Failed to save article.', 'error')
    } finally {
      setSavingArticle(false)
    }
  }

  async function handleDeleteArticle(id) {
    if (!window.confirm('Delete this article?')) return
    try {
      await deleteDoc(doc(db, 'helpArticles', id))
      toast('Article deleted.', 'success')
    } catch {
      toast('Failed to delete article.', 'error')
    }
  }

  async function handleSubmitTicket(e) {
    e.preventDefault()
    if (!ticketForm.subject || !ticketForm.message || !ticketForm.email) {
      toast('All fields are required.', 'error')
      return
    }
    setSendingTicket(true)
    try {
      await addDoc(collection(db, 'supportTickets'), { ...ticketForm, status: 'open', createdAt: serverTimestamp() })
      toast("Support ticket submitted! We'll get back to you soon.", 'success')
      setTicketForm({ subject: '', message: '', email: '' })
      setShowTicketForm(false)
    } catch {
      toast('Failed to submit ticket.', 'error')
    } finally {
      setSendingTicket(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <Spinner size="lg" />
      </div>
    )
  }

  const videosBySection = videos.reduce((acc, v) => {
    if (!acc[v.section]) acc[v.section] = []
    acc[v.section].push(v)
    return acc
  }, {})

  // Fixed sections first, then any extras not in the list
  const extraSections = Object.keys(videosBySection).filter(s => !FIXED_SECTIONS.includes(s))
  const allSections = [...FIXED_SECTIONS, ...extraSections]

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-hub-text">Training & Support</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Watch training videos, read help articles, or submit a support ticket.
        </p>
      </div>

      {/* Training Videos */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-hub-blue" />
            <CardTitle>Training Videos</CardTitle>
          </div>
        </CardHeader>

        {/* Jump-to navigation */}
        <div className="px-5 pb-4 border-b border-hub-border">
          <p className="text-sm font-semibold text-hub-text-secondary mb-2 uppercase tracking-wide">Jump to:</p>
          <div className="flex flex-wrap gap-2">
            {allSections.map(s => (
              <a
                key={s}
                href={`#${sectionId(s)}`}
                className="text-sm px-3 py-1.5 rounded-full bg-hub-input border border-hub-border text-hub-text-secondary hover:text-hub-blue hover:border-hub-blue transition-colors font-medium"
              >
                {s}
              </a>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="divide-y divide-hub-border">
          {allSections.map(section => {
            const sectionVideos = videosBySection[section] || []
            const isFormOpen = formSection === section

            return (
              <div key={section} id={sectionId(section)} className="p-5">
                {/* Section header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-hub-text">{section}</h3>
                  {isStaff && !isFormOpen && (
                    <Button size="sm" variant="ghost" onClick={() => openAddForm(section)}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Video
                    </Button>
                  )}
                </div>

                {/* Add/edit form — inline per section */}
                {isStaff && isFormOpen && (
                  <form onSubmit={handleSaveVideo} className="mb-4 p-4 bg-hub-input/40 rounded-lg border border-hub-border space-y-3">
                    <p className="text-xs font-semibold text-hub-text-muted uppercase tracking-wide">
                      {editingVideoId ? 'Edit video' : `Add video to: ${section}`}
                    </p>
                    <Input
                      label="YouTube URL"
                      value={videoForm.youtubeUrl}
                      onChange={e => setVideoForm(p => ({ ...p, youtubeUrl: e.target.value }))}
                      placeholder="https://youtube.com/watch?v=..."
                    />
                    <Textarea
                      label="Description (optional)"
                      value={videoForm.description}
                      onChange={e => setVideoForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description of what this video covers..."
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" loading={savingVideo}>
                        {editingVideoId ? 'Update' : 'Add Video'}
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={closeForm}>Cancel</Button>
                    </div>
                  </form>
                )}

                {/* Videos list */}
                {sectionVideos.length === 0 ? (
                  <div className="py-6 text-center text-hub-text-muted text-sm">
                    No videos yet.{' '}
                    {isStaff && !isFormOpen && (
                      <button onClick={() => openAddForm(section)} className="text-hub-blue hover:underline">
                        Add one
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {sectionVideos.map(video => {
                      const youtubeId = getYoutubeId(video.youtubeUrl)
                      return (
                        <div key={video.id} className="rounded-lg overflow-hidden border border-hub-border bg-hub-input/20 max-w-3xl mx-auto">
                          {youtubeId && (
                            <div className="w-full aspect-video bg-black">
                              <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${youtubeId}`}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          )}
                          {(video.description || isStaff) && (
                            <div className="px-4 py-3 flex items-center justify-between gap-4">
                              {video.description && (
                                <p className="text-sm text-hub-text-secondary">{video.description}</p>
                              )}
                              {isStaff && (
                                <div className="flex gap-1 shrink-0 ml-auto">
                                  <Button size="sm" variant="ghost" onClick={() => openEditForm(video)}>
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => handleDeleteVideo(video.id)}>
                                    <Trash2 className="w-3.5 h-3.5 text-hub-red" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Help Articles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-hub-green" />
              <CardTitle>Help Articles</CardTitle>
            </div>
            {isStaff && (
              <Button size="sm" onClick={() => setShowArticleForm(!showArticleForm)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Article
              </Button>
            )}
          </div>
        </CardHeader>

        {isStaff && showArticleForm && (
          <form onSubmit={handleSaveArticle} className="p-4 bg-hub-input/30 rounded-lg border border-hub-border mb-4 space-y-3">
            <Input
              label="Article Title"
              value={articleForm.title}
              onChange={e => setArticleForm(p => ({ ...p, title: e.target.value }))}
              placeholder="How to use Citations"
            />
            <Textarea
              label="Content"
              value={articleForm.content}
              onChange={e => setArticleForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Write your help article here..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={savingArticle}>
                {editingArticleId ? 'Update Article' : 'Add Article'}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => { setShowArticleForm(false); setEditingArticleId(null); setArticleForm({ title: '', content: '' }) }}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {articles.length === 0 ? (
          <div className="p-8 text-center text-hub-text-muted">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No help articles yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-hub-border">
            {articles.map(article => (
              <div key={article.id} className="p-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-medium text-hub-text">{article.title}</h3>
                  {isStaff && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingArticleId(article.id); setArticleForm({ title: article.title, content: article.content }); setShowArticleForm(true) }}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteArticle(article.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-hub-red" />
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-hub-text-secondary whitespace-pre-wrap">{article.content}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Support Ticket */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-hub-yellow" />
            <CardTitle>Need Help?</CardTitle>
          </div>
          <p className="text-xs text-hub-text-muted mt-1">Submit a support ticket and we'll get back to you soon.</p>
        </CardHeader>

        {!showTicketForm ? (
          <div className="p-4">
            <Button onClick={() => setShowTicketForm(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Submit Support Ticket
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitTicket} className="p-4 space-y-3">
            <Input label="Email" type="email" value={ticketForm.email} onChange={e => setTicketForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
            <Input label="Subject" value={ticketForm.subject} onChange={e => setTicketForm(p => ({ ...p, subject: e.target.value }))} placeholder="Brief description of your issue" />
            <Textarea label="Message" value={ticketForm.message} onChange={e => setTicketForm(p => ({ ...p, message: e.target.value }))} placeholder="Tell us more about your issue..." rows={4} />
            <div className="flex gap-2">
              <Button type="submit" loading={sendingTicket}>Submit Ticket</Button>
              <Button type="button" variant="ghost" onClick={() => { setShowTicketForm(false); setTicketForm({ subject: '', message: '', email: '' }) }}>Cancel</Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
