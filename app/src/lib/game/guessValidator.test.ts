import { describe, it, expect } from 'vitest'
import { validateGuess, getWrongGuessMessage } from './guessValidator'

describe('validateGuess', () => {
  describe('exact matches', () => {
    it('accepts exact full name match', () => {
      const result = validateGuess('ERLING HAALAND', 'ERLING HAALAND', 'Erling Haaland')
      expect(result.correct).toBe(true)
      expect(result.exactMatch).toBe(true)
      expect(result.message).toContain('Perfect')
    })

    it('accepts case-insensitive full name match', () => {
      const result = validateGuess('erling haaland', 'ERLING HAALAND', 'Erling Haaland')
      expect(result.correct).toBe(true)
    })

    it('accepts exact surname match', () => {
      const result = validateGuess('HAALAND', 'ERLING HAALAND', 'Erling Haaland')
      expect(result.correct).toBe(true)
      expect(result.exactMatch).toBe(true)
    })
  })

  describe('close matches', () => {
    it('accepts close surname match (typo)', () => {
      const result = validateGuess('HALLAND', 'ERLING HAALAND', 'Erling Haaland')
      expect(result.correct).toBe(true)
      expect(result.message).toContain('shot on target')
    })

    it('accepts same consonant structure', () => {
      const result = validateGuess('HALAND', 'ERLING HAALAND', 'Erling Haaland')
      expect(result.correct).toBe(true)
    })
  })

  describe('wrong guesses', () => {
    it('rejects completely wrong names', () => {
      const result = validateGuess('MESSI', 'ERLING HAALAND', 'Erling Haaland')
      expect(result.correct).toBe(false)
    })

    it('handles empty guess', () => {
      const result = validateGuess('', 'ERLING HAALAND', 'Erling Haaland')
      expect(result.correct).toBe(false)
      expect(result.message).toContain('Please enter')
    })

    it('handles whitespace-only guess', () => {
      const result = validateGuess('   ', 'ERLING HAALAND', 'Erling Haaland')
      expect(result.correct).toBe(false)
    })
  })

  describe('hyphenated names', () => {
    it('handles hyphenated surnames correctly', () => {
      const result = validateGuess('ALEXANDER-ARNOLD', 'TRENT ALEXANDER-ARNOLD', 'Trent Alexander-Arnold')
      expect(result.correct).toBe(true)
    })

    it('matches hyphenated name without hyphen', () => {
      const result = validateGuess('ALEXANDER ARNOLD', 'TRENT ALEXANDER-ARNOLD', 'Trent Alexander-Arnold')
      expect(result.correct).toBe(true)
    })
  })
})

describe('getWrongGuessMessage', () => {
  it('returns warning for first wrong guess', () => {
    const result = getWrongGuessMessage(1)
    expect(result.type).toBe('warning')
    expect(result.message).toContain('warning')
  })

  it('returns booking for second wrong guess', () => {
    const result = getWrongGuessMessage(2)
    expect(result.type).toBe('booking')
    expect(result.message).toContain('booking')
  })

  it('returns red card for third wrong guess', () => {
    const result = getWrongGuessMessage(3)
    expect(result.type).toBe('red-card')
    expect(result.message).toContain('pitch')
  })
})
