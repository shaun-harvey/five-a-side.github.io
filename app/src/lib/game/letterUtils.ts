import { VOWELS, CONSONANTS } from './constants'

/**
 * Check if a letter is a vowel
 */
export function isVowel(letter: string): boolean {
  return VOWELS.includes(letter.toUpperCase())
}

/**
 * Check if a letter is a consonant
 */
export function isConsonant(letter: string): boolean {
  return CONSONANTS.includes(letter.toUpperCase())
}

/**
 * Get the letters in a player's name (uppercase, no spaces)
 */
export function getLettersInName(name: string): string[] {
  return name
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .split('')
}

/**
 * Get unique letters in a name
 */
export function getUniqueLettersInName(name: string): string[] {
  return [...new Set(getLettersInName(name))]
}

/**
 * Check if a player's name can be displayed with the chosen letters
 * Returns true if all letters in the name are in the chosen letters
 */
export function canDisplayWithLetters(name: string, chosenLetters: string[]): boolean {
  const nameLetters = getUniqueLettersInName(name)
  const chosenSet = new Set(chosenLetters.map(l => l.toUpperCase()))

  return nameLetters.every(letter => chosenSet.has(letter))
}

/**
 * Get the revealed letters in a name based on chosen letters
 */
export function getRevealedLetters(name: string, chosenLetters: string[]): string[] {
  const chosenSet = new Set(chosenLetters.map(l => l.toUpperCase()))

  return name
    .toUpperCase()
    .split('')
    .map(char => {
      if (char === ' ') return ' '
      if (chosenSet.has(char)) return char
      return '_'
    })
}

/**
 * Create the display string for a player name
 * Shows chosen letters, underscores for hidden letters, preserves spaces
 */
export function createDisplayName(name: string, chosenLetters: string[]): string {
  return getRevealedLetters(name, chosenLetters).join('')
}

/**
 * Count how many letters in a name are revealed by the chosen letters
 */
export function countRevealedLetters(name: string, chosenLetters: string[]): number {
  const chosenSet = new Set(chosenLetters.map(l => l.toUpperCase()))
  const nameLetters = getLettersInName(name)

  return nameLetters.filter(letter => chosenSet.has(letter)).length
}

/**
 * Get available substitution options for a letter
 * Vowels can only be swapped for vowels, consonants for consonants
 */
export function getSubstitutionOptions(
  currentLetter: string,
  chosenLetters: string[]
): string[] {
  const chosenSet = new Set(chosenLetters.map(l => l.toUpperCase()))
  const pool = isVowel(currentLetter) ? VOWELS : CONSONANTS

  return pool.filter(letter => !chosenSet.has(letter))
}
