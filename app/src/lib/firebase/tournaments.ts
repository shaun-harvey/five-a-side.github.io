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
  writeBatch,
  runTransaction,
} from 'firebase/firestore'
// arrayUnion removed - not used with transactions
import { db } from './config'
import type {
  Tournament,
  TournamentParticipant,
  TournamentMatch,
  TournamentType,
  KnockoutBracket,
  KnockoutRound,
  KnockoutMatch,
  LeagueStanding,
} from '../../types/multiplayer'

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a unique tournament code (e.g., "TRN-8K4M")
 */
function generateTournamentCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars (0,O,1,I)
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `TRN-${code}`
}

/**
 * Get round name based on total players and round number
 */
function getRoundName(totalPlayers: number, roundNumber: number): string {
  const totalRounds = Math.log2(totalPlayers)
  const roundFromEnd = totalRounds - roundNumber + 1

  switch (roundFromEnd) {
    case 1: return 'Final'
    case 2: return 'Semi-Finals'
    case 3: return 'Quarter-Finals'
    case 4: return 'Round of 16'
    case 5: return 'Round of 32'
    default: return `Round ${roundNumber}`
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Generate knockout bracket structure
 */
function generateKnockoutBracket(
  participants: TournamentParticipant[],
  matchDeadlineHours: number
): { bracket: KnockoutBracket; matches: Omit<TournamentMatch, 'id'>[] } {
  const shuffled = shuffleArray(participants)
  const totalRounds = Math.log2(shuffled.length)
  const rounds: KnockoutRound[] = []
  const matches: Omit<TournamentMatch, 'id'>[] = []

  // Create first round with actual participants
  const firstRoundMatches: KnockoutMatch[] = []
  for (let i = 0; i < shuffled.length; i += 2) {
    const matchId = `r1-m${Math.floor(i / 2) + 1}`
    const deadline = Timestamp.fromDate(
      new Date(Date.now() + matchDeadlineHours * 60 * 60 * 1000)
    )

    firstRoundMatches.push({
      id: matchId,
      position: Math.floor(i / 2),
      player1Id: shuffled[i].id,
      player1Name: shuffled[i].displayName,
      player2Id: shuffled[i + 1].id,
      player2Name: shuffled[i + 1].displayName,
      player1Score: null,
      player2Score: null,
      winnerId: null,
      status: 'pending',
      wentToPenalties: false,
      deadline,
      completedAt: null,
    })

    // Also create match documents
    matches.push({
      tournamentId: '', // Will be set when creating
      round: 1,
      position: Math.floor(i / 2),
      player1Id: shuffled[i].id,
      player1Name: shuffled[i].displayName,
      player2Id: shuffled[i + 1].id,
      player2Name: shuffled[i + 1].displayName,
      player1Score: null,
      player1GameId: null,
      player1CompletedAt: null,
      player2Score: null,
      player2GameId: null,
      player2CompletedAt: null,
      status: 'pending',
      winnerId: null,
      forfeitedBy: null,
      wentToPenalties: false,
      deadline,
      createdAt: Timestamp.now(),
      completedAt: null,
    })
  }

  rounds.push({
    roundNumber: 1,
    roundName: getRoundName(shuffled.length, 1),
    matches: firstRoundMatches,
  })

  // Create subsequent rounds with TBD placeholders
  let matchesInRound = shuffled.length / 4
  for (let round = 2; round <= totalRounds; round++) {
    const roundMatches: KnockoutMatch[] = []
    for (let i = 0; i < matchesInRound; i++) {
      roundMatches.push({
        id: `r${round}-m${i + 1}`,
        position: i,
        player1Id: null,
        player1Name: null,
        player2Id: null,
        player2Name: null,
        player1Score: null,
        player2Score: null,
        winnerId: null,
        status: 'pending',
        wentToPenalties: false,
        deadline: null,
        completedAt: null,
      })
    }
    rounds.push({
      roundNumber: round,
      roundName: getRoundName(shuffled.length, round),
      matches: roundMatches,
    })
    matchesInRound /= 2
  }

  return { bracket: { rounds }, matches }
}

/**
 * Generate league fixtures (round-robin)
 */
function generateLeagueFixtures(
  participants: TournamentParticipant[],
  tournamentId: string,
  matchDeadlineHours: number
): Omit<TournamentMatch, 'id'>[] {
  const matches: Omit<TournamentMatch, 'id'>[] = []
  const n = participants.length

  // Round-robin: each team plays every other team once
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const deadline = Timestamp.fromDate(
        new Date(Date.now() + matchDeadlineHours * 60 * 60 * 1000)
      )

      matches.push({
        tournamentId,
        round: 1, // All matches are "round 1" in league format
        position: matches.length,
        player1Id: participants[i].id,
        player1Name: participants[i].displayName,
        player2Id: participants[j].id,
        player2Name: participants[j].displayName,
        player1Score: null,
        player1GameId: null,
        player1CompletedAt: null,
        player2Score: null,
        player2GameId: null,
        player2CompletedAt: null,
        status: 'pending',
        winnerId: null,
        forfeitedBy: null,
        wentToPenalties: false,
        deadline,
        createdAt: Timestamp.now(),
        completedAt: null,
      })
    }
  }

  return matches
}

