import { describe, it, expect } from 'vitest'
import { levenshteinDistance, stringSimilarity, isCloseMatch } from './levenshtein'

describe('levenshteinDistance', () => {
  it('returns 0 for identical strings', () => {
    expect(levenshteinDistance('hello', 'hello')).toBe(0)
    expect(levenshteinDistance('HAALAND', 'HAALAND')).toBe(0)
  })

  it('returns correct distance for single character difference', () => {
    expect(levenshteinDistance('cat', 'bat')).toBe(1)
    expect(levenshteinDistance('cat', 'cats')).toBe(1)
    expect(levenshteinDistance('cat', 'at')).toBe(1)
  })

  it('handles empty strings', () => {
    expect(levenshteinDistance('', '')).toBe(0)
    expect(levenshteinDistance('hello', '')).toBe(5)
    expect(levenshteinDistance('', 'hello')).toBe(5)
  })

  it('calculates correct distance for common typos', () => {
    expect(levenshteinDistance('HALLAND', 'HAALAND')).toBe(1)
    expect(levenshteinDistance('ROONEY', 'RONNEY')).toBe(1)
  })
})

describe('stringSimilarity', () => {
  it('returns 1 for identical strings', () => {
    expect(stringSimilarity('HAALAND', 'HAALAND')).toBe(1)
    expect(stringSimilarity('haaland', 'HAALAND')).toBe(1)
  })

  it('returns 1 for empty strings', () => {
    expect(stringSimilarity('', '')).toBe(1)
  })

  it('returns high similarity for close matches', () => {
    const similarity = stringSimilarity('HALLAND', 'HAALAND')
    expect(similarity).toBeGreaterThan(0.8)
  })

  it('returns low similarity for very different strings', () => {
    const similarity = stringSimilarity('SMITH', 'JONES')
    expect(similarity).toBeLessThan(0.5)
  })

  it('ignores spaces in comparison', () => {
    expect(stringSimilarity('DE BRUYNE', 'DEBRUYNE')).toBe(1)
  })
})

describe('isCloseMatch', () => {
  it('returns true for exact matches', () => {
    expect(isCloseMatch('HAALAND', 'HAALAND')).toBe(true)
  })

  it('returns true for close matches above threshold', () => {
    expect(isCloseMatch('HALLAND', 'HAALAND')).toBe(true)
  })

  it('returns false for very different strings', () => {
    expect(isCloseMatch('SMITH', 'JONES')).toBe(false)
  })

  it('respects custom threshold', () => {
    expect(isCloseMatch('HALLAND', 'HAALAND', 0.9)).toBe(false)
    expect(isCloseMatch('HALLAND', 'HAALAND', 0.7)).toBe(true)
  })
})
