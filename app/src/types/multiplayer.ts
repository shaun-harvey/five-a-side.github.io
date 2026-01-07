import type { Timestamp } from 'firebase/firestore'

// ==================== CHALLENGE TYPES ====================

export type ChallengeStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'expired' | 'declined'

export interface Challenge {
  id: string

  // Participants
  challengerId: string
  challengerName: string
  challengerPhotoURL?: string
  opponentId: string | null  // null if created via link (pending acceptance)
  opponentName: string | null
  opponentPhotoURL?: string

  // Invite link (for sharing)
  inviteCode?: string

  // Game results
  challengerScore: number | null
  challengerGameId: string | null
  challengerCompletedAt: Timestamp | null
  opponentScore: number | null
  opponentGameId: string | null
  opponentCompletedAt: Timestamp | null

  // Challenge state
  status: ChallengeStatus
  winnerId: string | null
  winnerName: string | null

  // If tied, did we go to penalties?
  wentToPenalties: boolean
  challengerPenaltyScore: number | null  // Their penalty shootout score (0-5+)
  opponentPenaltyScore: number | null
  penaltyResult?: PenaltyResult

  // Timestamps
  createdAt: Timestamp
  acceptedAt: Timestamp | null
  deadline: Timestamp // 24 hours from accepted
  completedAt: Timestamp | null
}

// ==================== PENALTY SHOOTOUT TYPES ====================

export interface PenaltyResult {
  challengerScore: number // out of 5 (or more if sudden death)
  opponentScore: number
  totalRounds: number // 5 + sudden death rounds
  winnerId: string
}

export interface PenaltyAttempt {
  playerId: string
  playerName: string
  correct: boolean
}

export interface PenaltyShootout {
  id: string
  challengeId: string

  challengerId: string
  opponentId: string

  // 5 attempts each, then sudden death if needed
  challengerAttempts: PenaltyAttempt[]
  opponentAttempts: PenaltyAttempt[]

  // Current state
  currentRound: number // 1-5 for regular, 6+ for sudden death
  currentTurn: 'challenger' | 'opponent'
  status: 'in_progress' | 'completed'

  winnerId: string | null
  completedAt: Timestamp | null
}

// ==================== TOURNAMENT TYPES ====================

export type TournamentType = 'knockout' | 'league'
export type TournamentStatus = 'pending' | 'active' | 'completed' | 'cancelled'

export interface Tournament {
  id: string
  name: string
  description?: string

  // Creator and settings
  creatorId: string
  creatorName: string
  type: TournamentType
  isPublic: boolean
  maxPlayers: 4 | 8 | 16 | 32
  matchDeadlineHours: number // hours to complete each match

  // Participants
  participantIds: string[]
  participants: TournamentParticipant[]

  // State
  status: TournamentStatus
  currentRound: number // for knockout
  winnerId: string | null
  winnerName: string | null

  // Knockout specific
  bracket?: KnockoutBracket

  // League specific
  standings?: Record<string, LeagueStanding>

  // Timestamps
  createdAt: Timestamp
  registrationDeadline?: Timestamp
  startedAt: Timestamp | null
  completedAt: Timestamp | null

  // Invite code for private tournaments
  inviteCode?: string
}

export interface TournamentParticipant {
  id: string
  displayName: string
  photoURL?: string
  joinedAt: Timestamp
  // League stats (updated as matches are played)
  matchesPlayed?: number
  wins?: number
  draws?: number
  losses?: number
  goalsFor?: number
  goalsAgainst?: number
  points?: number
}

// ==================== KNOCKOUT BRACKET ====================

export interface KnockoutBracket {
  rounds: KnockoutRound[]
}

export interface KnockoutRound {
  roundNumber: number // 1 = finals, 2 = semis, 3 = quarters, etc.
  roundName: string // 'Final', 'Semi-Finals', 'Quarter-Finals', etc.
  matches: KnockoutMatch[]
}

export interface KnockoutMatch {
  id: string
  position: number // position in the bracket

  player1Id: string | null // null if TBD
  player1Name: string | null
  player2Id: string | null
  player2Name: string | null

  player1Score: number | null
  player2Score: number | null

  winnerId: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'bye'

  wentToPenalties: boolean
  penaltyResult?: PenaltyResult

  deadline: Timestamp | null
  completedAt: Timestamp | null
}

// ==================== LEAGUE STANDINGS ====================

export interface LeagueStanding {
  played: number
  won: number
  drawn: number
  lost: number
  scored: number // total points scored
  conceded: number // total points opponent scored
  goalDifference: number // scored - conceded
  points: number // 3 for win, 1 for draw
}

// ==================== TOURNAMENT MATCH (SUBCOLLECTION) ====================

export interface TournamentMatch {
  id: string
  tournamentId: string

  // For knockout: which round
  round: number
  position: number

  // Participants
  player1Id: string
  player1Name: string
  player2Id: string
  player2Name: string

  // Results
  player1Score: number | null
  player1GameId: string | null
  player1CompletedAt: Timestamp | null

  player2Score: number | null
  player2GameId: string | null
  player2CompletedAt: Timestamp | null

  // State
  status: 'pending' | 'in_progress' | 'completed' | 'penalty' | 'forfeit'
  winnerId: string | null
  forfeitedBy: string | null

  wentToPenalties: boolean
  penaltyResult?: PenaltyResult

  // Timing
  deadline: Timestamp
  createdAt: Timestamp
  completedAt: Timestamp | null
}

// ==================== GROUP TYPES ====================

export interface FriendGroup {
  id: string
  name: string
  description?: string

  creatorId: string
  creatorName: string

  memberIds: string[]
  members: GroupMember[]

  inviteCode: string // 6-char unique code

  createdAt: Timestamp
}

export interface GroupMember {
  id: string
  displayName: string
  photoURL?: string
  joinedAt: Timestamp
  isAdmin: boolean
}

// ==================== USER MULTIPLAYER STATS ====================

export interface MultiplayerStats {
  // Challenge stats
  challengesSent: number
  challengesReceived: number
  challengesWon: number
  challengesLost: number
  challengesTied: number // before penalties

  // Tournament stats
  tournamentsJoined: number
  tournamentsWon: number
  tournamentMatchesPlayed: number
  tournamentMatchesWon: number

  // Penalty shootout stats
  penaltyShootoutsPlayed: number
  penaltyShootoutsWon: number
  penaltyAttempts: number
  penaltySuccesses: number

  // Current streaks
  currentWinStreak: number
  longestWinStreak: number
}

// ==================== NOTIFICATION TYPES ====================

export type NotificationType =
  | 'challenge_received'
  | 'challenge_accepted'
  | 'challenge_completed'
  | 'tournament_invite'
  | 'tournament_starting'
  | 'match_ready'
  | 'match_deadline_warning'
  | 'round_advanced'
  | 'tournament_won'

export interface GameNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: {
    challengeId?: string
    tournamentId?: string
    matchId?: string
    opponentId?: string
    opponentName?: string
  }
  read: boolean
  createdAt: Timestamp
}
