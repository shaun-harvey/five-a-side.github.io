import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  or,
  runTransaction,
} from 'firebase/firestore'
import { db } from './config'
import type { Challenge, ChallengeStatus } from '../../types/multiplayer'

// ==================== PUBLIC PROFILE OPERATIONS ====================

export interface PublicProfile {
  id: string
  displayName: string
  photoURL?: string
}

/**
 * Create or update a user's public profile (used for challenges/tournaments)
 */
export async function updatePublicProfile(
  uid: string,
  displayName: string,
  photoURL?: string
): Promise<void> {
  const profileRef = doc(db, 'userProfiles', uid)
  await setDoc(profileRef, {
    displayName,
    photoURL: photoURL || null,
    updatedAt: serverTimestamp(),
  }, { merge: true })
}

/**
 * Search for users by display name (for challenging friends)
 */
export async function searchUsersByName(
  searchTerm: string,
  currentUserId: string,
  maxResults: number = 10
): Promise<PublicProfile[]> {
  const profilesRef = collection(db, 'userProfiles')

  // Firestore doesn't support full-text search, so we do a prefix match
  // For better search, consider Algolia or Firebase Extensions
  const q = query(
    profilesRef,
    where('displayName', '>=', searchTerm),
    where('displayName', '<=', searchTerm + '\uf8ff'),
    limit(maxResults)
  )

  const snapshot = await getDocs(q)

  return snapshot.docs
    .filter(doc => doc.id !== currentUserId) // Exclude self
    .map(doc => ({
      id: doc.id,
      displayName: doc.data().displayName,
      photoURL: doc.data().photoURL,
    }))
}

/**
 * Get a user's public profile by ID
 */
export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const profileRef = doc(db, 'userProfiles', uid)
  const snapshot = await getDoc(profileRef)

  if (!snapshot.exists()) return null

  return {
    id: uid,
    displayName: snapshot.data().displayName,
    photoURL: snapshot.data().photoURL,
  }
}

// ==================== CHALLENGE OPERATIONS ====================

/**
 * Generate a unique challenge invite code (e.g., "1V1-8K4M")
 */
function generateChallengeCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `1V1-${code}`
}

/**
 * Create a challenge link (no opponent specified yet)
 * Returns the challenge ID and invite code
 */
export async function createChallengeLink(
  challengerId: string,
  challengerName: string,
  challengerPhotoURL: string | undefined,
  deadlineHours: number = 72  // Longer deadline for link sharing
): Promise<{ challengeId: string; inviteCode: string }> {
  const challengesRef = collection(db, 'challenges')
  const challengeRef = doc(challengesRef)
  const inviteCode = generateChallengeCode()

  const deadline = Timestamp.fromDate(
    new Date(Date.now() + deadlineHours * 60 * 60 * 1000)
  )

  const challenge: Omit<Challenge, 'id'> = {
    challengerId,
    challengerName,
    challengerPhotoURL,
    opponentId: null,  // No opponent yet
    opponentName: null,
    opponentPhotoURL: undefined,
    inviteCode,

    challengerScore: null,
    challengerGameId: null,
    challengerCompletedAt: null,
    opponentScore: null,
    opponentGameId: null,
    opponentCompletedAt: null,

    status: 'pending',
    winnerId: null,
    winnerName: null,
    wentToPenalties: false,
    challengerPenaltyScore: null,
    opponentPenaltyScore: null,

    createdAt: Timestamp.now(),
    acceptedAt: null,
    deadline,
    completedAt: null,
  }

  await setDoc(challengeRef, challenge)
  return { challengeId: challengeRef.id, inviteCode }
}

/**
 * Find a challenge by invite code
 */