/**
 * Initialize league standings
 */
function initializeLeagueStandings(
  participants: TournamentParticipant[]
): Record<string, LeagueStanding> {
  const standings: Record<string, LeagueStanding> = {}
  for (const p of participants) {
    standings[p.id] = {
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      scored: 0,
      conceded: 0,
      goalDifference: 0,
      points: 0,
    }
  }
  return standings
}

// ==================== TOURNAMENT OPERATIONS ====================

/**
 * Create a new tournament
 */
export async function createTournament(
  creatorId: string,
  creatorName: string,
  name: string,
  type: TournamentType,
  maxPlayers: 4 | 8 | 16 | 32,
  isPublic: boolean,
  matchDeadlineHours: number = 24,
  description?: string
): Promise<string> {
  const tournamentsRef = collection(db, 'tournaments')
  const tournamentRef = doc(tournamentsRef)

  const inviteCode = isPublic ? undefined : generateTournamentCode()

  const tournament: Omit<Tournament, 'id'> = {
    name,
    description,
    creatorId,
    creatorName,
    type,
    isPublic,
    maxPlayers,
    matchDeadlineHours,
    participantIds: [creatorId],
    participants: [{
      id: creatorId,
      displayName: creatorName,
      joinedAt: Timestamp.now(),
    }],
    status: 'pending',
    currentRound: 0,
    winnerId: null,
    winnerName: null,
    inviteCode,
    createdAt: Timestamp.now(),
    startedAt: null,
    completedAt: null,
  }

  await setDoc(tournamentRef, tournament)
  return tournamentRef.id
}

/**
 * Join a tournament by ID or invite code
 * Uses a transaction to prevent race conditions when multiple users join simultaneously
 */
export async function joinTournament(
  tournamentId: string,
  userId: string,
  displayName: string,
  photoURL?: string
): Promise<void> {
  const tournamentRef = doc(db, 'tournaments', tournamentId)

  await runTransaction(db, async (transaction) => {
    const tournamentDoc = await transaction.get(tournamentRef)

    if (!tournamentDoc.exists()) {
      throw new Error('Tournament not found')
    }

    const tournament = tournamentDoc.data() as Omit<Tournament, 'id'>

    if (tournament.status !== 'pending') {
      throw new Error('Tournament is no longer accepting participants')
    }

    if (tournament.participantIds.includes(userId)) {
      throw new Error('You are already in this tournament')
    }

    if (tournament.participantIds.length >= tournament.maxPlayers) {
      throw new Error('Tournament is full')
    }

    const newParticipant: TournamentParticipant = {
      id: userId,
      displayName,
      photoURL,
      joinedAt: Timestamp.now(),
    }

    // Note: arrayUnion cannot be used inside transactions, so we must manually append
    transaction.update(tournamentRef, {
      participantIds: [...tournament.participantIds, userId],
      participants: [...tournament.participants, newParticipant],
    })
  })
}

/**
 * Find tournament by invite code
 */
export async function findTournamentByCode(code: string): Promise<Tournament | null> {
  const tournamentsRef = collection(db, 'tournaments')
  const q = query(
    tournamentsRef,
    where('inviteCode', '==', code.toUpperCase()),
    where('status', '==', 'pending'),
    limit(1)
  )

  const snapshot = await getDocs(q)
  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  return { id: doc.id, ...doc.data() } as Tournament
}

