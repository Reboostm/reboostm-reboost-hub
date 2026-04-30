import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../services/firebase'
import { getUserProfile, createUserProfile, updateUserProfile, subscribeToUserProfile } from '../services/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [impersonatedUserId, setImpersonatedUserId] = useState(null)
  const [impersonatedProfile, setImpersonatedProfile] = useState(null)

  useEffect(() => {
    let unsubProfile = null

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)

      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }

      if (firebaseUser) {
        // Real-time listener so profile updates reflect immediately
        unsubProfile = subscribeToUserProfile(firebaseUser.uid, (profile) => {
          setUserProfile(profile)
          setLoading(false)
        })
      } else {
        setUserProfile(null)
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  // Handle admin impersonation subscription
  useEffect(() => {
    if (!impersonatedUserId) {
      setImpersonatedProfile(null)
      return
    }
    const unsubImpersonated = subscribeToUserProfile(impersonatedUserId, setImpersonatedProfile)
    return () => unsubImpersonated()
  }, [impersonatedUserId])

  const login = (email, password) =>
    signInWithEmailAndPassword(auth, email, password)

  const signup = async (email, password, profileData) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(newUser, { displayName: profileData.displayName })
    await createUserProfile(newUser.uid, {
      email,
      role: 'client',
      ...profileData,
    })
    return newUser
  }

  const logout = () => signOut(auth)

  const resetPassword = (email) => sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/login`,
  })

  const updateProfile_ = async (data) => {
    if (!user) return
    await updateUserProfile(user.uid, data)
    if (data.displayName) {
      await updateProfile(user, { displayName: data.displayName })
    }
  }

  const isAdmin = userProfile?.role === 'admin'
  const isStaff = userProfile?.role === 'staff' || isAdmin
  const isClient = userProfile?.role === 'client'

  // Impersonation derived state
  const effectiveProfile = impersonatedUserId ? impersonatedProfile : userProfile
  const effectiveUserId = impersonatedUserId || user?.uid
  const isViewingAs = !!impersonatedUserId

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      isAdmin,
      isStaff,
      isClient,
      login,
      signup,
      logout,
      resetPassword,
      updateProfile: updateProfile_,
      setUserProfile,
      impersonatedUserId,
      setImpersonatedUserId,
      effectiveProfile,
      effectiveUserId,
      isViewingAs,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')

  // Return the context directly - effectiveProfile and effectiveUserId
  // are already available for use, but don't override user/userProfile by default
  // Components can opt-in by using effectiveProfile/effectiveUserId
  return ctx
}