export async function findChallengeByCode(code: string): Promise<Challenge | null> {
  const challengesRef = collection(db, 'challenges')
  const q = query(
    challengesRef,
    where('inviteCode', '==', code.toUpperCase()),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Challenge
}

/**
 * Accept a challenge via invite code (sets the opponent)
 * Uses a transaction to prevent race conditions when multiple users try to accept
 */
export async function acceptChallengeByCode(
  code: string,
  opponentId: string,
  opponentName: string,
  opponentPhotoURL: string | undefined
): Promise<string> {
  // First find the challenge by code (outside transaction for efficiency)
  const challenge = await findChallengeByCode(code)

  if (!challenge) {
    throw new Error('Invalid challenge code')
  }

  if (challenge.challengerId === opponentId) {
    throw new Error("You can't accept your own challenge")
  }

  const challengeRef = doc(db, 'challenges', challenge.id)

  // Use transaction to prevent race conditions
  await runTransaction(db, async (transaction) => {
    const challengeDoc = await transaction.get(challengeRef)

    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found')
    }

    const currentChallenge = challengeDoc.data() as Omit<Challenge, 'id'>

    if (currentChallenge.status !== 'pending') {
      throw new Error('This challenge is no longer available')
    }

    if (currentChallenge.opponentId !== null) {
      throw new Error('This challenge has already been accepted')
    }

    const deadline = Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000)
    )

    transaction.update(challengeRef, {
      opponentId,
      opponentName,
      opponentPhotoURL,
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      deadline,
    })
  })

  return challenge.id
}

/**
 * Create a new challenge
 */
export async function createChallenge(
  challengerId: string,
  challengerName: string,
  challengerPhotoURL: string | undefined,
  opponentId: string,
  opponentName: string,
  opponentPhotoURL: string | undefined,
  deadlineHours: number = 24
): Promise<string> {
  const challengesRef = collection(db, 'challenges')
  const challengeRef = doc(challengesRef)

  const deadline = Timestamp.fromDate(
    new Date(Date.now() + deadlineHours * 60 * 60 * 1000)
  )

  const challenge: Omit<Challenge, 'id'> = {
    challengerId,
    challengerName,
    challengerPhotoURL,
    opponentId,
    opponentName,
    opponentPhotoURL,

    challengerScore: null,
    challengerGameId: null,
    challengerCompletedAt: null,
    opponentScore: null,
    opponentGameId: null,
    opponentCompletedAt: null,

    status: 'pending',
    winnerId: null,
    winnerName: null,
    wentToPenalties: false,
    challengerPenaltyScore: null,
    opponentPenaltyScore: null,

    createdAt: Timestamp.now(),
    acceptedAt: null,
    deadline,
    completedAt: null,
  }

  await setDoc(challengeRef, challenge)
  return challengeRef.id
}

/**
 * Accept a challenge
 */
export async function acceptChallenge(challengeId: string): Promise<void> {
  const challengeRef = doc(db, 'challenges', challengeId)

  // Set new deadline from acceptance time
  const deadline = Timestamp.fromDate(
    new Date(Date.now() + 24 * 60 * 60 * 1000)
  )

  await updateDoc(challengeRef, {
    status: 'accepted',
    acceptedAt: serverTimestamp(),
    deadline,
  })
}

/**
 * Decline a challenge
 */
export async function declineChallenge(challengeId: string): Promise<void> {
  const challengeRef = doc(db, 'challenges', challengeId)
  await updateDoc(challengeRef, {
    status: 'declined',
    completedAt: serverTimestamp(),
  })
}

/**
 * Submit a score for a challenge
 * Uses a transaction to prevent race conditions when both players submit at nearly the same time
 */
