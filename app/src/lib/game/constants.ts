import type { RoundConfig, RoundNumber } from '../../types/game'

// Letters
export const VOWELS = ['A', 'E', 'I', 'O', 'U']
export const CONSONANTS = [
  'B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M',
  'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'
]
export const ALL_LETTERS = [...VOWELS, ...CONSONANTS]

// Game rules
export const MAX_WRONG_GUESSES = 3
export const MAX_PASSES = 5
export const MAX_SUBSTITUTIONS = 5
export const INITIAL_VAR_HINTS = 3
export const VAR_HINTS_ROUND_2_BONUS = 3
export const VAR_HINTS_ROUND_3_BONUS = 1
export const STREAK_FOR_VAR_BONUS = 5
export const VAR_BONUS_HINTS = 5

// Letter selection rules
export const REQUIRED_VOWELS = 1
export const REQUIRED_CONSONANTS = 4
export const TOTAL_LETTERS = REQUIRED_VOWELS + REQUIRED_CONSONANTS

// Timing
export const GUESS_MODAL_TIMEOUT = 20 // seconds
export const SUBSTITUTION_TIMEOUT = 20 // seconds
export const GAMES_UNTIL_PLAYER_RESET = 6

// Guess validation
export const SIMILARITY_THRESHOLD = 0.7 // 70% match required

// Round configurations
export const ROUND_CONFIGS: Record<RoundNumber, RoundConfig> = {
  1: {
    number: 1,
    name: 'Modern Stars',
    category: 'modern',
    duration: 45,
    pointsPerCorrect: 3,
  },
  2: {
    number: 2,
    name: 'Legends',
    category: 'legend',
    duration: 45,
    pointsPerCorrect: 3,
  },
  3: {
    number: 3,
    name: 'Forgotten Heroes',
    category: 'obscure',
    duration: 30,
    pointsPerCorrect: 6,
  },
}

// Colors (matching the stadium theme)
export const COLORS = {
  fieldGreen: '#2d5016',
  fieldGreenLight: '#3a5f1f',
  gold: '#ffd700',
  red: '#b91c1c',
  blue: '#1d4ed8',
  yellow: '#eab308',
  purple: '#7c3aed',
} as const