/**
 * Leave a tournament (only during registration)
 */
export async function leaveTournament(
  tournamentId: string,
  userId: string
): Promise<void> {
  const tournamentRef = doc(db, 'tournaments', tournamentId)
  const tournamentDoc = await getDoc(tournamentRef)

  if (!tournamentDoc.exists()) {
    throw new Error('Tournament not found')
  }

  const tournament = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament

  if (tournament.status !== 'pending') {
    throw new Error('Cannot leave a tournament that has started')
  }

  if (tournament.creatorId === userId) {
    throw new Error('Creator cannot leave. Delete the tournament instead.')
  }

  const updatedParticipantIds = tournament.participantIds.filter(id => id !== userId)
  const updatedParticipants = tournament.participants.filter(p => p.id !== userId)

  await updateDoc(tournamentRef, {
    participantIds: updatedParticipantIds,
    participants: updatedParticipants,
  })
}

/**
 * Start a tournament (creator only)
 */
export async function startTournament(tournamentId: string): Promise<void> {
  const tournamentRef = doc(db, 'tournaments', tournamentId)
  const tournamentDoc = await getDoc(tournamentRef)

  if (!tournamentDoc.exists()) {
    throw new Error('Tournament not found')
  }

  const tournament = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament

  if (tournament.status !== 'pending') {
    throw new Error('Tournament has already started')
  }

  const minPlayers = tournament.type === 'knockout' ? 4 : 3
  if (tournament.participants.length < minPlayers) {
    throw new Error(`Need at least ${minPlayers} players to start`)
  }

  // For knockout, need power of 2 players
  if (tournament.type === 'knockout') {
    const validSizes = [4, 8, 16, 32]
    if (!validSizes.includes(tournament.participants.length)) {
      throw new Error('Knockout tournaments need 4, 8, 16, or 32 players')
    }
  }

  const batch = writeBatch(db)

  if (tournament.type === 'knockout') {
    // Generate bracket and matches
    const { bracket, matches } = generateKnockoutBracket(
      tournament.participants,
      tournament.matchDeadlineHours
    )

    // Create match documents
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches')
    for (const match of matches) {
      const matchRef = doc(matchesRef)
      batch.set(matchRef, { ...match, tournamentId })
    }

    // Update tournament with bracket
    batch.update(tournamentRef, {
      status: 'in_progress',
      currentRound: 1,
      bracket,
      startedAt: serverTimestamp(),
    })
  } else {
    // League format
    const matches = generateLeagueFixtures(
      tournament.participants,
      tournamentId,
      tournament.matchDeadlineHours
    )

    // Create match documents
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches')
    for (const match of matches) {
      const matchRef = doc(matchesRef)
      batch.set(matchRef, match)
    }

    // Initialize standings
    const standings = initializeLeagueStandings(tournament.participants)

    // Update tournament
    batch.update(tournamentRef, {
      status: 'in_progress',
      currentRound: 1,
      standings,
      startedAt: serverTimestamp(),
    })
  }

  await batch.commit()
}

/**
 * Delete a tournament (creator only, during registration)
 */
export async function deleteTournament(tournamentId: string): Promise<void> {
  const tournamentRef = doc(db, 'tournaments', tournamentId)
  await deleteDoc(tournamentRef)
}

/**
 * Get tournament by ID
 */
export async function getTournamentById(tournamentId: string): Promise<Tournament | null> {
  const tournamentRef = doc(db, 'tournaments', tournamentId)
  const snapshot = await getDoc(tournamentRef)

  if (!snapshot.exists()) return null

  return { id: snapshot.id, ...snapshot.data() } as Tournament
}

/**
 * Get tournament matches
 */
export async function getTournamentMatches(tournamentId: string): Promise<TournamentMatch[]> {
  const matchesRef = collection(db, 'tournaments', tournamentId, 'matches')
  const q = query(matchesRef, orderBy('round'), orderBy('position'))

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TournamentMatch[]
}

/**
 * Get a specific tournament match by ID
 */
export async function getTournamentMatchById(
  tournamentId: string,
  matchId: string
): Promise<TournamentMatch | null> {
  const matchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId)
  const snapshot = await getDoc(matchRef)

  if (!snapshot.exists()) return null

  return { id: snapshot.id, ...snapshot.data() } as TournamentMatch
}

