import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { UserProfile, LeagueId } from '../types/user'
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut as firebaseSignOut,
  onAuthChange,
  getUserProfile,
  deleteAccount as firebaseDeleteAccount,
} from '../lib/firebase/auth'
import { updateUserSelectedLeague } from '../lib/firebase/firestore'

interface AuthState {
  user: User | null
  profile: UserProfile | null
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Actions
  initialize: () => () => void
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  clearError: () => void
  refreshProfile: () => Promise<void>
  setSelectedLeague: (leagueId: LeagueId) => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,
  isInitialized: false,
  error: null,

  initialize: () => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid)
        set({ user, profile, isLoading: false, isInitialized: true })
      } else {
        set({ user: null, profile: null, isLoading: false, isInitialized: true })
      }
    })
    return unsubscribe
  },

  signUp: async (email, password, displayName) => {
    set({ isLoading: true, error: null })
    try {
      const user = await signUpWithEmail(email, password, displayName)
      const profile = await getUserProfile(user.uid)
      set({ user, profile, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sign up failed',
        isLoading: false,
      })
      throw error
    }
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null })
    try {
      const user = await signInWithEmail(email, password)
      const profile = await getUserProfile(user.uid)
      set({ user, profile, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sign in failed',
        isLoading: false,
      })
      throw error
    }
  },

  signInWithGoogle: async () => {
    set({ isLoading: true, error: null })
    try {
      const user = await signInWithGoogle()
      // User closed popup - just reset loading state
      if (!user) {
        set({ isLoading: false })
        return
      }
      const profile = await getUserProfile(user.uid)
      set({ user, profile, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Google sign in failed',
        isLoading: false,
      })
      throw error
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null })
    try {
      await firebaseSignOut()
      set({ user: null, profile: null, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Sign out failed',
        isLoading: false,
      })
      throw error
    }
  },

  deleteAccount: async () => {
    set({ isLoading: true, error: null })
    try {
      await firebaseDeleteAccount()
      set({ user: null, profile: null, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete account',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),

  refreshProfile: async () => {
    const { user } = get()
    if (user) {
      const profile = await getUserProfile(user.uid)
      set({ profile })
    }
  },

  setSelectedLeague: async (leagueId: LeagueId) => {
    const { user, profile } = get()
    if (!user || !profile) return

    // Optimistically update local state
    set({
      profile: {
        ...profile,
        selectedLeague: leagueId,
      },
    })

    // Persist to Firestore
    try {
      await updateUserSelectedLeague(user.uid, leagueId)
    } catch (error) {
      console.error('Failed to save league selection:', error)
      // Revert on error
      set({ profile })
    }
  },
}))
