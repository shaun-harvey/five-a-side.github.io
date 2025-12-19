import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore'
import { db } from './config'
import type { Player, PlayerCategory } from '../../types/player'
import type { UserProfile, UserStats, LeaderboardEntry, GameRecord } from '../../types/user'

// ==================== PLAYER OPERATIONS ====================

/**
 * Fetch all players by category
 */
export async function getPlayersByCategory(
  category: PlayerCategory
): Promise<Player[]> {
  const playersRef = collection(db, 'players')
  const q = query(
    playersRef,
    where('category', '==', category),
    where('isActive', '==', true)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Player[]
}

/**
 * Fetch all active players
 */
export async function getAllPlayers(): Promise<{
  modern: Player[]
  legend: Player[]
  obscure: Player[]
}> {
  const [modern, legend, obscure] = await Promise.all([
    getPlayersByCategory('modern'),
    getPlayersByCategory('legend'),
    getPlayersByCategory('obscure'),
  ])

  return { modern, legend, obscure }
}

/**
 * Seed players to Firestore (used for initial setup)
 */
export async function seedPlayers(players: {
  modern: Array<{ name: string; hint: string }>
  legend: Array<{ name: string; hint: string }>
  obscure: Array<{ name: string; hint: string }>
}): Promise<void> {
  const batch = writeBatch(db)

  const addPlayersToCategory = (
    categoryPlayers: Array<{ name: string; hint: string }>,
    category: PlayerCategory
  ) => {
    categoryPlayers.forEach((player) => {
      // Create a document ID from the player name
      const docId = player.name.toLowerCase().replace(/\s+/g, '-')
      const playerRef = doc(db, 'players', docId)

      batch.set(playerRef, {
        name: player.name,
        hint: player.hint,
        category,
        isActive: true,
        createdAt: serverTimestamp(),
      })
    })
  }

  addPlayersToCategory(players.modern, 'modern')
  addPlayersToCategory(players.legend, 'legend')
  addPlayersToCategory(players.obscure, 'obscure')

  await batch.commit()
}

// ==================== USER OPERATIONS ====================

/**
 * Create a new user profile with comprehensive stats tracking
 */
export async function createUserProfile(
  uid: string,
  data: {
    displayName: string
    email: string
    authProvider: 'email' | 'google'
    photoURL?: string
  }
): Promise<UserProfile> {
  const userRef = doc(db, 'users', uid)

  const newProfile: Omit<UserProfile, 'uid'> = {
    displayName: data.displayName,
    email: data.email,
    authProvider: data.authProvider,
    photoURL: data.photoURL,
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
    stats: {
      // Core game stats
      totalGamesPlayed: 0,
      highestScore: 0,
      averageScore: 0,
      totalCorrectGuesses: 0,
      totalWrongGuesses: 0,
      accuracy: 0,

      // Action usage stats
      totalPassesUsed: 0,
      totalSubstitutionsUsed: 0,
      totalVARHintsUsed: 0,

      // Streak tracking
      longestCorrectStreak: 0,
      currentStreak: 0,

      // Game completion breakdown
      gamesCompletedFully: 0,
      gamesEndedByStrikes: 0,
      gamesEndedByCheating: 0,

      // Time stats
      totalPlayTimeSeconds: 0,
      averageGameDurationSeconds: 0,

      // Round-specific performance
      round1TotalScore: 0,
      round2TotalScore: 0,
      round3TotalScore: 0,
      round1GamesPlayed: 0,
      round2GamesPlayed: 0,
      round3GamesPlayed: 0,
    },
    recentlyUsed: {
      1: [],
      2: [],
      3: [],
    },
    gamesSinceReset: 0,
  }

  await setDoc(userRef, newProfile)

  return { uid, ...newProfile }
}

/**
 * Get user profile by UID
 */
export async function getUserProfileById(
  uid: string
): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    return null
  }

  return { uid, ...snapshot.data() } as UserProfile
}

/**
 * Get user profile fresh from server (bypasses Firestore cache)
 * Use this on sign in to ensure fresh data
 */
export async function getUserProfileFresh(
  uid: string
): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid)
  try {
    const snapshot = await getDocFromServer(userRef)
    if (!snapshot.exists()) {
      return null
    }
    return { uid, ...snapshot.data() } as UserProfile
  } catch (error) {
    // Fall back to cached if offline
    console.warn('Failed to fetch fresh profile, using cache:', error)
    return getUserProfileById(uid)
  }
}

/**
 * Clear app cache (localStorage items)
 * Call this on sign in/out to ensure fresh state
 */
export function clearAppCache(): void {
  // Clear any app-specific localStorage items
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && (
      key.startsWith('five-a-side') ||
      key.startsWith('firebaseLocalStorage')
    )) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))
}

/**
 * Subscribe to user profile changes in realtime
 * Returns an unsubscribe function
 */
export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void
): () => void {
  const userRef = doc(db, 'users', uid)

  return onSnapshot(userRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    callback({ uid, ...snapshot.data() } as UserProfile)
  })
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, {
    lastLoginAt: serverTimestamp(),
  })
}

