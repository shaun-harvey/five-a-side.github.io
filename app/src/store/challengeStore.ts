import { create } from 'zustand'
import type { Challenge } from '../types/multiplayer'
import {
  createChallenge,
  acceptChallenge,
  declineChallenge,
  submitChallengeScore,
  cancelChallenge,
  getChallengeById,
  getUserChallenges,
  getPendingChallenges,
  getActiveChallenges,
  getCompletedChallenges,
  subscribeToUserChallenges,
  subscribeToChallenge,
  searchUsersByName,
  getPublicProfile,
  updatePublicProfile,
  getUserChallengeStats,
  type PublicProfile,
} from '../lib/firebase/challenges'

interface ChallengeState {
  // Data
  challenges: Challenge[]
  pendingChallenges: Challenge[]
  activeChallenges: Challenge[]
  completedChallenges: Challenge[]
  currentChallenge: Challenge | null
  searchResults: PublicProfile[]

  // Stats
  stats: {
    sent: number
    received: number
    won: number
    lost: number
    pending: number
  }

  // UI State
  isLoading: boolean
  isSearching: boolean
  error: string | null

  // Subscription cleanup
  unsubscribeAll: (() => void) | null
  unsubscribeCurrent: (() => void) | null

  // Actions
  initialize: (userId: string, displayName: string, photoURL?: string) => Promise<void>
  cleanup: () => void

  // Challenge management
  sendChallenge: (
    challengerId: string,
    challengerName: string,
    challengerPhotoURL: string | undefined,
    opponentId: string,
    opponentName: string,
    opponentPhotoURL: string | undefined
  ) => Promise<string>
  acceptChallenge: (challengeId: string) => Promise<void>
  declineChallenge: (challengeId: string) => Promise<void>
  cancelChallenge: (challengeId: string) => Promise<void>
  submitScore: (challengeId: string, playerId: string, score: number, gameId: string) => Promise<void>

  // Data fetching
  loadChallenge: (challengeId: string) => Promise<void>
  subscribeToChallengeUpdates: (challengeId: string) => () => void
  refreshChallenges: (userId: string) => Promise<void>
  refreshStats: (userId: string) => Promise<void>

  // Search
  searchUsers: (searchTerm: string, currentUserId: string) => Promise<void>
  clearSearchResults: () => void
  getUserProfile: (userId: string) => Promise<PublicProfile | null>

  // Error handling
  clearError: () => void
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
  // Initial state
  challenges: [],
  pendingChallenges: [],
  activeChallenges: [],
  completedChallenges: [],
  currentChallenge: null,
  searchResults: [],

  stats: {
    sent: 0,
    received: 0,
    won: 0,
    lost: 0,
    pending: 0,
  },

  isLoading: false,
  isSearching: false,
  error: null,

  unsubscribeAll: null,
  unsubscribeCurrent: null,

  // Initialize - set up realtime subscriptions
  initialize: async (userId: string, displayName: string, photoURL?: string) => {
    // Prevent re-initialization if already set up
    const { unsubscribeAll } = get()
    if (unsubscribeAll) {
      return // Already initialized
    }

    set({ isLoading: true, error: null })

    try {
      // Ensure user has a public profile for challenges (fire and forget - don't await)
      updatePublicProfile(userId, displayName, photoURL).catch(console.error)

      // Subscribe to all user's challenges
      const unsubscribe = subscribeToUserChallenges(userId, (challenges) => {
        // Categorize challenges
        const pending = challenges.filter(c =>
          c.opponentId === userId && c.status === 'pending'
        )
        const active = challenges.filter(c =>
          c.status === 'accepted' || c.status === 'in_progress'
        )
        const completed = challenges.filter(c =>
          c.status === 'completed' || c.status === 'declined' || c.status === 'expired'
        )

        set({
          challenges,
          pendingChallenges: pending,
          activeChallenges: active,
          completedChallenges: completed,
        })
      })

      // Load stats
      const stats = await getUserChallengeStats(userId)

      set({
        stats,
        isLoading: false,
        unsubscribeAll: unsubscribe,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to initialize challenges',
        isLoading: false,
      })
    }
  },

