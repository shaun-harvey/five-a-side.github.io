import { stringSimilarity } from './levenshtein'
import { SIMILARITY_THRESHOLD } from './constants'
import type { GuessResult } from '../../types/game'

/**
 * Normalize a string for comparison
 * Replaces hyphens with spaces (like original), then removes all spaces, converts to uppercase
 */
function normalizeForComparison(str: string): string {
  return str.toUpperCase().replace(/-/g, ' ').replace(/\s+/g, '').trim()
}

/**
 * Extract surname from a full name
 * Replaces hyphens with spaces first (like original)
 */
function getSurname(name: string): string {
  const normalized = name.trim().replace(/-/g, ' ')
  const parts = normalized.split(/\s+/)
  return parts[parts.length - 1].toUpperCase()
}

/**
 * Check if two names have the same consonant structure
 * This helps catch typos like "HALLAND" vs "HAALAND"
 */
function hasSameConsonantStructure(str1: string, str2: string): boolean {
  const getConsonants = (s: string) =>
    s.toUpperCase().replace(/[AEIOU\s]/g, '')

  const consonants1 = getConsonants(str1)
  const consonants2 = getConsonants(str2)

  // Check if one contains the other (for names like HAALAND -> HLND)
  return (
    consonants1 === consonants2 ||
    (consonants1.length > 3 && consonants2.includes(consonants1)) ||
    (consonants2.length > 3 && consonants1.includes(consonants2))
  )
}

/**
 * Validate a guess against the correct answer
 * Returns detailed result including similarity score and feedback message
 *
 * Matching logic (from original):
 * - Exact full name match: Perfect!
 * - Exact surname match: Perfect!
 * - Surname similarity >= 70%: Shot on target!
 * - Same consonant structure: Shot on target!
 * - Otherwise: Wrong guess
 */
export function validateGuess(
  guess: string,
  correctAnswer: string,
  playerName: string
): GuessResult {
  const normalizedGuess = normalizeForComparison(guess)
  const normalizedAnswer = normalizeForComparison(correctAnswer)

  // Empty guess
  if (!normalizedGuess) {
    return {
      correct: false,
      exactMatch: false,
      similarityScore: 0,
      message: 'Please enter a guess',
    }
  }

  // Get surnames for comparison
  const guessedSurname = getSurname(guess)
  const correctSurname = getSurname(correctAnswer)

  // Exact full name match
  if (normalizedGuess === normalizedAnswer) {
    return {
      correct: true,
      exactMatch: true,
      similarityScore: 1,
      message: `Perfect! ${playerName}`,
    }
  }

  // Exact surname match
  if (guessedSurname === correctSurname) {
    return {
      correct: true,
      exactMatch: true,
      similarityScore: 1,
      message: `Perfect! ${playerName}`,
    }
  }

  // Calculate surname similarity
  const surnameSimilarity = stringSimilarity(guessedSurname, correctSurname)

  // Close surname match (70%+ similarity)
  if (surnameSimilarity >= SIMILARITY_THRESHOLD) {
    return {
      correct: true,
      exactMatch: false,
      similarityScore: surnameSimilarity,
      message: `That's a shot on target that just crept in! ${playerName}`,
    }
  }

  // Check consonant structure (catches vowel mistakes like HALLAND vs HAALAND)
  if (hasSameConsonantStructure(guessedSurname, correctSurname)) {
    return {
      correct: true,
      exactMatch: false,
      similarityScore: surnameSimilarity,
      message: `That's a shot on target that just crept in! ${playerName}`,
    }
  }

  // Wrong guess
  return {
    correct: false,
    exactMatch: false,
    similarityScore: surnameSimilarity,
    message: 'Wrong!',
  }
}

/**
 * Get the appropriate wrong guess message based on wrong guess count
 * Messages match the original game exactly
 */
export function getWrongGuessMessage(wrongGuessCount: number): {
  message: string
  type: 'warning' | 'booking' | 'red-card'
} {
  switch (wrongGuessCount) {
    case 1:
      return {
        message: "The ref wants the game to flow so that's just a warning",
        type: 'warning',
      }
    case 2:
      return {
        message: "Oooooo, that's a booking!",
        type: 'booking',
      }
    case 3:
      return {
        message: "That's a shocking tackle! Get off the pitch!",
        type: 'red-card',
      }
    default:
      return {
        message: 'Incorrect guess!',
        type: 'warning',
      }
  }
}
