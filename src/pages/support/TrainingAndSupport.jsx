import { useState, useEffect } from 'react'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../services/firebase'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import Card, { CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Badge from '../../components/ui/Badge'
import Spinner from '../../components/ui/Spinner'
import { Plus, Trash2, Edit2, Save, X, Play, FileText, Mail } from 'lucide-react'

export default function TrainingAndSupport() {
  const { isStaff } = useAuth()
  const { toast } = useToast()

  const [videos, setVideos] = useState([])
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  const [showVideoForm, setShowVideoForm] = useState(false)
  const [editingVideoId, setEditingVideoId] = useState(null)
  const [videoForm, setVideoForm] = useState({ section: '', description: '', youtubeUrl: '' })
  const [savingVideo, setSavingVideo] = useState(false)

  const [showArticleForm, setShowArticleForm] = useState(false)
  const [editingArticleId, setEditingArticleId] = useState(null)
  const [articleForm, setArticleForm] = useState({ title: '', content: '' })
  const [savingArticle, setSavingArticle] = useState(false)

  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ subject: '', message: '', email: '' })
  const [sendingTicket, setSendingTicket] = useState(false)

  // Load videos
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'trainingVideos'),
      snap => {
        setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [])

  // Load articles
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

  // Extract YouTube video ID from URL
  function getYoutubeId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  async function handleSaveVideo(e) {
    e.preventDefault()
    if (!videoForm.section || !videoForm.youtubeUrl) {
      toast('Section name and YouTube URL are required.', 'error')
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
          ...videoForm,
          updatedAt: serverTimestamp(),
        })
        toast('Video updated!', 'success')
      } else {
        await addDoc(collection(db, 'trainingVideos'), {
          ...videoForm,
          createdAt: serverTimestamp(),
        })
        toast('Video added!', 'success')
      }
      setVideoForm({ section: '', description: '', youtubeUrl: '' })
      setEditingVideoId(null)
      setShowVideoForm(false)
    } catch (err) {
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
        await updateDoc(doc(db, 'helpArticles', editingArticleId), {
          ...articleForm,
          updatedAt: serverTimestamp(),
        })
        toast('Article updated!', 'success')
      } else {
        await addDoc(collection(db, 'helpArticles'), {
          ...articleForm,
          createdAt: serverTimestamp(),
        })
        toast('Article added!', 'success')
      }
      setArticleForm({ title: '', content: '' })
      setEditingArticleId(null)
      setShowArticleForm(false)
    } catch (err) {
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
      await addDoc(collection(db, 'supportTickets'), {
        ...ticketForm,
        status: 'open',
        createdAt: serverTimestamp(),
      })
      toast('Support ticket submitted! We\'ll get back to you soon.', 'success')
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

  // Group videos by section
  const videosBySection = videos.reduce((acc, video) => {
    if (!acc[video.section]) acc[video.section] = []
    acc[video.section].push(video)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-hub-text">Training & Support</h1>
        <p className="text-hub-text-secondary text-sm mt-1">
          Learn how to use ReBoost Hub. Watch training videos, read help articles, or submit a support ticket.
        </p>
      </div>

      {/* Videos Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="w-5 h-5 text-hub-blue" />
              <CardTitle>Training Videos</CardTitle>
            </div>
            {isStaff && (
              <Button size="sm" onClick={() => setShowVideoForm(!showVideoForm)}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Video
              </Button>
            )}
          </div>
        </CardHeader>

        {isStaff && showVideoForm && (
          <form onSubmit={handleSaveVideo} className="p-4 bg-hub-input/30 rounded-lg border border-hub-border mb-4 space-y-3">
            <Input
              label="Section Name (e.g., Citations, Content Calendar)"
              value={videoForm.section}
              onChange={e => setVideoForm(p => ({ ...p, section: e.target.value }))}
              placeholder="Citations"
            />
            <Textarea
              label="Description"
              value={videoForm.description}
              onChange={e => setVideoForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description of what this video covers..."
              rows={2}
            />
            <Input
              label="YouTube URL"
              value={videoForm.youtubeUrl}
              onChange={e => setVideoForm(p => ({ ...p, youtubeUrl: e.target.value }))}
              placeholder="https://youtube.com/watch?v=..."
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" loading={savingVideo}>
                {editingVideoId ? 'Update Video' : 'Add Video'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowVideoForm(false)
                  setEditingVideoId(null)
                  setVideoForm({ section: '', description: '', youtubeUrl: '' })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}

        {Object.keys(videosBySection).length === 0 ? (
          <div className="p-8 text-center text-hub-text-muted">
            <Play className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>No training videos yet.</p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {Object.entries(videosBySection).map(([section, sectionVideos]) => (
              <div key={section}>
                <h3 className="text-sm font-semibold text-hub-text mb-2">{section}</h3>
                <div className="space-y-2">
                  {sectionVideos.map(video => {
                    const youtubeId = getYoutubeId(video.youtubeUrl)
                    return (
                      <div key={video.id} className="border border-hub-border rounded-lg overflow-hidden bg-hub-input/30">
                        {youtubeId && (
                          <div className="w-full h-40 bg-black flex items-center justify-center">
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
                        <div className="p-3">
                          {video.description && (
                            <p className="text-xs text-hub-text-muted mb-2">{video.description}</p>
                          )}
                          {isStaff && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingVideoId(video.id)
                                  setVideoForm({ section: video.section, description: video.description, youtubeUrl: video.youtubeUrl })
                                  setShowVideoForm(true)
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteVideo(video.id)}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-hub-red" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Help Articles Section */}
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
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowArticleForm(false)
                  setEditingArticleId(null)
                  setArticleForm({ title: '', content: '' })
                }}
              >
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingArticleId(article.id)
                          setArticleForm({ title: article.title, content: article.content })
                          setShowArticleForm(true)
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteArticle(article.id)}
                      >
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

      {/* Support Ticket Section */}
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
            <Input
              label="Email"
              type="email"
              value={ticketForm.email}
              onChange={e => setTicketForm(p => ({ ...p, email: e.target.value }))}
              placeholder="your@email.com"
            />
            <Input
              label="Subject"
              value={ticketForm.subject}
              onChange={e => setTicketForm(p => ({ ...p, subject: e.target.value }))}
              placeholder="Brief description of your issue"
            />
            <Textarea
              label="Message"
              value={ticketForm.message}
              onChange={e => setTicketForm(p => ({ ...p, message: e.target.value }))}
              placeholder="Tell us more about your issue..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button type="submit" loading={sendingTicket}>Submit Ticket</Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowTicketForm(false)
                  setTicketForm({ subject: '', message: '', email: '' })
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