/**
 * Update user stats after a game - comprehensive tracking
 */
export async function updateUserStats(
  uid: string,
  gameStats: {
    score: number
    correctGuesses: number
    wrongGuesses: number
    passesUsed: number
    substitutionsUsed: number
    varHintsUsed: number
    endReason: 'completed' | 'three-strikes' | 'cheating'
    roundReached: 1 | 2 | 3
    durationSeconds: number
    longestStreakInGame: number
    round1Score?: number
    round2Score?: number
    round3Score?: number
  }
): Promise<void> {
  const userRef = doc(db, 'users', uid)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) return

  const currentStats = userDoc.data().stats as UserStats
  const newTotalGames = currentStats.totalGamesPlayed + 1
  const newTotalCorrect = currentStats.totalCorrectGuesses + gameStats.correctGuesses
  const newTotalWrong = currentStats.totalWrongGuesses + gameStats.wrongGuesses
  const totalGuesses = newTotalCorrect + newTotalWrong

  // Calculate new average score
  const newAverage =
    (currentStats.averageScore * currentStats.totalGamesPlayed + gameStats.score) /
    newTotalGames

  // Calculate new average game duration
  const newTotalPlayTime = currentStats.totalPlayTimeSeconds + gameStats.durationSeconds
  const newAverageDuration = newTotalPlayTime / newTotalGames

  // Build the update object
  const updates: Record<string, unknown> = {
    // Core stats
    'stats.totalGamesPlayed': increment(1),
    'stats.totalCorrectGuesses': increment(gameStats.correctGuesses),
    'stats.totalWrongGuesses': increment(gameStats.wrongGuesses),
    'stats.highestScore': Math.max(currentStats.highestScore, gameStats.score),
    'stats.averageScore': Math.round(newAverage * 10) / 10,
    'stats.accuracy': totalGuesses > 0 ? Math.round((newTotalCorrect / totalGuesses) * 100) : 0,

    // Action usage
    'stats.totalPassesUsed': increment(gameStats.passesUsed),
    'stats.totalSubstitutionsUsed': increment(gameStats.substitutionsUsed),
    'stats.totalVARHintsUsed': increment(gameStats.varHintsUsed),

    // Streak tracking
    'stats.longestCorrectStreak': Math.max(currentStats.longestCorrectStreak, gameStats.longestStreakInGame),

    // Time stats
    'stats.totalPlayTimeSeconds': increment(gameStats.durationSeconds),
    'stats.averageGameDurationSeconds': Math.round(newAverageDuration),
  }

  // Game completion breakdown
  if (gameStats.endReason === 'completed') {
    updates['stats.gamesCompletedFully'] = increment(1)
  } else if (gameStats.endReason === 'three-strikes') {
    updates['stats.gamesEndedByStrikes'] = increment(1)
  } else if (gameStats.endReason === 'cheating') {
    updates['stats.gamesEndedByCheating'] = increment(1)
  }

  // Round-specific scores
  if (gameStats.round1Score !== undefined) {
    updates['stats.round1TotalScore'] = increment(gameStats.round1Score)
    updates['stats.round1GamesPlayed'] = increment(1)
  }
  if (gameStats.round2Score !== undefined && gameStats.roundReached >= 2) {
    updates['stats.round2TotalScore'] = increment(gameStats.round2Score)
    updates['stats.round2GamesPlayed'] = increment(1)
  }
  if (gameStats.round3Score !== undefined && gameStats.roundReached >= 3) {
    updates['stats.round3TotalScore'] = increment(gameStats.round3Score)
    updates['stats.round3GamesPlayed'] = increment(1)
  }

  await updateDoc(userRef, updates)
}

/**
 * Update recently used players (to avoid showing same players)
 */
export async function updateRecentlyUsedPlayers(
  uid: string,
  round: 1 | 2 | 3,
  playerNames: string[]
): Promise<void> {
  const userRef = doc(db, 'users', uid)
  const userDoc = await getDoc(userRef)

  if (!userDoc.exists()) return

  const currentData = userDoc.data()
  const gamesSinceReset = currentData.gamesSinceReset + 1

  if (gamesSinceReset >= 6) {
    // Reset all recently used after 6 games
    await updateDoc(userRef, {
      'recentlyUsed.1': [],
      'recentlyUsed.2': [],
      'recentlyUsed.3': [],
      gamesSinceReset: 0,
    })
  } else {
    // Add to recently used
    const currentRecentlyUsed = currentData.recentlyUsed[round] || []
    const updatedRecentlyUsed = [...new Set([...currentRecentlyUsed, ...playerNames])]

    await updateDoc(userRef, {
      [`recentlyUsed.${round}`]: updatedRecentlyUsed,
      gamesSinceReset,
    })
  }
}

// ==================== LEADERBOARD OPERATIONS ====================

/**
 * Submit a score to the leaderboard
 */
