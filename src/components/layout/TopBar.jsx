import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { getInitials } from '../../utils/helpers'
import { HUB_NAME } from '../../config'

const PAGE_TITLES = {
  '/audit': 'SEO Audit',
  '/audit/results': 'Audit Results',
  '/citations': 'Citations',
  '/citations/directories': 'My Directories',
  '/citations/jobs': 'Jobs & Progress',
  '/citations/analytics': 'Citations Analytics',
  '/leads': 'Lead Generator',
  '/leads/my-leads': 'My Lead Lists',
  '/leads/outreach': 'Outreach Templates',
  '/scheduler': 'Content Scheduler',
  '/scheduler/new': 'Schedule a Post',
  '/scheduler/accounts': 'Connected Accounts',
  '/creator': 'AI Content Creator',
  '/creator/image': 'Generate Image',
  '/calendar': 'Celebrity Content',
  '/reviews': 'Review Manager',
  '/reviews/requests': 'Review Requests',
  '/rank-tracker': 'Rank Tracker',
  '/rank-tracker/report': 'Rankings Report',
  '/agency': 'Territory Checker',
  '/agency/services': 'Agency Services',
  '/settings': 'Profile Settings',
  '/settings/billing': 'Billing',
  '/settings/integrations': 'Integrations',
  '/admin': 'Admin Dashboard',
  '/admin/clients': 'Clients',
  '/admin/users': 'Users',
  '/admin/content': 'Content Manager',
  '/admin/territories': 'Territories',
  '/admin/packages': 'Packages',
}

export default function TopBar() {
  const { userProfile, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const title = PAGE_TITLES[location.pathname] || HUB_NAME
  const initials = getInitials(userProfile?.displayName)
  const name = userProfile?.displayName || userProfile?.email || 'User'

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <header className="h-14 border-b border-hub-border bg-hub-bg/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
      <h1 className="text-sm font-semibold text-hub-text">{title}</h1>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-hub-card transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-hub-blue/20 border border-hub-blue/40 flex items-center justify-center">
            <span className="text-xs font-semibold text-hub-blue">{initials}</span>
          </div>
          <span className="text-sm text-hub-text-secondary hidden sm:block max-w-[140px] truncate">{name}</span>
          <ChevronDown className="w-3.5 h-3.5 text-hub-text-muted" />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 bg-hub-card border border-hub-border rounded-xl shadow-2xl py-1 z-50">
            <div className="px-3 py-2 border-b border-hub-border mb-1">
              <p className="text-xs font-medium text-hub-text truncate">{name}</p>
              <p className="text-xs text-hub-text-muted truncate">{userProfile?.email}</p>
            </div>
            <DropItem icon={User} label="Profile" onClick={() => { navigate('/settings'); setOpen(false) }} />
            <DropItem icon={Settings} label="Billing" onClick={() => { navigate('/settings/billing'); setOpen(false) }} />
            <div className="border-t border-hub-border mt-1 pt-1">
              <DropItem icon={LogOut} label="Sign Out" onClick={handleLogout} danger />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function DropItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-hub-input ${
        danger ? 'text-hub-red' : 'text-hub-text-secondary hover:text-hub-text'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}
