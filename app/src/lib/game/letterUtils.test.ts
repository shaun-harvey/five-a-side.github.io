import { describe, it, expect } from 'vitest'
import {
  isVowel,
  isConsonant,
  getLettersInName,
  getUniqueLettersInName,
  canDisplayWithLetters,
  getRevealedLetters,
  createDisplayName,
  countRevealedLetters,
  getSubstitutionOptions,
} from './letterUtils'

describe('isVowel', () => {
  it('returns true for vowels', () => {
    expect(isVowel('A')).toBe(true)
    expect(isVowel('E')).toBe(true)
    expect(isVowel('I')).toBe(true)
    expect(isVowel('O')).toBe(true)
    expect(isVowel('U')).toBe(true)
  })

  it('returns true for lowercase vowels', () => {
    expect(isVowel('a')).toBe(true)
    expect(isVowel('e')).toBe(true)
  })

  it('returns false for consonants', () => {
    expect(isVowel('B')).toBe(false)
    expect(isVowel('C')).toBe(false)
    expect(isVowel('Z')).toBe(false)
  })
})

describe('isConsonant', () => {
  it('returns true for consonants', () => {
    expect(isConsonant('B')).toBe(true)
    expect(isConsonant('C')).toBe(true)
    expect(isConsonant('Z')).toBe(true)
  })

  it('returns true for lowercase consonants', () => {
    expect(isConsonant('b')).toBe(true)
    expect(isConsonant('z')).toBe(true)
  })

  it('returns false for vowels', () => {
    expect(isConsonant('A')).toBe(false)
    expect(isConsonant('E')).toBe(false)
  })
})

describe('getLettersInName', () => {
  it('returns uppercase letters only', () => {
    expect(getLettersInName('Haaland')).toEqual(['H', 'A', 'A', 'L', 'A', 'N', 'D'])
  })

  it('removes spaces', () => {
    expect(getLettersInName('Erling Haaland')).toEqual([
      'E', 'R', 'L', 'I', 'N', 'G', 'H', 'A', 'A', 'L', 'A', 'N', 'D'
    ])
  })

  it('removes non-letter characters', () => {
    expect(getLettersInName('O\'Brien')).toEqual(['O', 'B', 'R', 'I', 'E', 'N'])
    expect(getLettersInName('Alexander-Arnold')).toEqual([
      'A', 'L', 'E', 'X', 'A', 'N', 'D', 'E', 'R', 'A', 'R', 'N', 'O', 'L', 'D'
    ])
  })

  it('handles empty string', () => {
    expect(getLettersInName('')).toEqual([])
  })
})

describe('getUniqueLettersInName', () => {
  it('returns unique letters only', () => {
    const result = getUniqueLettersInName('Haaland')
    expect(result).toContain('H')
    expect(result).toContain('A')
    expect(result).toContain('L')
    expect(result).toContain('N')
    expect(result).toContain('D')
    expect(result.length).toBe(5)
  })

  it('handles names with many duplicates', () => {
    const result = getUniqueLettersInName('ANNA')
    expect(result.sort()).toEqual(['A', 'N'])
  })
})

describe('canDisplayWithLetters', () => {
  it('returns true when all letters are available', () => {
    expect(canDisplayWithLetters('CAT', ['C', 'A', 'T'])).toBe(true)
    expect(canDisplayWithLetters('CAT', ['A', 'B', 'C', 'T', 'E'])).toBe(true)
  })

  it('returns false when letters are missing', () => {
    expect(canDisplayWithLetters('CAT', ['C', 'A'])).toBe(false)
    expect(canDisplayWithLetters('CAT', ['X', 'Y', 'Z'])).toBe(false)
  })

  it('handles case insensitivity', () => {
    expect(canDisplayWithLetters('cat', ['C', 'A', 'T'])).toBe(true)
    expect(canDisplayWithLetters('CAT', ['c', 'a', 't'])).toBe(true)
  })
})

describe('getRevealedLetters', () => {
  it('shows chosen letters and underscores for hidden', () => {
    const result = getRevealedLetters('HAALAND', ['A', 'L'])
    expect(result).toEqual(['_', 'A', 'A', 'L', 'A', '_', '_'])
  })

  it('preserves spaces', () => {
    const result = getRevealedLetters('ERLING HAALAND', ['E', 'A'])
    expect(result[6]).toBe(' ')
  })

  it('handles case insensitivity', () => {
    const result = getRevealedLetters('Cat', ['c', 'a', 't'])
    expect(result).toEqual(['C', 'A', 'T'])
  })

  it('returns all underscores when no letters match', () => {
    const result = getRevealedLetters('CAT', ['X', 'Y', 'Z'])
    expect(result).toEqual(['_', '_', '_'])
  })
})

describe('createDisplayName', () => {
  it('creates display string with revealed letters', () => {
    // HAALAND = 7 letters, A at positions 2,3,5, L at position 4
    expect(createDisplayName('HAALAND', ['A', 'L'])).toBe('_AALA__')
  })

  it('shows full name when all letters chosen', () => {
    expect(createDisplayName('CAT', ['C', 'A', 'T'])).toBe('CAT')
  })

  it('shows all underscores when no matches', () => {
    expect(createDisplayName('CAT', ['X'])).toBe('___')
  })
})

describe('countRevealedLetters', () => {
  it('counts matching letters correctly', () => {
    expect(countRevealedLetters('HAALAND', ['A'])).toBe(3)
    expect(countRevealedLetters('HAALAND', ['A', 'L'])).toBe(4)
    expect(countRevealedLetters('HAALAND', ['H', 'A', 'L', 'N', 'D'])).toBe(7)
  })

  it('returns 0 when no matches', () => {
    expect(countRevealedLetters('CAT', ['X', 'Y', 'Z'])).toBe(0)
  })

  it('handles empty chosen letters', () => {
    expect(countRevealedLetters('HAALAND', [])).toBe(0)
  })
})

describe('getSubstitutionOptions', () => {
  it('returns vowels for vowel substitution', () => {
    const options = getSubstitutionOptions('A', ['A', 'E', 'B', 'C'])
    expect(options).toContain('I')
    expect(options).toContain('O')
    expect(options).toContain('U')
    expect(options).not.toContain('A')
    expect(options).not.toContain('E')
    expect(options).not.toContain('B')
  })

  it('returns consonants for consonant substitution', () => {
    const options = getSubstitutionOptions('B', ['A', 'E', 'B', 'C'])
    expect(options).not.toContain('B')
    expect(options).not.toContain('C')
    expect(options).not.toContain('A')
    expect(options).toContain('D')
    expect(options).toContain('F')
  })

  it('excludes already chosen letters', () => {
    const options = getSubstitutionOptions('A', ['A', 'E', 'I', 'O', 'U'])
    expect(options.length).toBe(0)
  })

  it('handles case insensitivity', () => {
    const options = getSubstitutionOptions('a', ['a', 'e'])
    expect(options).not.toContain('A')
    expect(options).not.toContain('E')
    expect(options).toContain('I')
  })
})
