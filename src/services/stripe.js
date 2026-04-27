import { createCheckoutSession, createPortalSession } from './functions'

export async function redirectToCheckout(priceId, mode = 'payment', metadata = {}) {
  const { url } = await createCheckoutSession({ priceId, mode, metadata })
  window.location.href = url
}

export async function redirectToPortal() {
  const { url } = await createPortalSession({})
  window.location.href = url
}

// Price IDs from Stripe Dashboard — fill these in
export const PRICES = {
  citations_starter: '',
  citations_pro: '',
  citations_premium: '',
  scheduler_basic: '',
  scheduler_pro: '',
  review_manager: '',
  rank_tracker: '',
  calendar_niche: '',
  lead_credits_100: '',
  lead_credits_500: '',
  outreach_templates: '',
}