  // Cleanup subscriptions
  cleanup: () => {
    const { unsubscribeAll, unsubscribeCurrent } = get()
    unsubscribeAll?.()
    unsubscribeCurrent?.()
    set({
      challenges: [],
      pendingChallenges: [],
      activeChallenges: [],
      completedChallenges: [],
      currentChallenge: null,
      unsubscribeAll: null,
      unsubscribeCurrent: null,
    })
  },

  // Send a challenge
  sendChallenge: async (
    challengerId,
    challengerName,
    challengerPhotoURL,
    opponentId,
    opponentName,
    opponentPhotoURL
  ) => {
    set({ isLoading: true, error: null })
    try {
      const challengeId = await createChallenge(
        challengerId,
        challengerName,
        challengerPhotoURL,
        opponentId,
        opponentName,
        opponentPhotoURL
      )
      set({ isLoading: false })
      return challengeId
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to send challenge',
        isLoading: false,
      })
      throw error
    }
  },

  // Accept a challenge
  acceptChallenge: async (challengeId) => {
    set({ isLoading: true, error: null })
    try {
      await acceptChallenge(challengeId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to accept challenge',
        isLoading: false,
      })
      throw error
    }
  },

  // Decline a challenge
  declineChallenge: async (challengeId) => {
    set({ isLoading: true, error: null })
    try {
      await declineChallenge(challengeId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to decline challenge',
        isLoading: false,
      })
      throw error
    }
  },

  // Cancel a challenge
  cancelChallenge: async (challengeId) => {
    set({ isLoading: true, error: null })
    try {
      await cancelChallenge(challengeId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to cancel challenge',
        isLoading: false,
      })
      throw error
    }
  },

  // Submit a score
  submitScore: async (challengeId, playerId, score, gameId) => {
    set({ isLoading: true, error: null })
    try {
      await submitChallengeScore(challengeId, playerId, score, gameId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to submit score',
        isLoading: false,
      })
      throw error
    }
  },

  // Load a specific challenge
  loadChallenge: async (challengeId) => {
    set({ isLoading: true, error: null })
    try {
      const challenge = await getChallengeById(challengeId)
      set({ currentChallenge: challenge, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load challenge',
        isLoading: false,
      })
      throw error
    }
  },

  // Subscribe to a specific challenge for realtime updates
  subscribeToChallengeUpdates: (challengeId) => {
    // Clean up existing subscription
    const { unsubscribeCurrent } = get()
    unsubscribeCurrent?.()

    const unsubscribe = subscribeToChallenge(challengeId, (challenge) => {
      set({ currentChallenge: challenge })
    })

    set({ unsubscribeCurrent: unsubscribe })
    return unsubscribe
  },

  // Refresh challenges manually
  refreshChallenges: async (userId) => {
    set({ isLoading: true })
    try {
      const [pending, active, completed] = await Promise.all([
        getPendingChallenges(userId),
        getActiveChallenges(userId),
        getCompletedChallenges(userId),
      ])

      const all = await getUserChallenges(userId)

      set({
        challenges: all,
        pendingChallenges: pending,
        activeChallenges: active,
        completedChallenges: completed,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to refresh challenges',
        isLoading: false,
      })
    }
  },

  // Refresh stats
  refreshStats: async (userId) => {
    try {
      const stats = await getUserChallengeStats(userId)
      set({ stats })
    } catch (error) {
      console.error('Failed to refresh stats:', error)
    }
  },

  // Search for users to challenge
  searchUsers: async (searchTerm, currentUserId) => {
    if (searchTerm.length < 2) {
      set({ searchResults: [] })
      return
    }

    set({ isSearching: true })
    try {
      const results = await searchUsersByName(searchTerm, currentUserId)
      set({ searchResults: results, isSearching: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Search failed',
        isSearching: false,
      })
    }
  },

  clearSearchResults: () => set({ searchResults: [] }),

  getUserProfile: async (userId) => {
    return getPublicProfile(userId)
  },

  clearError: () => set({ error: null }),
}))

// Selector hooks for specific data
export const usePendingChallenges = () => useChallengeStore((state) => state.pendingChallenges)
export const useActiveChallenges = () => useChallengeStore((state) => state.activeChallenges)
export const useCompletedChallenges = () => useChallengeStore((state) => state.completedChallenges)
export const useChallengeStats = () => useChallengeStore((state) => state.stats)
export const useCurrentChallenge = () => useChallengeStore((state) => state.currentChallenge)