export async function submitChallengeScore(
  challengeId: string,
  playerId: string,
  score: number,
  gameId: string
): Promise<void> {
  const challengeRef = doc(db, 'challenges', challengeId)

  await runTransaction(db, async (transaction) => {
    const challengeDoc = await transaction.get(challengeRef)

    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found')
    }

    const challenge = { id: challengeDoc.id, ...challengeDoc.data() } as Challenge

    // Determine if this is the challenger or opponent
    const isChallenger = challenge.challengerId === playerId

    // Check if this player has already submitted
    if (isChallenger && challenge.challengerScore !== null) {
      return // Already submitted
    }
    if (!isChallenger && challenge.opponentScore !== null) {
      return // Already submitted
    }

    const updates: Record<string, unknown> = isChallenger
      ? {
          challengerScore: score,
          challengerGameId: gameId,
          challengerCompletedAt: serverTimestamp(),
        }
      : {
          opponentScore: score,
          opponentGameId: gameId,
          opponentCompletedAt: serverTimestamp(),
        }

    // Update status to in_progress if not already
    if (challenge.status === 'accepted') {
      updates.status = 'in_progress'
    }

    // Check if both players have submitted scores (including the one we're about to submit)
    const otherScore = isChallenger ? challenge.opponentScore : challenge.challengerScore
    if (otherScore !== null) {
      // Both scores are now in - determine winner
      const challengerScore = isChallenger ? score : challenge.challengerScore!
      const opponentScore = isChallenger ? challenge.opponentScore! : score

      let winnerId: string | null = null
      let winnerName: string | null = null
      let wentToPenalties = false

      if (challengerScore > opponentScore) {
        winnerId = challenge.challengerId
        winnerName = challenge.challengerName
      } else if (opponentScore > challengerScore) {
        winnerId = challenge.opponentId
        winnerName = challenge.opponentName
      } else {
        // Tie - needs penalty shootout
        wentToPenalties = true
        updates.wentToPenalties = true
        // Don't set status to completed - wait for penalty shootout
      }

      if (!wentToPenalties) {
        updates.status = 'completed'
        updates.winnerId = winnerId
        updates.winnerName = winnerName
        updates.completedAt = serverTimestamp()
      }
    }

    transaction.update(challengeRef, updates)
  })
}

/* DEPRECATED - Logic moved into submitChallengeScore transaction
async function determineChallengeWinner(
  challengeId: string,
  challenge: Challenge,
  challengerScore: number,
  opponentScore: number
): Promise<void> {
  const challengeRef = doc(db, 'challenges', challengeId)

  let winnerId: string | null = null
  let winnerName: string | null = null
  let wentToPenalties = false

  if (challengerScore > opponentScore) {
    winnerId = challenge.challengerId
    winnerName = challenge.challengerName
  } else if (opponentScore > challengerScore) {
    winnerId = challenge.opponentId
    winnerName = challenge.opponentName
  } else {
    // Tie - needs penalty shootout
    wentToPenalties = true
    await updateDoc(challengeRef, {
      status: 'in_progress',
      wentToPenalties: true,
    })
    return // Don't complete yet - wait for penalty shootout
  }

  await updateDoc(challengeRef, {
    status: 'completed',
    winnerId,
    winnerName,
    wentToPenalties,
    completedAt: serverTimestamp(),
  })
}
*/

/**
 * Submit penalty shootout score for a player
 * Uses a transaction to handle race conditions when both players submit
 */
