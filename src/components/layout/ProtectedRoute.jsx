import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../ui/Spinner'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-hub-bg flex items-center justify-center">
        <Spinner size="xl" />
      </div>
    )
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />
}
