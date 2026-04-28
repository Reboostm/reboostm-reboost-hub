import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute() {
  const { user, userProfile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-hub-bg flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Force profile completion on first login
  const isOnSettings = location.pathname === '/settings'
  const hasCompleteProfile = userProfile?.niche && userProfile?.businessName && userProfile?.phone && userProfile?.address

  if (!hasCompleteProfile && !isOnSettings && !location.pathname.startsWith('/admin') && !location.pathname.startsWith('/setup')) {
    return <Navigate to="/settings" replace />
  }

  return <Outlet />
}
