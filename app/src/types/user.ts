import type { Timestamp } from 'firebase/firestore'

// ==================== USER STATS ====================

export interface UserStats {
  // Core game stats
  totalGamesPlayed: number
  highestScore: number
  averageScore: number
  totalCorrectGuesses: number
  totalWrongGuesses: number
  accuracy: number // percentage

  // Action usage stats
  totalPassesUsed: number
  totalSubstitutionsUsed: number
  totalVARHintsUsed: number

  // Streak tracking
  longestCorrectStreak: number
  currentStreak: number // consecutive games played

  // Game completion breakdown
  gamesCompletedFully: number // finished all 3 rounds
  gamesEndedByStrikes: number // ended by 3 wrong guesses
  gamesEndedByCheating: number // ended by leaving/cheating

  // Time stats
  totalPlayTimeSeconds: number
  averageGameDurationSeconds: number

  // Round-specific performance
  round1TotalScore: number
  round2TotalScore: number
  round3TotalScore: number
  round1GamesPlayed: number
  round2GamesPlayed: number
  round3GamesPlayed: number
}

export interface RecentlyUsedPlayers {
  1: string[]
  2: string[]
  3: string[]
}

// ==================== USER PROFILE ====================

export type LeagueId = 'premier-league' | 'la-liga' | 'bundesliga' | 'serie-a' | 'ligue-1' | 'champions-league'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  authProvider: 'email' | 'google'
  photoURL?: string
  createdAt: Timestamp
  lastLoginAt: Timestamp
  stats: UserStats
  recentlyUsed: RecentlyUsedPlayers
  gamesSinceReset: number

  // League preference
  selectedLeague?: LeagueId

  // Achievements and badges (future expansion)
  achievements?: string[]
  europeanPoints?: number
  championsLeagueUnlocked?: boolean
}

// ==================== LEADERBOARD ====================

export interface LeaderboardEntry {
  id: string
  userId: string
  displayName: string
  photoURL?: string
  score: number
  achievedAt: Timestamp
  period: 'all-time' | 'monthly' | 'weekly' | 'daily'

  // Extra context for the score
  roundsCompleted?: number
  endReason?: 'completed' | 'three-strikes' | 'cheating'
}

// ==================== GAME RECORDS ====================

export interface RoundDetail {
  score: number
  correctGuesses: number
  wrongGuesses: number
  passesUsed: number
  substitutionsUsed: number
  varHintsUsed: number
  durationSeconds: number
  playersGuessed: string[] // names of correctly guessed players
  playersSkipped: string[] // names of passed players
}

export interface GameRecord {
  id?: string

  // Overall game stats
  score: number
  correctGuesses: number
  wrongGuesses: number
  passesUsed: number
  substitutionsUsed: number
  varHintsUsed: number

  // How the game ended
  endReason: 'completed' | 'three-strikes' | 'cheating'
  roundReached: 1 | 2 | 3 // which round did they reach

  // Time tracking
  totalDurationSeconds: number
  playedAt: Timestamp

  // Letters chosen for this game
  chosenLetters: string[]

  // Streak achieved in this game
  longestStreakInGame: number

  // Per-round breakdown
  rounds: {
    1?: RoundDetail
    2?: RoundDetail
    3?: RoundDetail
  }

  // Legacy fields for backwards compatibility
  round1Score?: number
  round2Score?: number
  round3Score?: number
}