/**
 * Get public tournaments
 */
export async function getPublicTournaments(maxResults: number = 20): Promise<Tournament[]> {
  const tournamentsRef = collection(db, 'tournaments')
  const q = query(
    tournamentsRef,
    where('isPublic', '==', true),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Tournament[]
}

/**
 * Get user's tournaments
 */
export async function getUserTournaments(userId: string): Promise<Tournament[]> {
  const tournamentsRef = collection(db, 'tournaments')
  const q = query(
    tournamentsRef,
    where('participantIds', 'array-contains', userId),
    orderBy('createdAt', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Tournament[]
}

/**
 * Subscribe to tournament updates
 */
export function subscribeToTournament(
  tournamentId: string,
  callback: (tournament: Tournament | null) => void
): () => void {
  const tournamentRef = doc(db, 'tournaments', tournamentId)

  return onSnapshot(tournamentRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }
    callback({ id: snapshot.id, ...snapshot.data() } as Tournament)
  })
}

/**
 * Subscribe to tournament matches
 */
export function subscribeToTournamentMatches(
  tournamentId: string,
  callback: (matches: TournamentMatch[]) => void
): () => void {
  const matchesRef = collection(db, 'tournaments', tournamentId, 'matches')
  const q = query(matchesRef, orderBy('round'), orderBy('position'))

  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as TournamentMatch[]
    callback(matches)
  })
}

/**
 * Submit score for a tournament match
 * Uses a transaction to prevent race conditions when both players submit at nearly the same time
 */
export async function submitTournamentMatchScore(
  tournamentId: string,
  matchId: string,
  playerId: string,
  score: number,
  gameId: string
): Promise<void> {
  const matchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId)

  await runTransaction(db, async (transaction) => {
    const matchDoc = await transaction.get(matchRef)

    if (!matchDoc.exists()) {
      throw new Error('Match not found')
    }

    const match = { id: matchDoc.id, ...matchDoc.data() } as TournamentMatch

    // Determine if player1 or player2
    const isPlayer1 = match.player1Id === playerId

    // Check if this player has already submitted
    if (isPlayer1 && match.player1Score !== null) {
      return // Already submitted
    }
    if (!isPlayer1 && match.player2Score !== null) {
      return // Already submitted
    }

    const updates: Record<string, unknown> = isPlayer1
      ? {
          player1Score: score,
          player1GameId: gameId,
          player1CompletedAt: serverTimestamp(),
        }
      : {
          player2Score: score,
          player2GameId: gameId,
          player2CompletedAt: serverTimestamp(),
        }

    // Update status to in_progress if not already
    if (match.status === 'pending') {
      updates.status = 'in_progress'
    }

    // Check if both players have submitted (including the one we're about to submit)
    const otherScore = isPlayer1 ? match.player2Score : match.player1Score
    if (otherScore !== null) {
      // Both scores are now in - determine winner
      const player1Score = isPlayer1 ? score : match.player1Score!
      const player2Score = isPlayer1 ? match.player2Score! : score

      let winnerId: string | null = null
      let wentToPenalties = false

      if (player1Score > player2Score) {
        winnerId = match.player1Id
      } else if (player2Score > player1Score) {
        winnerId = match.player2Id
      } else {
        // Tie - needs penalty shootout
        wentToPenalties = true
        updates.status = 'penalty'
        updates.wentToPenalties = true
      }

      if (!wentToPenalties) {
        updates.status = 'completed'
        updates.winnerId = winnerId
        updates.completedAt = serverTimestamp()
      }
    }

    transaction.update(matchRef, updates)
  })

  // After the transaction, check if we need to advance the bracket
  // This is done outside the transaction since it may involve reading other documents
  const matchDoc = await getDoc(matchRef)
  if (matchDoc.exists()) {
    const match = { id: matchDoc.id, ...matchDoc.data() } as TournamentMatch
    if (match.status === 'completed' && match.winnerId) {
      const tournamentRef = doc(db, 'tournaments', tournamentId)
      const tournamentDoc = await getDoc(tournamentRef)
      if (tournamentDoc.exists()) {
        const tournament = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament
        const winnerName = match.winnerId === match.player1Id ? match.player1Name : match.player2Name
        if (tournament.type === 'knockout' && tournament.bracket) {
          await advanceKnockoutBracket(tournamentId, tournament, match.round, match.position, match.winnerId, winnerName!)
        } else if (tournament.type === 'league' && tournament.standings) {
          await updateLeagueStandings(tournamentId, tournament, match.player1Id, match.player2Id, match.player1Score!, match.player2Score!)
        }
      }
    }
  }
}

