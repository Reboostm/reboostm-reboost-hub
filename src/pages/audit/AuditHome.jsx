import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import EmptyState from '../../components/ui/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

export default function AuditHome() {
  const { userProfile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    url: userProfile?.website || '',
    businessName: userProfile?.businessName || '',
    city: userProfile?.city || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.url || !form.businessName || !form.city) {
      toast('Please fill in all fields.', 'warning')
      return
    }
    setLoading(true)
    try {
      // TODO: call runSeoAudit cloud function
      toast('Audit started! Results will appear shortly.', 'info')
      navigate('/audit/results')
    } catch {
      toast('Audit failed. Please try again.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-hub-text">SEO Audit</h1>
        <p className="text-hub-text-secondary mt-1 text-sm">
          Get a free analysis of your local SEO health — rankings, citations, GMB status, and page speed.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Website URL"
            type="url"
            placeholder="https://yoursite.com"
            value={form.url}
            onChange={e => setForm(p => ({ ...p, url: e.target.value }))}
          />
          <Input
            label="Business name"
            placeholder="Smith Plumbing LLC"
            value={form.businessName}
            onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))}
          />
          <Input
            label="City"
            placeholder="Salt Lake City, UT"
            value={form.city}
            onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
          />
          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Run Free Audit <ArrowRight className="w-4 h-4" />
          </Button>
        </form>
      </Card>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-hub-text mb-4">Previous Audits</h2>
        <EmptyState
          icon={Search}
          title="No audits yet"
          description="Run your first audit above — results are saved here for reference."
        />
      </div>
    </div>
  )
}
