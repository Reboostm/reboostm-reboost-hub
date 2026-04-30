import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

function call(name) {
  return (data) => httpsCallable(functions, name)(data).then(r => r.data)
}

// Citations
export const startCitationsJob = call('startCitationsJob')
export const getCitationsJobStatus = call('getCitationsJobStatus')

// SEO Audit
export const runSeoAudit = call('runSeoAudit')

// Lead Generator
export const searchLeads = call('searchLeads')
export const generateOutreachSequence = call('generateOutreachSequence')

// Content
export const generateAIContent = call('generateAIContent')
export const generateAIImage = call('generateAIImage')

// Reviews
export const fetchReviews = call('fetchReviews')
export const sendReviewRequest = call('sendReviewRequest')

// Rank Tracker
export const checkKeywordRank = call('checkKeywordRank')
export const getGoogleKeywordSuggestions = call('getGoogleKeywordSuggestions')

// Scheduler (Zernio)
export const schedulePost = call('schedulePost')
export const cancelPost = call('cancelPost')
export const connectZernioAccount = call('connectZernioAccount')

// Payments
export const createCheckoutSession = call('createCheckoutSession')
export const createPortalSession = call('createPortalSession')

// Gmail OAuth
export const getGmailAuthUrl = call('getGmailAuthUrl')
export const handleGmailOAuthCallback = call('handleGmailOAuthCallback')
export const disconnectGmail = call('disconnectGmail')

// Admin
export const claimAdminRole = call('claimAdminRole')
export const adminCreateUser = call('adminCreateUser')
export const adminUpdateAccess = call('adminUpdateAccess')
export const adminDeleteUser = call('adminDeleteUser')
export const setUserRole = call('setUserRole')
export const resetUserPassword = call('resetUserPassword')
