import { Outlet } from 'react-router-dom'
import Button from '../ui/Button'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import { useAuth } from '../../hooks/useAuth'

export default function HubLayout() {
  const { isViewingAs, effectiveProfile, setImpersonatedUserId } = useAuth()

  return (
    <div className="flex h-screen bg-hub-bg overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {isViewingAs && (
          <div className="bg-hub-yellow/20 border-b border-hub-yellow px-6 py-3 flex items-center justify-between shrink-0">
            <span className="text-sm font-medium text-hub-text">
              👁️ Viewing as: <strong>{effectiveProfile?.displayName}</strong> ({effectiveProfile?.email})
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setImpersonatedUserId(null)}
            >
              Exit View As
            </Button>
          </div>
        )}
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
