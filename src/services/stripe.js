import { createCheckoutSession, createPortalSession } from './functions'
import { getOffers } from './firestore'

export async function redirectToCheckout(offerId) {
  const { url } = await createCheckoutSession({ offerId })
  window.location.href = url
}

export async function redirectToPortal() {
  const { url } = await createPortalSession({})
  window.location.href = url
}

// Get all active offers from Firestore
export async function getActiveOffers() {
  return await getOffers(true)
}