export async function submitScore(
  uid: string,
  displayName: string,
  score: number,
  photoURL?: string
): Promise<void> {
  // Check if this is a new high score for the user
  const userRef = doc(db, 'users', uid)
  const userDoc = await getDoc(userRef)

  if (userDoc.exists()) {
    const currentHighScore = userDoc.data().stats?.highestScore || 0
    if (score <= currentHighScore) {
      // Not a new high score, don't add to leaderboard
      return
    }
  }

  const leaderboardRef = collection(db, 'leaderboard')
  const entryRef = doc(leaderboardRef, `${uid}-${Date.now()}`)

  await setDoc(entryRef, {
    userId: uid,
    displayName,
    photoURL: photoURL || null,
    score,
    achievedAt: serverTimestamp(),
    period: 'all-time',
  })
}

/**
 * Get top scores from leaderboard
 * Fetches user profiles to get current avatars
 */
export async function getTopScores(count: number = 10): Promise<LeaderboardEntry[]> {
  const leaderboardRef = collection(db, 'leaderboard')
  const q = query(
    leaderboardRef,
    where('period', '==', 'all-time'),
    orderBy('score', 'desc'),
    limit(count)
  )

  const snapshot = await getDocs(q)
  const entries = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  })) as LeaderboardEntry[]

  // Fetch user profiles to get current avatars
  const userIds = [...new Set(entries.map(e => e.userId))]
  const photoURLMap = new Map<string, string | undefined>()

  await Promise.all(
    userIds.map(async (uid) => {
      const userRef = doc(db, 'users', uid)
      const userDoc = await getDoc(userRef)
      if (userDoc.exists()) {
        const data = userDoc.data()
        photoURLMap.set(uid, data.photoURL as string | undefined)
      }
    })
  )

  // Add photoURL to entries from user profiles
  return entries.map(entry => ({
    ...entry,
    photoURL: entry.photoURL || photoURLMap.get(entry.userId),
  }))
}

/**
 * Get user's best scores
 */
export async function getUserBestScores(
  uid: string,
  count: number = 5
): Promise<LeaderboardEntry[]> {
  const leaderboardRef = collection(db, 'leaderboard')
  const q = query(
    leaderboardRef,
    where('userId', '==', uid),
    orderBy('score', 'desc'),
    limit(count)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as LeaderboardEntry[]
}

/**
 * Get user's rank on leaderboard
 */
export async function getUserRank(_uid: string, score: number): Promise<number> {
  const leaderboardRef = collection(db, 'leaderboard')
  const q = query(
    leaderboardRef,
    where('period', '==', 'all-time'),
    where('score', '>', score)
  )

  const snapshot = await getDocs(q)
  return snapshot.size + 1
}

// ==================== GAME HISTORY OPERATIONS ====================

/**
 * Save a comprehensive game record with per-round details
 */
export async function saveGameRecord(
  uid: string,
  gameData: Omit<GameRecord, 'playedAt'>
): Promise<void> {
  const gamesRef = collection(db, 'users', uid, 'games')
  const gameRef = doc(gamesRef)

  await setDoc(gameRef, {
    ...gameData,
    playedAt: serverTimestamp(),
  })
}

/**
 * Get user's recent games
 */
export async function getRecentGames(
  uid: string,
  count: number = 10
): Promise<GameRecord[]> {
  const gamesRef = collection(db, 'users', uid, 'games')
  const q = query(gamesRef, orderBy('playedAt', 'desc'), limit(count))

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data()) as GameRecord[]
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  uid: string,
  data: Partial<Pick<UserProfile, 'displayName' | 'photoURL' | 'selectedLeague'>>
): Promise<void> {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, data)
}

/**
 * Update user's selected league
 */
export async function updateUserSelectedLeague(
  uid: string,
  leagueId: UserProfile['selectedLeague']
): Promise<void> {
  const userRef = doc(db, 'users', uid)
  await updateDoc(userRef, { selectedLeague: leagueId })
}

// ==================== DELETE OPERATIONS ====================

/**
 * Delete a user's leaderboard entries
 */
export async function deleteUserLeaderboardEntries(uid: string): Promise<void> {
  const leaderboardRef = collection(db, 'leaderboard')
  const q = query(leaderboardRef, where('userId', '==', uid))

  const snapshot = await getDocs(q)
  const batch = writeBatch(db)

  snapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref)
  })

  await batch.commit()
}

/**
 * Delete a user's game history
 */
export async function deleteUserGameHistory(uid: string): Promise<void> {
  const gamesRef = collection(db, 'users', uid, 'games')
  const snapshot = await getDocs(gamesRef)

  const batch = writeBatch(db)

  snapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref)
  })

  await batch.commit()
}

/**
 * Delete user profile
 */
export async function deleteUserProfile(uid: string): Promise<void> {
  const userRef = doc(db, 'users', uid)
  await deleteDoc(userRef)
}

/**
 * Delete all user data (profile, games, leaderboard entries)
 * Call this when a user wants to delete their account
 */
export async function deleteAllUserData(uid: string): Promise<void> {
  // Delete in order: subcollections first, then related data, then profile
  await deleteUserGameHistory(uid)
  await deleteUserLeaderboardEntries(uid)
  await deleteUserProfile(uid)
}

// Alias for getTopScores
export const getLeaderboard = getTopScores
