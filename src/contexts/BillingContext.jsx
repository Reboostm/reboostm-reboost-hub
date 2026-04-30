import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'

const BillingContext = createContext(null)

export function BillingProvider({ children }) {
  const { userProfile } = useAuth()

  const subscriptions = userProfile?.subscriptions || {}
  const purchases = userProfile?.purchases || {}

  const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'staff'

  const hasScheduler      = isAdmin || subscriptions.scheduler?.active === true
  const hasReviewManager  = isAdmin || subscriptions.reviewManager?.active === true
  const hasRankTracker    = isAdmin || subscriptions.rankTracker?.active === true
  const hasCitations      = isAdmin || !!purchases.citationsPackageId
  const leadCredits       = isAdmin ? 9999 : (purchases.leadCredits || 0)
  const hasLeadCredits    = isAdmin || leadCredits > 0
  const hasOutreachTemplates = isAdmin || purchases.outreachTemplates === true
  const calendarNiches    = purchases.calendarNiches || []
  const hasCalendar       = isAdmin || calendarNiches.length > 0
  const hasAICreator      = isAdmin || (hasScheduler && subscriptions.scheduler?.tier === 'pro')

  function hasCalendarNiche(niche) {
    return calendarNiches.includes(niche)
  }

  return (
    <BillingContext.Provider value={{
      subscriptions,
      purchases,
      hasScheduler,
      hasReviewManager,
      hasRankTracker,
      hasCitations,
      leadCredits,
      hasLeadCredits,
      hasOutreachTemplates,
      calendarNiches,
      hasCalendar,
      hasAICreator,
      hasCalendarNiche,
    }}>
      {children}
    </BillingContext.Provider>
  )
}

export function useBilling() {
  const ctx = useContext(BillingContext)
  if (!ctx) throw new Error('useBilling must be used within BillingProvider')
  return ctx
}
