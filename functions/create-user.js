// One-time script: creates a test client user in Firebase Auth + Firestore.
// Run from: functions/ directory
// Usage: node create-user.js
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

initializeApp({ projectId: 'reboost-hub' })
const auth = getAuth()
const db = getFirestore()

async function main() {
  const email = 'justinmhomeloans@gmail.com'
  const password = '123456'

  // Check if already exists
  let uid
  try {
    const existing = await auth.getUserByEmail(email)
    uid = existing.uid
    console.log('Auth user already exists:', uid)
  } catch {
    const user = await auth.createUser({ email, password })
    uid = user.uid
    console.log('Created auth user:', uid)
  }

  // Upsert Firestore profile
  await db.collection('users').doc(uid).set({
    email,
    displayName: 'Justin (Test Account)',
    role: 'client',
    businessName: 'Test Business',
    phone: '', website: '', address: '',
    city: 'Salt Lake City', state: 'UT', zip: '',
    niche: 'plumber', tagline: '', currentOffer: '',
    logoUrl: null, photoUrls: [],
    connectedEmail: null,
    subscriptions: {
      scheduler: { active: false, tier: null, stripeSubId: null },
      reviewManager: { active: false, stripeSubId: null },
      rankTracker: { active: false, stripeSubId: null },
    },
    purchases: {
      citationsPackageId: null,
      calendarNiches: [],
      leadCredits: 5,
      outreachTemplates: true,
    },
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  console.log('✅ Firestore profile upserted for', email)
  console.log('   UID:', uid)
  console.log('   Password: 123456')
  console.log('   Role: client | leadCredits: 5 | outreachTemplates: true')
  process.exit(0)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
