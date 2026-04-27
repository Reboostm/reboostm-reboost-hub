import { createContext, useContext } from 'react'
import { useAuth } from './AuthContext'

const BillingContext = createContext(null)

export function BillingProvider({ children }) {
  const { userProfile } = useAuth()

  const subscriptions = userProfile?.subscriptions || {}
  const purchases = userProfile?.purchases || {}

  const hasScheduler = subscriptions.scheduler?.active === true
  const hasReviewManager = subscriptions.reviewManager?.active === true
  const hasRankTracker = subscriptions.rankTracker?.active === true
  const hasCitations = !!purchases.citationsPackageId
  const leadCredits = purchases.leadCredits || 0
  const hasLeadCredits = leadCredits > 0
  const hasOutreachTemplates = purchases.outreachTemplates === true
  const calendarNiches = purchases.calendarNiches || []
  const hasCalendar = calendarNiches.length > 0
  const hasAICreator = hasScheduler && subscriptions.scheduler?.tier === 'pro'

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
