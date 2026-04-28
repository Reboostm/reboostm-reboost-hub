import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, addDoc, serverTimestamp, onSnapshot,
} from 'firebase/firestore'
import { db } from './firebase'

// ─── Users ───────────────────────────────────────────────────────────────────

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createUserProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    subscriptions: {
      scheduler: { active: false, tier: null, stripeSubId: null },
      reviewManager: { active: false, stripeSubId: null },
      rankTracker: { active: false, stripeSubId: null },
    },
    purchases: {
      citationsPackageId: null,
      calendarNiches: [],
      leadCredits: 0,
      outreachTemplates: false,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, 'users', uid), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export function subscribeToUserProfile(uid, callback) {
  return onSnapshot(doc(db, 'users', uid), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

// ─── Audit Results ────────────────────────────────────────────────────────────

export async function saveAuditResult(data) {
  return addDoc(collection(db, 'auditResults'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function getAuditResults(userId) {
  const q = query(
    collection(db, 'auditResults'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Territories ──────────────────────────────────────────────────────────────

export async function checkTerritory(niche, city, state) {
  const q = query(
    collection(db, 'territories'),
    where('niche', '==', niche),
    where('city', '==', city),
    where('state', '==', state)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export async function getTerritories(filters = {}) {
  let q = collection(db, 'territories')
  const constraints = []
  if (filters.niche) constraints.push(where('niche', '==', filters.niche))
  if (filters.status) constraints.push(where('status', '==', filters.status))
  q = query(q, ...constraints, orderBy('city'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function upsertTerritory(id, data) {
  if (id) {
    await updateDoc(doc(db, 'territories', id), { ...data, updatedAt: serverTimestamp() })
  } else {
    await addDoc(collection(db, 'territories'), { ...data, updatedAt: serverTimestamp() })
  }
}

// ─── Citations ────────────────────────────────────────────────────────────────

export function subscribeToCitationsBatches(userId, callback) {
  const q = query(
    collection(db, 'citations'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export function subscribeToCitationsBatch(batchId, callback) {
  return onSnapshot(doc(db, 'citations', batchId), snap => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  })
}

export function subscribeToCitationsDirectories(batchId, callback) {
  const q = query(
    collection(db, 'citations', batchId, 'directories'),
    orderBy('priority'),
    orderBy('name')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function getCitationsBatches(userId) {
  const q = query(
    collection(db, 'citations'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Leads ────────────────────────────────────────────────────────────────────

export function subscribeToLeadsBatches(userId, callback) {
  const q = query(
    collection(db, 'leads'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function getLeadsBatches(userId) {
  const q = query(
    collection(db, 'leads'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(20)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getLeadsBatchItems(batchId) {
  const snap = await getDocs(collection(db, 'leads', batchId, 'items'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function markLeadsBatchExported(batchId) {
  await updateDoc(doc(db, 'leads', batchId), { exported: true })
}

// ─── Scheduled Posts ─────────────────────────────────────────────────────────

export function subscribeToScheduledPosts(userId, callback) {
  const q = query(
    collection(db, 'scheduledPosts'),
    where('userId', '==', userId),
    where('status', 'in', ['scheduled', 'published', 'failed']),
    orderBy('scheduledAt', 'asc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function deleteScheduledPost(postId) {
  await updateDoc(doc(db, 'scheduledPosts', postId), { status: 'cancelled' })
}

// ─── Rank Tracker ────────────────────────────────────────────────────────────

export function subscribeToKeywords(userId, callback) {
  const q = query(
    collection(db, 'trackedKeywords'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function addKeyword(data) {
  return addDoc(collection(db, 'trackedKeywords'), {
    ...data,
    currentRank: null,
    previousRank: null,
    inLocalPack: false,
    lastChecked: null,
    createdAt: serverTimestamp(),
  })
}

export async function deleteKeyword(keywordId) {
  await deleteDoc(doc(db, 'trackedKeywords', keywordId))
}

export async function getRankHistory(keywordId) {
  const q = query(
    collection(db, 'rankChecks'),
    where('keywordId', '==', keywordId),
    orderBy('checkedAt', 'desc'),
    limit(12)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ─── Offers (Stripe products) ──────────────────────────────────────────────────

export async function getOffers(activeOnly = true) {
  const q = query(
    collection(db, 'offers'),
    ...(activeOnly ? [where('active', '==', true)] : []),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getOfferById(offerId) {
  const snap = await getDoc(doc(db, 'offers', offerId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function createOffer(data) {
  return addDoc(collection(db, 'offers'), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export async function updateOffer(offerId, data) {
  await updateDoc(doc(db, 'offers', offerId), data)
}

export async function deleteOffer(offerId) {
  await deleteDoc(doc(db, 'offers', offerId))
}

// ─── Admin: all users ─────────────────────────────────────────────────────────

export async function getAllUsers(role = null) {
  let q = collection(db, 'users')
  const constraints = [orderBy('createdAt', 'desc')]
  if (role) constraints.unshift(where('role', '==', role))
  q = query(q, ...constraints)
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}
