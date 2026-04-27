import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AdminRoute() {
  const { isStaff, loading } = useAuth()

  if (loading) return null

  return isStaff ? <Outlet /> : <Navigate to="/audit" replace />
}