export async function submitPenaltyScore(
  challengeId: string,
  playerId: string,
  penaltyScore: number
): Promise<{ completed: boolean; winner?: { id: string; name: string } }> {
  const challengeRef = doc(db, 'challenges', challengeId)

  return runTransaction(db, async (transaction) => {
    const challengeDoc = await transaction.get(challengeRef)

    if (!challengeDoc.exists()) {
      throw new Error('Challenge not found')
    }

    const challenge = { id: challengeDoc.id, ...challengeDoc.data() } as Challenge

    // Determine if this is the challenger or opponent
    const isChallenger = challenge.challengerId === playerId

    // Update the appropriate penalty score
    const updates: Record<string, unknown> = isChallenger
      ? { challengerPenaltyScore: penaltyScore }
      : { opponentPenaltyScore: penaltyScore }

    // Get the other player's penalty score (may have been set in this transaction read)
    const otherPenaltyScore = isChallenger
      ? challenge.opponentPenaltyScore
      : challenge.challengerPenaltyScore

    // Check if both players have now submitted penalty scores
    if (otherPenaltyScore !== null) {
      const challengerPenalty = isChallenger ? penaltyScore : otherPenaltyScore
      const opponentPenalty = isChallenger ? otherPenaltyScore : penaltyScore

      // Determine winner
      let winnerId: string
      let winnerName: string

      if (challengerPenalty > opponentPenalty) {
        winnerId = challenge.challengerId
        winnerName = challenge.challengerName
      } else if (opponentPenalty > challengerPenalty) {
        winnerId = challenge.opponentId!
        winnerName = challenge.opponentName!
      } else {
        // Still tied after penalties - sudden death would be needed
        // For now, give it to the player who submitted first (already in DB)
        winnerId = isChallenger ? challenge.opponentId! : challenge.challengerId
        winnerName = isChallenger ? challenge.opponentName! : challenge.challengerName
      }

      updates.status = 'completed'
      updates.winnerId = winnerId
      updates.winnerName = winnerName
      updates.penaltyResult = {
        challengerScore: challengerPenalty,
        opponentScore: opponentPenalty,
        totalRounds: 5,
        winnerId,
      }
      updates.completedAt = serverTimestamp()

      transaction.update(challengeRef, updates)
      return { completed: true, winner: { id: winnerId, name: winnerName } }
    }

    // Other player hasn't submitted yet
    transaction.update(challengeRef, updates)
    return { completed: false }
  })
}

/**
 * Complete a challenge with penalty shootout result
 * @deprecated Use submitPenaltyScore instead for proper race condition handling
 */
export async function completeChallengeWithPenalties(
  challengeId: string,
  winnerId: string,
  winnerName: string,
  penaltyResult: {
    challengerScore: number
    opponentScore: number
    totalRounds: number
  }
): Promise<void> {
  const challengeRef = doc(db, 'challenges', challengeId)

  await updateDoc(challengeRef, {
    status: 'completed',
    winnerId,
    winnerName,
    wentToPenalties: true,
    penaltyResult: {
      ...penaltyResult,
      winnerId,
    },
    completedAt: serverTimestamp(),
  })
}

/**
 * Cancel/delete a pending challenge (only challenger can do this)
 */
export async function cancelChallenge(challengeId: string): Promise<void> {
  const challengeRef = doc(db, 'challenges', challengeId)
  await deleteDoc(challengeRef)
}

/**
 * Get a challenge by ID
 */
export async function getChallengeById(challengeId: string): Promise<Challenge | null> {
  const challengeRef = doc(db, 'challenges', challengeId)
  const snapshot = await getDoc(challengeRef)

  if (!snapshot.exists()) return null

  return { id: snapshot.id, ...snapshot.data() } as Challenge
}

/**
 * Get all challenges for a user
 */
