import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, Clock, ChevronRight, Loader2, TrendingUp, Plus,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { getAuditResults } from '../../services/firestore'
import { cn } from '../../utils/cn'

function gradeColor(grade) {
  if (grade === 'A') return 'text-hub-green'
  if (grade === 'B') return 'text-hub-blue'
  if (grade === 'C') return 'text-hub-yellow'
  if (grade === 'D') return 'text-hub-orange'
  return 'text-hub-red'
}

function gradeBg(grade) {
  if (grade === 'A') return 'bg-hub-green/15 border-hub-green/30'
  if (grade === 'B') return 'bg-hub-blue/15 border-hub-blue/30'
  if (grade === 'C') return 'bg-hub-yellow/15 border-hub-yellow/30'
  if (grade === 'D') return 'bg-hub-orange/15 border-hub-orange/30'
  return 'bg-hub-red/15 border-hub-red/30'
}

function formatDate(ts) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AuditHome() {
  const { userProfile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [audits, setAudits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for auth to finish initializing
    if (authLoading) return

    // Auth is settled — if no profile doc exists yet, nothing to load
    if (!userProfile?.id) {
      setLoading(false)
      return
    }

    getAuditResults(userProfile.id)
      .then(results => setAudits(results))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userProfile?.id, authLoading])

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-hub-blue/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-hub-blue" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-hub-text">SEO Reports</h1>
            <p className="text-hub-text-secondary text-sm mt-0.5">
              Your full audit reports — page speed, GMB, citations and more.
            </p>
          </div>
        </div>
        <Link to="/audit/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            Run New Audit
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </div>
      ) : audits.length === 0 ? (
        <Card className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-hub-input flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-7 h-7 text-hub-text-muted opacity-50" />
          </div>
          <p className="text-hub-text font-semibold mb-2">No reports yet</p>
          <p className="text-hub-text-secondary text-sm max-w-xs mx-auto leading-relaxed mb-5">
            Run a free SEO audit to see your page speed, Google Business Profile
            status, and citation health.
          </p>
          <Link to="/audit/new">
            <Button>
              <Plus className="w-4 h-4" />
              Run Your First Audit
            </Button>
          </Link>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-hub-text">
              {audits.length} {audits.length === 1 ? 'Report' : 'Reports'}
            </h2>
          </div>
          <Card padding={false}>
            <ul className="divide-y divide-hub-border">
              {audits.map(audit => (
                <li key={audit.id}>
                  <button
                    onClick={() => navigate('/audit/results', { state: { result: audit } })}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-hub-input/40 transition-colors text-left group"
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold flex-shrink-0 border',
                      gradeBg(audit.overallGrade),
                      gradeColor(audit.overallGrade)
                    )}>
                      <span className="text-lg leading-none">{audit.overallGrade || '?'}</span>
                      <span className="text-[10px] font-normal mt-0.5 opacity-70">{audit.overallScore}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-hub-text truncate">
                        {audit.businessName}
                      </p>
                      <p className="text-xs text-hub-text-muted truncate mt-0.5">{audit.url}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {['performance', 'seo', 'gmb', 'citations'].map(key => {
                          const s = audit.scores?.[key]
                          if (!s || s.score === null) return null
                          return (
                            <span key={key} className="text-[10px] text-hub-text-muted">
                              {key.charAt(0).toUpperCase() + key.slice(1)}{' '}
                              <span className={cn('font-semibold', gradeColor(s.grade))}>
                                {s.grade}
                              </span>
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-hub-text-muted flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {formatDate(audit.createdAt)}
                      </p>
                      <ChevronRight className="w-4 h-4 text-hub-text-muted mt-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  )
}
