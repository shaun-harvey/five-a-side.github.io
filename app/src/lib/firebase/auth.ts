import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  deleteUser as firebaseDeleteUser,
  type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, getDocFromServer, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'
import { deleteAllUserData, clearAppCache } from './firestore'
import { deleteUserAvatar } from './storage'
import type { UserProfile, UserStats, RecentlyUsedPlayers } from '../../types/user'

const googleProvider = new GoogleAuthProvider()

// Default stats for new users
const defaultStats: UserStats = {
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
}

const defaultRecentlyUsed: RecentlyUsedPlayers = {
  1: [],
  2: [],
  3: [],
}

/**
 * Create a user profile in Firestore
 */
async function createUserProfile(
  user: User,
  authProvider: 'email' | 'google'
): Promise<void> {
  const userRef = doc(db, 'users', user.uid)
  const userSnap = await getDoc(userRef)

  if (!userSnap.exists()) {
    const profile: Omit<UserProfile, 'createdAt' | 'lastLoginAt'> & {
      createdAt: ReturnType<typeof serverTimestamp>
      lastLoginAt: ReturnType<typeof serverTimestamp>
    } = {
      uid: user.uid,
      displayName: user.displayName || 'Player',
      email: user.email || '',
      authProvider,
      photoURL: user.photoURL || undefined,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      stats: defaultStats,
      recentlyUsed: defaultRecentlyUsed,
      gamesSinceReset: 0,
    }

    await setDoc(userRef, profile)
  } else {
    // Update last login and photo URL (in case it changed or wasn't set before)
    const updates: Record<string, unknown> = { lastLoginAt: serverTimestamp() }
    if (user.photoURL) {
      updates.photoURL = user.photoURL
    }
    await setDoc(userRef, updates, { merge: true })
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, email, password)

  // Update display name
  await updateProfile(user, { displayName })

  // Create Firestore profile
  await createUserProfile(user, 'email')

  return user
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<User> {
  // Clear cache before signing in to ensure fresh data
  clearAppCache()
  const { user } = await signInWithEmailAndPassword(auth, email, password)
  await createUserProfile(user, 'email')
  return user
}

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User | null> {
  // Clear cache before signing in to ensure fresh data
  clearAppCache()
  try {
    const { user } = await signInWithPopup(auth, googleProvider)
    await createUserProfile(user, 'google')
    return user
  } catch (error: unknown) {
    // User closed the popup - not an error, just return null
    if (error && typeof error === 'object' && 'code' in error && error.code === 'auth/popup-closed-by-user') {
      return null
    }
    throw error
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  await firebaseSignOut(auth)
  // Clear cache on sign out to ensure fresh state for next user
  clearAppCache()
}

/**
 * Get the current user
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

/**
 * Get user profile from Firestore (fresh from server)
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid)
  try {
    // Always fetch fresh from server to avoid stale cached data
    const userSnap = await getDocFromServer(userRef)
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile
    }
    return null
  } catch (error) {
    // Fall back to cache if offline
    console.warn('Failed to fetch fresh profile, using cache:', error)
    const userSnap = await getDoc(userRef)
    if (userSnap.exists()) {
      return userSnap.data() as UserProfile
    }
    return null
  }
}

/**
 * Delete user account and all associated data
 */
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser
  if (!user) {
    throw new Error('No user logged in')
  }

  const uid = user.uid

  // Delete all user data from Firestore (profile, game history, leaderboard entries)
  await deleteAllUserData(uid)

  // Delete avatar from storage (if exists)
  try {
    await deleteUserAvatar(uid)
  } catch {
    // Avatar might not exist, that's ok
  }

  // Finally, delete the Firebase Auth user
  await firebaseDeleteUser(user)
}
