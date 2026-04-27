import { useEffect, useState } from 'react'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Badge from '../../components/ui/Badge'
import { Shield } from 'lucide-react'
import { getAllUsers } from '../../services/firestore'
import { getInitials, formatDate } from '../../utils/helpers'

const ROLE_VARIANTS = { admin: 'error', staff: 'warning', client: 'info' }

export default function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllUsers().then(setUsers).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-hub-text">All Users</h1>
        <span className="text-sm text-hub-text-muted">{users.length} total</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : users.length === 0 ? (
        <EmptyState icon={Shield} title="No users yet" />
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-hub-border">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="w-8 h-8 rounded-full bg-hub-blue/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-hub-blue">{getInitials(u.displayName)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-hub-text truncate">{u.displayName || '—'}</p>
                  <p className="text-xs text-hub-text-muted truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-hub-text-muted">{formatDate(u.createdAt)}</span>
                  <Badge variant={ROLE_VARIANTS[u.role] || 'gray'} className="capitalize">{u.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