/* DEPRECATED - Logic moved into submitTournamentMatchScore transaction
async function determineTournamentMatchWinner(
  tournamentId: string,
  matchId: string,
  match: TournamentMatch,
  player1Score: number,
  player2Score: number
): Promise<void> {
  const matchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId)
  const tournamentRef = doc(db, 'tournaments', tournamentId)
  const tournamentDoc = await getDoc(tournamentRef)

  if (!tournamentDoc.exists()) return

  const tournament = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament

  let winnerId: string | null = null
  let winnerName: string | null = null
  let wentToPenalties = false

  if (player1Score > player2Score) {
    winnerId = match.player1Id
    winnerName = match.player1Name
  } else if (player2Score > player1Score) {
    winnerId = match.player2Id
    winnerName = match.player2Name
  } else {
    // Tie - needs penalty shootout
    wentToPenalties = true
    await updateDoc(matchRef, {
      status: 'penalty',
      wentToPenalties: true,
    })
    return // Don't complete yet - wait for penalty shootout
  }

  // Update match as completed
  await updateDoc(matchRef, {
    status: 'completed',
    winnerId,
    wentToPenalties,
    completedAt: serverTimestamp(),
  })

  // Update tournament based on type
  if (tournament.type === 'knockout' && tournament.bracket) {
    await advanceKnockoutBracket(tournamentId, tournament, match.round, match.position, winnerId!, winnerName!)
  } else if (tournament.type === 'league' && tournament.standings) {
    await updateLeagueStandings(tournamentId, tournament, match.player1Id, match.player2Id, player1Score, player2Score)
  }
}
*/

/**
 * Advance winner in knockout bracket
 */
async function advanceKnockoutBracket(
  tournamentId: string,
  tournament: Tournament,
  currentRound: number,
  matchPosition: number,
  winnerId: string,
  winnerName: string
): Promise<void> {
  const tournamentRef = doc(db, 'tournaments', tournamentId)
  const bracket = { ...tournament.bracket! }
  const totalRounds = bracket.rounds.length

  // Update current match in bracket
  const currentRoundData = bracket.rounds[currentRound - 1]
  const currentMatch = currentRoundData.matches[matchPosition]
  currentMatch.winnerId = winnerId
  currentMatch.status = 'completed'

  // Check if this was the final
  if (currentRound === totalRounds) {
    // Tournament complete!
    await updateDoc(tournamentRef, {
      bracket,
      status: 'completed',
      winnerId,
      winnerName,
      completedAt: serverTimestamp(),
    })
    return
  }

  // Advance to next round
  const nextRound = currentRound + 1
  const nextMatchPosition = Math.floor(matchPosition / 2)
  const isFirstOfPair = matchPosition % 2 === 0

  const nextRoundData = bracket.rounds[nextRound - 1]
  const nextMatch = nextRoundData.matches[nextMatchPosition]

  if (isFirstOfPair) {
    nextMatch.player1Id = winnerId
    nextMatch.player1Name = winnerName
  } else {
    nextMatch.player2Id = winnerId
    nextMatch.player2Name = winnerName
  }

  // If next match now has both players, create the match document
  if (nextMatch.player1Id && nextMatch.player2Id) {
    const deadline = Timestamp.fromDate(
      new Date(Date.now() + tournament.matchDeadlineHours * 60 * 60 * 1000)
    )
    nextMatch.deadline = deadline

    // Create match document
    const matchesRef = collection(db, 'tournaments', tournamentId, 'matches')
    const matchRef = doc(matchesRef)
    await setDoc(matchRef, {
      tournamentId,
      round: nextRound,
      position: nextMatchPosition,
      player1Id: nextMatch.player1Id,
      player1Name: nextMatch.player1Name,
      player2Id: nextMatch.player2Id,
      player2Name: nextMatch.player2Name,
      player1Score: null,
      player1GameId: null,
      player1CompletedAt: null,
      player2Score: null,
      player2GameId: null,
      player2CompletedAt: null,
      status: 'pending',
      winnerId: null,
      forfeitedBy: null,
      wentToPenalties: false,
      deadline,
      createdAt: serverTimestamp(),
      completedAt: null,
    })
  }

  // Check if all matches in current round are complete
  const allMatchesComplete = currentRoundData.matches.every(m => m.status === 'completed')

  await updateDoc(tournamentRef, {
    bracket,
    currentRound: allMatchesComplete ? nextRound : currentRound,
  })
}

