import type { Player, League } from './player'

export type GamePhase = 'idle' | 'letter-selection' | 'playing' | 'round-transition' | 'game-over'

export type RoundNumber = 1 | 2 | 3

export interface RoundConfig {
  number: RoundNumber
  name: string
  category: 'modern' | 'legend' | 'obscure'
  duration: number // seconds
  pointsPerCorrect: number
}

export interface GameState {
  // Game phase
  phase: GamePhase
  currentRound: RoundNumber

  // League selection
  selectedLeague: League | null

  // Letter selection
  chosenLetters: string[]
  availableLetters: string[]
  vowelCount: number

  // Current player
  currentPlayer: Player | null
  displayedName: string
  currentPlayerLetters: string[]
  revealedLettersForCurrentPlayer: Set<string> // Letters revealed for current player (stays even after substitution)

  // Resources
  score: number
  passesLeft: number
  substitutionsLeft: number
  varHintsLeft: number
  wrongGuesses: number

  // Round scores tracking
  roundScores: { 1: number; 2: number; 3: number }
  scoreAtRoundStart: number

  // Timer
  timeLeft: number

  // Streak system
  correctStreak: number
  hasEarnedVARBonus: boolean

  // Tracking
  usedLetters: Set<string> // Letters that have been used (initial pick + substituted out) - can't be selected again
  usedPlayers: Record<RoundNumber, string[]>
  varHintedPlayers: Set<string>
  guessAttemptsForCurrentPlayer: number
  timeWastingOffenses: number
  substitutionTimeoutCount: number

  // Flags
  isGameOver: boolean
  endReason?: 'completed' | 'three-strikes' | 'tab-switch' | 'timeout'

  // Messages
  varHintMessage?: string // Message to show about VAR hints at round start

  // Duration tracking
  gameStartTime?: number // Timestamp when game started
  gameDurationSeconds: number // Total seconds played
}

export interface GuessResult {
  correct: boolean
  exactMatch: boolean
  similarityScore: number
  message: string
  bonusMessage?: string // For streak bonus message
}

export interface GameSession {
  id: string
  userId: string
  startedAt: Date
  endedAt?: Date
  finalScore: number
  rounds: {
    round: RoundNumber
    playersGuessed: string[]
    playersSkipped: string[]
    score: number
  }[]
  correctGuesses: number
  wrongGuesses: number
  passesUsed: number
  substitutionsUsed: number
  varHintsUsed: number
  maxStreak: number
  completedNormally: boolean
}
