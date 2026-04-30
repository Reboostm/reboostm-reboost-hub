import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Search, BookOpen, UserPlus, Clock,
  Activity, Loader2, ChevronRight,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import { db } from '../../services/firebase'
import {
  collection, query, orderBy, limit, getDocs,
  where, getCountFromServer,
} from 'firebase/firestore'
import { formatDate } from '../../utils/helpers'

function StatCard({ icon: Icon, label, value, color = 'text-hub-blue', to }) {
  const inner = (
    <Card className="flex items-center gap-4 hover:border-hub-blue/30 transition-colors">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-hub-input">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-hub-text-muted mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-hub-text leading-none">{value}</p>
      </div>
    </Card>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

function roleDot(role) {
  if (role === 'admin') return 'bg-hub-orange'
  if (role === 'staff') return 'bg-hub-blue'
  return 'bg-hub-green'
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: '—', audits: '—', jobs: '—', signups: '—' })
  const [recentUsers, setRecentUsers] = useState([])
  const [recentAudits, setRecentAudits] = useState([])
  const [loading, setLoading] = useState(true)
  const [signupTimeframe, setSignupTimeframe] = useState('7d')

  useEffect(() => {
    async function load() {
      try {
        const timeframes = {
          '7d':  7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
          '90d': 90 * 24 * 60 * 60 * 1000,
          'all': Infinity,
        }
        const signupWindow = timeframes[signupTimeframe]
        const signupDate = new Date(Date.now() - signupWindow)
        const [
          usersCount, auditsCount, jobsCount, signupsCount,
          recentUsersSnap, recentAuditsSnap,
        ] = await Promise.all([
          getCountFromServer(collection(db, 'users')),
          getCountFromServer(collection(db, 'auditResults')),
          getCountFromServer(query(
            collection(db, 'citations'),
            where('status', 'in', ['queued', 'running'])
          )),
          getCountFromServer(query(
            collection(db, 'users'),
            where('createdAt', '>', signupDate)
          )),
          getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(6))),
          getDocs(query(collection(db, 'auditResults'), orderBy('createdAt', 'desc'), limit(5))),
        ])
        setStats({
          users:   usersCount.data().count,
          audits:  auditsCount.data().count,
          jobs:    jobsCount.data().count,
          signups: signupsCount.data().count,
        })
        setRecentUsers(recentUsersSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setRecentAudits(recentAuditsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch {
        // graceful — indexes may not be ready on first deploy
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [signupTimeframe])

  return (
    <div className="p-6 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-hub-text">Admin Dashboard</h1>
        <p className="text-hub-text-secondary text-sm mt-0.5">Platform overview</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-hub-text-muted" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
              <StatCard icon={Users}    label="Total Users"    value={stats.users}   color="text-hub-blue"   to="/admin/users" />
              <StatCard icon={Search}   label="Audits Run"     value={stats.audits}  color="text-hub-green"  />
              <StatCard icon={BookOpen} label="Active Jobs"    value={stats.jobs}    color="text-hub-yellow" />
              <StatCard icon={UserPlus} label="Signups"        value={stats.signups} color="text-hub-purple" />
            </div>
            <div className="ml-4">
              <select
                value={signupTimeframe}
                onChange={e => setSignupTimeframe(e.target.value)}
                className="px-3 py-2 rounded-lg bg-hub-input border border-hub-border text-sm text-hub-text focus:outline-none focus:border-hub-blue"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-hub-text-secondary" />
                  <h2 className="text-sm font-semibold text-hub-text">Recent Signups</h2>
                </div>
                <Link to="/admin/users" className="text-xs text-hub-blue hover:underline flex items-center gap-0.5">
                  All <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              {recentUsers.length === 0 ? (
                <p className="text-hub-text-muted text-xs">No users yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentUsers.map(u => (
                    <li key={u.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-hub-blue/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-hub-blue">
                          {((u.displayName || u.email || '?')[0]).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-hub-text truncate">
                          {u.displayName || u.email || u.id}
                        </p>
                        <p className="text-[10px] text-hub-text-muted flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${roleDot(u.role)}`} />
                          {u.role || 'client'}
                        </p>
                      </div>
                      <p className="text-[10px] text-hub-text-muted flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDate(u.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-hub-text-secondary" />
                <h2 className="text-sm font-semibold text-hub-text">Recent Audits</h2>
              </div>
              {recentAudits.length === 0 ? (
                <p className="text-hub-text-muted text-xs">No audits yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentAudits.map(a => (
                    <li key={a.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                        a.overallGrade === 'A' ? 'bg-hub-green/15 text-hub-green' :
                        a.overallGrade === 'B' ? 'bg-hub-blue/15 text-hub-blue' :
                        a.overallGrade === 'C' ? 'bg-hub-yellow/15 text-hub-yellow' :
                        'bg-hub-red/15 text-hub-red'
                      }`}>
                        {a.overallGrade || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-hub-text truncate">{a.businessName}</p>
                        <p className="text-[10px] text-hub-text-muted truncate">{a.url}</p>
                      </div>
                      <p className="text-[10px] text-hub-text-muted flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDate(a.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
