/**
 * Calculate the Levenshtein distance between two strings
 * This measures how many single-character edits (insertions, deletions, substitutions)
 * are needed to change one string into another
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  // Create a matrix of size (m+1) x (n+1)
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Initialize first column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i
  }

  // Initialize first row
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j
  }

  // Fill the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate the similarity between two strings (0 to 1)
 * 1 = identical, 0 = completely different
 */
export function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toUpperCase().replace(/\s+/g, '')
  const s2 = str2.toUpperCase().replace(/\s+/g, '')

  if (s1 === s2) return 1

  const maxLength = Math.max(s1.length, s2.length)
  if (maxLength === 0) return 1

  const distance = levenshteinDistance(s1, s2)
  return 1 - distance / maxLength
}

/**
 * Check if a guess is "close enough" to the answer
 * Used for the "Shot on Target" feature
 */
export function isCloseMatch(guess: string, answer: string, threshold = 0.7): boolean {
  return stringSimilarity(guess, answer) >= threshold
}
