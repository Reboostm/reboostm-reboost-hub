import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Search, BookOpen, Users, Calendar, Sparkles, Image,
  Star, TrendingUp, Building2, ChevronDown, Lock,
  LayoutDashboard, Zap,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useBilling } from '../../hooks/useBilling'
import Badge from '../ui/Badge'
import { HUB_NAME } from '../../config'

const SECTIONS = [
  {
    key: 'audit',
    label: 'SEO Audit',
    icon: Search,
    badge: { text: 'FREE', variant: 'free' },
    isLocked: () => false,
    items: [
      { label: 'My Audit Results', path: '/audit' },
      { label: 'Run New Audit', path: '/audit/results' },
    ],
  },
  {
    key: 'citations',
    label: 'Citations',
    icon: BookOpen,
    badge: { text: 'PAID', variant: 'paid' },
    isLocked: (b) => !b.hasCitations,
    items: [
      { label: 'Overview', path: '/citations' },
      { label: 'My Directories', path: '/citations/directories' },
      { label: 'Jobs & Progress', path: '/citations/jobs' },
      { label: 'Analytics', path: '/citations/analytics' },
    ],
  },
  {
    key: 'leads',
    label: 'Lead Generator',
    icon: Users,
    badge: { text: 'PAID', variant: 'paid' },
    isLocked: (b) => !b.hasLeadCredits,
    items: [
      { label: 'Find New Leads', path: '/leads' },
      { label: 'My Lead Lists', path: '/leads/my-leads' },
      { label: 'Outreach Templates', path: '/leads/outreach' },
    ],
  },
  {
    key: 'scheduler',
    label: 'Content Scheduler',
    icon: Calendar,
    badge: { text: 'monthly', variant: 'info' },
    isLocked: (b) => !b.hasScheduler,
    items: [
      { label: 'Calendar', path: '/scheduler' },
      { label: 'Schedule a Post', path: '/scheduler/new' },
      { label: 'Connected Accounts', path: '/scheduler/accounts' },
    ],
  },
  {
    key: 'creator',
    label: 'AI Creator',
    icon: Sparkles,
    badge: { text: 'PRO', variant: 'orange' },
    isLocked: (b) => !b.hasAICreator,
    items: [
      { label: 'Generate Content', path: '/creator' },
      { label: 'Generate Image', path: '/creator/image' },
    ],
  },
  {
    key: 'calendar',
    label: 'Content Calendar',
    icon: Image,
    badge: { text: 'PAID', variant: 'paid' },
    isLocked: (b) => !b.hasCalendar,
    items: [
      { label: 'My Content Library', path: '/calendar' },
    ],
  },
  {
    key: 'reviews',
    label: 'Review Manager',
    icon: Star,
    badge: { text: 'monthly', variant: 'info' },
    isLocked: (b) => !b.hasReviewManager,
    items: [
      { label: 'All Reviews', path: '/reviews' },
      { label: 'Send Review Requests', path: '/reviews/requests' },
    ],
  },
  {
    key: 'rankTracker',
    label: 'Rank Tracker',
    icon: TrendingUp,
    badge: { text: 'monthly', variant: 'info' },
    isLocked: (b) => !b.hasRankTracker,
    items: [
      { label: 'My Keywords', path: '/rank-tracker' },
      { label: 'Rankings Report', path: '/rank-tracker/report' },
    ],
  },
  {
    key: 'agency',
    label: 'Agency & Services',
    icon: Building2,
    badge: null,
    isLocked: () => false,
    items: [
      { label: 'Check Your Territory', path: '/agency' },
      { label: 'Done-For-You Services', path: '/agency/services' },
      { label: 'ReBoost CRM ↗', path: null, external: 'https://app.marketingreboost.com/crm' },
    ],
  },
]

export default function Sidebar() {
  const { isStaff } = useAuth()
  const billing = useBilling()
  const location = useLocation()

  const [openSections, setOpenSections] = useState(() => {
    const active = SECTIONS.find(s => s.items.some(i => i.path && location.pathname.startsWith(i.path)))
    return { [active?.key || 'audit']: true }
  })

  const toggle = (key) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <aside className="w-60 h-full bg-hub-sidebar border-r border-hub-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-hub-border shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-hub-blue rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-hub-text text-sm">{HUB_NAME}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {SECTIONS.map(section => {
          const locked = section.isLocked(billing)
          const isOpen = !!openSections[section.key]
          const hasActive = section.items.some(i => i.path && location.pathname === i.path)

          return (
            <div key={section.key}>
              {/* Section header */}
              <button
                onClick={() => toggle(section.key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors group ${
                  hasActive
                    ? 'bg-hub-blue/10 text-hub-blue'
                    : 'text-hub-text-secondary hover:text-hub-text hover:bg-hub-card'
                }`}
              >
                <section.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left font-medium truncate">{section.label}</span>
                {locked && <Lock className="w-3 h-3 shrink-0 text-hub-text-muted" />}
                {!locked && section.badge && (
                  <Badge variant={section.badge.variant} className="text-[10px] px-1.5 py-0">
                    {section.badge.text}
                  </Badge>
                )}
                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform text-hub-text-muted ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Sub items */}
              {isOpen && (
                <div className="ml-4 pl-3 border-l border-hub-border mt-0.5 mb-1 space-y-0.5">
                  {section.items.map(item => {
                    if (item.external) {
                      return (
                        <a
                          key={item.label}
                          href={item.external}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-hub-text-muted hover:text-hub-blue transition-colors"
                        >
                          {item.label}
                        </a>
                      )
                    }
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
                            isActive
                              ? 'bg-hub-blue/15 text-hub-blue font-medium'
                              : 'text-hub-text-muted hover:text-hub-text hover:bg-hub-card'
                          }`
                        }
                      >
                        {item.label}
                      </NavLink>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Admin link — staff/admin only */}
      {isStaff && (
        <div className="border-t border-hub-border p-2">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-hub-orange/10 text-hub-orange'
                  : 'text-hub-text-muted hover:text-hub-text hover:bg-hub-card'
              }`
            }
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="font-medium">Admin Panel</span>
          </NavLink>
        </div>
      )}
    </aside>
  )
}
