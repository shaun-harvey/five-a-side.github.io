import { create } from 'zustand'
import type { Tournament, TournamentMatch, TournamentType } from '../types/multiplayer'
import {
  createTournament,
  joinTournament,
  findTournamentByCode,
  leaveTournament,
  startTournament,
  deleteTournament,
  getTournamentById,
  getTournamentMatches,
  getPublicTournaments,
  getUserTournaments,
  subscribeToTournament,
  subscribeToTournamentMatches,
  submitTournamentMatchScore,
} from '../lib/firebase/tournaments'

interface TournamentState {
  // Data
  tournaments: Tournament[]
  publicTournaments: Tournament[]
  currentTournament: Tournament | null
  currentMatches: TournamentMatch[]

  // UI State
  isLoading: boolean
  error: string | null

  // Subscription cleanup
  unsubscribeTournament: (() => void) | null
  unsubscribeMatches: (() => void) | null

  // Actions
  loadUserTournaments: (userId: string) => Promise<void>
  loadPublicTournaments: () => Promise<void>
  loadTournament: (tournamentId: string) => Promise<void>
  subscribeTo: (tournamentId: string) => void
  cleanup: () => void

  // Tournament management
  create: (
    creatorId: string,
    creatorName: string,
    name: string,
    type: TournamentType,
    maxPlayers: 4 | 8 | 16 | 32,
    isPublic: boolean,
    matchDeadlineHours?: number,
    description?: string
  ) => Promise<string>
  join: (tournamentId: string, userId: string, displayName: string, photoURL?: string) => Promise<void>
  joinByCode: (code: string, userId: string, displayName: string, photoURL?: string) => Promise<string>
  leave: (tournamentId: string, userId: string) => Promise<void>
  start: (tournamentId: string) => Promise<void>
  delete: (tournamentId: string) => Promise<void>

  // Match actions
  submitScore: (tournamentId: string, matchId: string, playerId: string, score: number, gameId: string) => Promise<void>

  // Error handling
  clearError: () => void
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  // Initial state
  tournaments: [],
  publicTournaments: [],
  currentTournament: null,
  currentMatches: [],

  isLoading: false,
  error: null,

  unsubscribeTournament: null,
  unsubscribeMatches: null,

  // Load user's tournaments
  loadUserTournaments: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const tournaments = await getUserTournaments(userId)
      set({ tournaments, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load tournaments',
        isLoading: false,
      })
    }
  },

  // Load public tournaments
  loadPublicTournaments: async () => {
    set({ isLoading: true, error: null })
    try {
      const publicTournaments = await getPublicTournaments()
      set({ publicTournaments, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load public tournaments',
        isLoading: false,
      })
    }
  },

  // Load a specific tournament with matches
  loadTournament: async (tournamentId: string) => {
    set({ isLoading: true, error: null })
    try {
      const [tournament, matches] = await Promise.all([
        getTournamentById(tournamentId),
        getTournamentMatches(tournamentId),
      ])
      set({
        currentTournament: tournament,
        currentMatches: matches,
        isLoading: false,
      })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load tournament',
        isLoading: false,
      })
    }
  },

  // Subscribe to tournament and matches for realtime updates
  subscribeTo: (tournamentId: string) => {
    const { unsubscribeTournament, unsubscribeMatches } = get()

    // Clean up existing subscriptions
    unsubscribeTournament?.()
    unsubscribeMatches?.()

    const unsubTournament = subscribeToTournament(tournamentId, (tournament) => {
      set({ currentTournament: tournament })
    })

    const unsubMatches = subscribeToTournamentMatches(tournamentId, (matches) => {
      set({ currentMatches: matches })
    })

    set({
      unsubscribeTournament: unsubTournament,
      unsubscribeMatches: unsubMatches,
    })
  },

  // Cleanup subscriptions
  cleanup: () => {
    const { unsubscribeTournament, unsubscribeMatches } = get()
    unsubscribeTournament?.()
    unsubscribeMatches?.()
    set({
      currentTournament: null,
      currentMatches: [],
      unsubscribeTournament: null,
      unsubscribeMatches: null,
    })
  },

  // Create a tournament
  create: async (creatorId, creatorName, name, type, maxPlayers, isPublic, matchDeadlineHours = 24, description) => {
    set({ isLoading: true, error: null })
    try {
      const tournamentId = await createTournament(
        creatorId,
        creatorName,
        name,
        type,
        maxPlayers,
        isPublic,
        matchDeadlineHours,
        description
      )
      set({ isLoading: false })
      return tournamentId
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create tournament',
        isLoading: false,
      })
      throw error
    }
  },

  // Join a tournament
  join: async (tournamentId, userId, displayName, photoURL) => {
    set({ isLoading: true, error: null })
    try {
      await joinTournament(tournamentId, userId, displayName, photoURL)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join tournament',
        isLoading: false,
      })
      throw error
    }
  },

  // Join by invite code
  joinByCode: async (code, userId, displayName, photoURL) => {
    set({ isLoading: true, error: null })
    try {
      const tournament = await findTournamentByCode(code)
      if (!tournament) {
        throw new Error('Invalid tournament code')
      }
      await joinTournament(tournament.id, userId, displayName, photoURL)
      set({ isLoading: false })
      return tournament.id
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to join tournament',
        isLoading: false,
      })
      throw error
    }
  },

  // Leave a tournament
  leave: async (tournamentId, userId) => {
    set({ isLoading: true, error: null })
    try {
      await leaveTournament(tournamentId, userId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to leave tournament',
        isLoading: false,
      })
      throw error
    }
  },

  // Start a tournament
  start: async (tournamentId) => {
    set({ isLoading: true, error: null })
    try {
      await startTournament(tournamentId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to start tournament',
        isLoading: false,
      })
      throw error
    }
  },

  // Delete a tournament
  delete: async (tournamentId) => {
    set({ isLoading: true, error: null })
    try {
      await deleteTournament(tournamentId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete tournament',
        isLoading: false,
      })
      throw error
    }
  },

  // Submit match score
  submitScore: async (tournamentId, matchId, playerId, score, gameId) => {
    set({ isLoading: true, error: null })
    try {
      await submitTournamentMatchScore(tournamentId, matchId, playerId, score, gameId)
      set({ isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to submit score',
        isLoading: false,
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
}))

// Selector hooks
export const useCurrentTournament = () => useTournamentStore((state) => state.currentTournament)
export const useCurrentMatches = () => useTournamentStore((state) => state.currentMatches)
export const useUserTournaments = () => useTournamentStore((state) => state.tournaments)
export const usePublicTournaments = () => useTournamentStore((state) => state.publicTournaments)