/**
 * Update league standings after a match
 */
async function updateLeagueStandings(
  tournamentId: string,
  tournament: Tournament,
  player1Id: string,
  player2Id: string,
  player1Score: number,
  player2Score: number
): Promise<void> {
  const tournamentRef = doc(db, 'tournaments', tournamentId)
  const standings = { ...tournament.standings! }

  // Update player 1 stats
  standings[player1Id].played += 1
  standings[player1Id].scored += player1Score
  standings[player1Id].conceded += player2Score
  standings[player1Id].goalDifference = standings[player1Id].scored - standings[player1Id].conceded

  // Update player 2 stats
  standings[player2Id].played += 1
  standings[player2Id].scored += player2Score
  standings[player2Id].conceded += player1Score
  standings[player2Id].goalDifference = standings[player2Id].scored - standings[player2Id].conceded

  // Determine winner/draw
  if (player1Score > player2Score) {
    standings[player1Id].won += 1
    standings[player1Id].points += 3
    standings[player2Id].lost += 1
  } else if (player2Score > player1Score) {
    standings[player2Id].won += 1
    standings[player2Id].points += 3
    standings[player1Id].lost += 1
  } else {
    standings[player1Id].drawn += 1
    standings[player1Id].points += 1
    standings[player2Id].drawn += 1
    standings[player2Id].points += 1
  }

  // Check if all matches are complete
  const matchesRef = collection(db, 'tournaments', tournamentId, 'matches')
  const matchesSnapshot = await getDocs(matchesRef)
  const totalMatches = matchesSnapshot.docs.length
  const completedMatches = matchesSnapshot.docs.filter(d => d.data().status === 'completed').length

  const isComplete = completedMatches === totalMatches

  // Find winner if complete (most points, then goal difference)
  let winnerId: string | null = null
  let winnerName: string | null = null

  if (isComplete) {
    const sortedStandings = Object.entries(standings).sort((a, b) => {
      if (b[1].points !== a[1].points) return b[1].points - a[1].points
      return b[1].goalDifference - a[1].goalDifference
    })
    winnerId = sortedStandings[0][0]
    const winner = tournament.participants.find(p => p.id === winnerId)
    winnerName = winner?.displayName || null
  }

  await updateDoc(tournamentRef, {
    standings,
    ...(isComplete && {
      status: 'completed',
      winnerId,
      winnerName,
      completedAt: serverTimestamp(),
    }),
  })
}

/**
 * Complete a tournament match with penalty result
 */
export async function completeTournamentMatchWithPenalties(
  tournamentId: string,
  matchId: string,
  winnerId: string,
  penaltyResult: {
    challengerScore: number
    opponentScore: number
    totalRounds: number
  }
): Promise<void> {
  const matchRef = doc(db, 'tournaments', tournamentId, 'matches', matchId)
  const matchDoc = await getDoc(matchRef)

  if (!matchDoc.exists()) {
    throw new Error('Match not found')
  }

  const match = { id: matchDoc.id, ...matchDoc.data() } as TournamentMatch
  const winnerName = winnerId === match.player1Id ? match.player1Name : match.player2Name

  await updateDoc(matchRef, {
    status: 'completed',
    winnerId,
    wentToPenalties: true,
    penaltyResult: {
      ...penaltyResult,
      winnerId,
    },
    completedAt: serverTimestamp(),
  })

  // Advance bracket if knockout
  const tournamentRef = doc(db, 'tournaments', tournamentId)
  const tournamentDoc = await getDoc(tournamentRef)

  if (tournamentDoc.exists()) {
    const tournament = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament
    if (tournament.type === 'knockout' && tournament.bracket) {
      await advanceKnockoutBracket(tournamentId, tournament, match.round, match.position, winnerId, winnerName!)
    }
  }
}
