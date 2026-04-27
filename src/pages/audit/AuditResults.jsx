import { Search } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import { useNavigate } from 'react-router-dom'

export default function AuditResults() {
  const navigate = useNavigate()

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-hub-text mb-6">Audit Results</h1>
      <EmptyState
        icon={Search}
        title="No audit results yet"
        description="Run an audit from the SEO Audit page to see your local SEO score."
        action={<Button onClick={() => navigate('/audit')}>Run an Audit</Button>}
      />
    </div>
  )
}