export async function getUserChallenges(
  userId: string,
  statusFilter?: ChallengeStatus[]
): Promise<Challenge[]> {
  const challengesRef = collection(db, 'challenges')

  // Query for challenges where user is challenger OR opponent
  const q = query(
    challengesRef,
    or(
      where('challengerId', '==', userId),
      where('opponentId', '==', userId)
    ),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  let challenges = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Challenge[]

  // Filter by status if provided
  if (statusFilter && statusFilter.length > 0) {
    challenges = challenges.filter(c => statusFilter.includes(c.status))
  }

  return challenges
}

/**
 * Get pending challenges for a user (received, not yet accepted)
 */
export async function getPendingChallenges(userId: string): Promise<Challenge[]> {
  const challengesRef = collection(db, 'challenges')

  const q = query(
    challengesRef,
    where('opponentId', '==', userId),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Challenge[]
}

/**
 * Get active challenges for a user (accepted or in_progress)
 */
export async function getActiveChallenges(userId: string): Promise<Challenge[]> {
  const challengesRef = collection(db, 'challenges')

  // Get all challenges and filter in memory (Firestore limitation with OR + array-contains-any)
  const q = query(
    challengesRef,
    or(
      where('challengerId', '==', userId),
      where('opponentId', '==', userId)
    ),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
    .filter(c => c.status === 'accepted' || c.status === 'in_progress')
}

/**
 * Get completed challenges for a user
 */
export async function getCompletedChallenges(
  userId: string,
  maxResults: number = 20
): Promise<Challenge[]> {
  const challengesRef = collection(db, 'challenges')

  const q = query(
    challengesRef,
    or(
      where('challengerId', '==', userId),
      where('opponentId', '==', userId)
    ),
    orderBy('completedAt', 'desc'),
    limit(maxResults)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as Challenge))
    .filter(c => c.status === 'completed' || c.status === 'declined' || c.status === 'expired')
}

/**
 * Subscribe to user's challenges in realtime
 */
export function subscribeToUserChallenges(
  userId: string,
  callback: (challenges: Challenge[]) => void
): () => void {
  const challengesRef = collection(db, 'challenges')

  // We need to set up two listeners due to OR query limitations
  const q = query(
    challengesRef,
    or(
      where('challengerId', '==', userId),
      where('opponentId', '==', userId)
    ),
    orderBy('createdAt', 'desc')
  )

  return onSnapshot(q, (snapshot) => {
    const challenges = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Challenge[]
    callback(challenges)
  })
}

/**
 * Subscribe to a specific challenge
 */
export function subscribeToChallenge(
  challengeId: string,
  callback: (challenge: Challenge | null) => void
): () => void {
  const challengeRef = doc(db, 'challenges', challengeId)

  return onSnapshot(challengeRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    callback({ id: snapshot.id, ...snapshot.data() } as Challenge)
  })
}

/**
 * Check for expired challenges and update their status
 * This should be called periodically or via Cloud Function
 */
export async function expireOldChallenges(userId: string): Promise<void> {
  const challenges = await getUserChallenges(userId, ['pending', 'accepted', 'in_progress'])
  const now = Timestamp.now()

  for (const challenge of challenges) {
    if (challenge.deadline.toMillis() < now.toMillis()) {
      const challengeRef = doc(db, 'challenges', challenge.id)

      // Determine who forfeited based on who hasn't submitted
      let winnerId: string | null = null
      let winnerName: string | null = null

      if (challenge.status === 'pending') {
        // Never accepted - just expire it
        await updateDoc(challengeRef, {
          status: 'expired',
          completedAt: serverTimestamp(),
        })
      } else {
        // Check who submitted
        if (challenge.challengerScore !== null && challenge.opponentScore === null) {
          // Opponent forfeited
          winnerId = challenge.challengerId
          winnerName = challenge.challengerName
        } else if (challenge.opponentScore !== null && challenge.challengerScore === null) {
          // Challenger forfeited
          winnerId = challenge.opponentId
          winnerName = challenge.opponentName
        }
        // If both or neither submitted, it's a draw/expired

        await updateDoc(challengeRef, {
          status: 'expired',
          winnerId,
          winnerName,
          completedAt: serverTimestamp(),
        })
      }
    }
  }
}

// ==================== STATS HELPERS ====================

/**
 * Get challenge stats for a user
 */
export async function getUserChallengeStats(userId: string): Promise<{
  sent: number
  received: number
  won: number
  lost: number
  pending: number
}> {
  const challenges = await getUserChallenges(userId)

  let sent = 0
  let received = 0
  let won = 0
  let lost = 0
  let pending = 0

  for (const challenge of challenges) {
    if (challenge.challengerId === userId) {
      sent++
    } else {
      received++
    }

    if (challenge.status === 'pending') {
      pending++
    } else if (challenge.status === 'completed') {
      if (challenge.winnerId === userId) {
        won++
      } else if (challenge.winnerId !== null) {
        lost++
      }
    }
  }

  return { sent, received, won, lost, pending }
}
