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

// Scheduler (Zernio)
export const schedulePost = call('schedulePost')
export const cancelPost = call('cancelPost')
export const connectZernioAccount = call('connectZernioAccount')

// Payments
export const createCheckoutSession = call('createCheckoutSession')
export const createPortalSession = call('createPortalSession')

// Admin
export const claimAdminRole = call('claimAdminRole')
export const adminCreateUser = call('adminCreateUser')
export const adminUpdateAccess = call('adminUpdateAccess')
export const setUserRole = call('setUserRole')
export const resetUserPassword = call('resetUserPassword')
