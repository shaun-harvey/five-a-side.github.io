import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTournamentStore } from '../store/tournamentStore'
import {
  Trophy,
  ArrowLeft,
  Users,
  Globe,
  Lock,
  Play,
  Crown,
  Copy,
  Check,
  Clock,
  Trash2,
  LogOut,
  Loader2,
} from 'lucide-react'
import type { Tournament, TournamentMatch, TournamentParticipant } from '../types/multiplayer'

type Tab = 'bracket' | 'standings' | 'players'

export function TournamentDetailPage() {
  const { tournamentId } = useParams<{ tournamentId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentTournament: tournament,
    currentMatches: matches,
    isLoading,
    error,
    loadTournament,
    subscribeTo,
    cleanup,
    join,
    leave,
    start,
    delete: deleteTournament,
    clearError,
  } = useTournamentStore()

  const [activeTab, setActiveTab] = useState<Tab>('bracket')
  const [copiedCode, setCopiedCode] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Load and subscribe to tournament
  useEffect(() => {
    if (tournamentId) {
      loadTournament(tournamentId)
      subscribeTo(tournamentId)
    }
    return () => cleanup()
  }, [tournamentId, loadTournament, subscribeTo, cleanup])

  // Set default tab based on tournament type
  useEffect(() => {
    if (tournament) {
      setActiveTab(tournament.type === 'league' ? 'standings' : 'bracket')
    }
  }, [tournament?.type])

  if (isLoading && !tournament) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-trophy-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Tournament not found</p>
          <Link
            to="/tournaments"
            className="text-trophy-gold hover:underline"
          >
            Back to Tournaments
          </Link>
        </div>
      </div>
    )
  }

  const isCreator = tournament.creatorId === user?.uid
  const isParticipant = tournament.participants.some(p => p.id === user?.uid)
  const canJoin = !isParticipant && tournament.status === 'pending' && tournament.participants.length < tournament.maxPlayers
  const canStart = isCreator && tournament.status === 'pending' && tournament.participants.length >= 2

  const copyInviteCode = () => {
    if (tournament.inviteCode) {
      navigator.clipboard.writeText(tournament.inviteCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleJoin = async () => {
    if (!user) return
    setActionLoading('join')
    try {
      await join(tournament.id, user.uid, user.displayName || 'Anonymous', user.photoURL || undefined)
    } catch {
      // Error handled by store
    }
    setActionLoading(null)
  }

  const handleLeave = async () => {
    if (!user || !confirm('Are you sure you want to leave this tournament?')) return
    setActionLoading('leave')
    try {
      await leave(tournament.id, user.uid)
      navigate('/tournaments')
    } catch {
      // Error handled by store
    }
    setActionLoading(null)
  }

  const handleStart = async () => {
    if (!confirm('Start the tournament? No more players can join after this.')) return
    setActionLoading('start')
    try {
      await start(tournament.id)
    } catch {
      // Error handled by store
    }
    setActionLoading(null)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tournament? This cannot be undone.')) return
    setActionLoading('delete')
    try {
      await deleteTournament(tournament.id)
      navigate('/tournaments')
    } catch {
      // Error handled by store
    }
    setActionLoading(null)
  }

  return (
    <div className="min-h-screen bg-stadium">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/tournaments"
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Trophy className="w-8 h-8 text-trophy-gold" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white truncate">{tournament.name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                {tournament.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {tournament.isPublic ? 'Public' : 'Private'}
              </span>
              <span className="capitalize">{tournament.type}</span>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button onClick={clearError} className="text-sm text-red-300 underline mt-1">
              Dismiss
            </button>
          </div>
        )}

        {/* Status & Invite Code */}
        <div className="bg-deep-green/50 rounded-xl p-4 mb-6 border border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <StatusBadge status={tournament.status} />
              <p className="text-sm text-gray-400 mt-2">
                <Users className="w-4 h-4 inline mr-1" />
                {tournament.participants.length}/{tournament.maxPlayers} players
              </p>
            </div>

            {tournament.status === 'pending' && !tournament.isPublic && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Invite Code:</span>
                <button
                  onClick={copyInviteCode}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {tournament.inviteCode}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {tournament.description && (
            <p className="text-gray-400 text-sm mt-3 border-t border-white/10 pt-3">
              {tournament.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {canJoin && (
            <button
              onClick={handleJoin}
              disabled={actionLoading === 'join'}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading === 'join' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />}
              Join Tournament
            </button>
          )}

          {canStart && (
            <button
              onClick={handleStart}
              disabled={actionLoading === 'start'}
              className="flex items-center gap-2 px-6 py-3 bg-trophy-gold hover:bg-yellow-500 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading === 'start' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              Start Tournament
            </button>
          )}

          {isParticipant && tournament.status === 'pending' && !isCreator && (
            <button
              onClick={handleLeave}
              disabled={actionLoading === 'leave'}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading === 'leave' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              Leave
            </button>
          )}

          {isCreator && tournament.status === 'pending' && (
            <button
              onClick={handleDelete}
              disabled={actionLoading === 'delete'}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          {tournament.type === 'knockout' && (
            <button
              onClick={() => setActiveTab('bracket')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'bracket'
                  ? 'bg-trophy-gold text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Bracket
            </button>
          )}
          {tournament.type === 'league' && (
            <button
              onClick={() => setActiveTab('standings')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'standings'
                  ? 'bg-trophy-gold text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Standings
            </button>
          )}
          <button
            onClick={() => setActiveTab('players')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'players'
                ? 'bg-trophy-gold text-gray-900'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Players
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'bracket' && tournament.type === 'knockout' && (
          <KnockoutBracket
            tournament={tournament}
            matches={matches}
            currentUserId={user?.uid || ''}
          />
        )}

        {activeTab === 'standings' && tournament.type === 'league' && (
          <LeagueStandings
            tournament={tournament}
            matches={matches}
            currentUserId={user?.uid || ''}
          />
        )}

        {activeTab === 'players' && (
          <PlayersList
            participants={tournament.participants}
            creatorId={tournament.creatorId}
            currentUserId={user?.uid || ''}
          />
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Tournament['status'] }) {
  switch (status) {
    case 'pending':
      return <span className="px-3 py-1 text-sm rounded-full bg-yellow-500/20 text-yellow-400">Waiting for Players</span>
    case 'active':
      return <span className="px-3 py-1 text-sm rounded-full bg-green-500/20 text-green-400">In Progress</span>
    case 'completed':
      return <span className="px-3 py-1 text-sm rounded-full bg-gray-500/20 text-gray-400">Completed</span>
    default:
      return null
  }
}

interface KnockoutBracketProps {
  tournament: Tournament
  matches: TournamentMatch[]
  currentUserId: string
}

function KnockoutBracket({ tournament, matches, currentUserId }: KnockoutBracketProps) {
  const navigate = useNavigate()

  if (tournament.status === 'pending') {
    return (
      <div className="text-center py-12 bg-deep-green/30 rounded-xl border border-white/10">
        <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400">Bracket will be generated when the tournament starts</p>
      </div>
    )
  }

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    if (!acc[match.round]) acc[match.round] = []
    acc[match.round].push(match)
    return acc
  }, {} as Record<number, TournamentMatch[]>)

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b)

  const getRoundName = (round: number, totalRounds: number) => {
    const roundsFromEnd = totalRounds - round
    if (roundsFromEnd === 0) return 'Final'
    if (roundsFromEnd === 1) return 'Semi-Finals'
    if (roundsFromEnd === 2) return 'Quarter-Finals'
    return `Round ${round}`
  }

  return (
    <div className="space-y-6 overflow-x-auto pb-4">
      {rounds.map((round) => (
        <div key={round} className="min-w-[300px]">
          <h3 className="text-lg font-semibold text-white mb-3">
            {getRoundName(round, rounds.length)}
          </h3>
          <div className="space-y-3">
            {matchesByRound[round].map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                tournamentId={tournament.id}
                currentUserId={currentUserId}
                onPlay={() => navigate(`/play?tournament=${tournament.id}&match=${match.id}`)}
              />
            ))}
          </div>
        </div>
      ))}

      {tournament.winnerId && (
        <div className="mt-6 p-4 bg-trophy-gold/20 border border-trophy-gold/50 rounded-xl text-center">
          <Crown className="w-8 h-8 text-trophy-gold mx-auto mb-2" />
          <p className="text-lg font-bold text-white">{tournament.winnerName}</p>
          <p className="text-sm text-trophy-gold">Tournament Champion</p>
        </div>
      )}
    </div>
  )
}

interface LeagueStandingsProps {
  tournament: Tournament
  matches: TournamentMatch[]
  currentUserId: string
}

function LeagueStandings({ tournament, matches, currentUserId }: LeagueStandingsProps) {
  const navigate = useNavigate()

  // Calculate standings from participants
  const standings = [...tournament.participants].sort((a, b) => {
    // Sort by points, then goal difference, then goals scored
    if (b.points !== a.points) return (b.points || 0) - (a.points || 0)
    const bGD = (b.goalsFor || 0) - (b.goalsAgainst || 0)
    const aGD = (a.goalsFor || 0) - (a.goalsAgainst || 0)
    if (bGD !== aGD) return bGD - aGD
    return (b.goalsFor || 0) - (a.goalsFor || 0)
  })

  // Get current user's matches
  const myMatches = matches.filter(
    m => m.player1Id === currentUserId || m.player2Id === currentUserId
  )

  return (
    <div className="space-y-6">
      {/* League Table */}
      <div className="bg-deep-green/50 rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pos</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">P</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">W</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">D</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">L</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">GF</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">GA</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">GD</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((participant, index) => {
              const isMe = participant.id === currentUserId
              const gd = (participant.goalsFor || 0) - (participant.goalsAgainst || 0)
              return (
                <tr
                  key={participant.id}
                  className={`border-b border-white/5 ${isMe ? 'bg-trophy-gold/10' : ''}`}
                >
                  <td className="px-4 py-3 text-sm text-gray-300">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {participant.photoURL ? (
                        <img
                          src={participant.photoURL}
                          alt={participant.displayName}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">
                          {participant.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className={`text-sm ${isMe ? 'text-trophy-gold font-medium' : 'text-white'}`}>
                        {participant.displayName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400">{participant.matchesPlayed || 0}</td>
                  <td className="px-4 py-3 text-center text-sm text-green-400">{participant.wins || 0}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400">{participant.draws || 0}</td>
                  <td className="px-4 py-3 text-center text-sm text-red-400">{participant.losses || 0}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400 hidden sm:table-cell">{participant.goalsFor || 0}</td>
                  <td className="px-4 py-3 text-center text-sm text-gray-400 hidden sm:table-cell">{participant.goalsAgainst || 0}</td>
                  <td className={`px-4 py-3 text-center text-sm ${gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                    {gd > 0 ? '+' : ''}{gd}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-white">{participant.points || 0}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* My Fixtures */}
      {myMatches.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Your Fixtures</h3>
          <div className="space-y-2">
            {myMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                tournamentId={tournament.id}
                currentUserId={currentUserId}
                onPlay={() => navigate(`/play?tournament=${tournament.id}&match=${match.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface MatchCardProps {
  match: TournamentMatch
  tournamentId: string
  currentUserId: string
  onPlay: () => void
}

function MatchCard({ match, currentUserId, onPlay }: MatchCardProps) {
  const isPlayer1 = match.player1Id === currentUserId
  const isPlayer2 = match.player2Id === currentUserId
  const isMyMatch = isPlayer1 || isPlayer2
  const myScore = isPlayer1 ? match.player1Score : match.player2Score
  const canPlay = isMyMatch && match.status !== 'completed' && myScore === null

  return (
    <div className={`bg-deep-green/30 rounded-lg p-3 border ${isMyMatch ? 'border-trophy-gold/30' : 'border-white/10'}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm ${match.player1Id === currentUserId ? 'text-trophy-gold font-medium' : 'text-white'}`}>
              {match.player1Name || 'TBD'}
            </span>
            {match.status === 'completed' && (
              <span className="text-sm font-bold text-gray-300">{match.player1Score ?? '-'}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${match.player2Id === currentUserId ? 'text-trophy-gold font-medium' : 'text-white'}`}>
              {match.player2Name || 'TBD'}
            </span>
            {match.status === 'completed' && (
              <span className="text-sm font-bold text-gray-300">{match.player2Score ?? '-'}</span>
            )}
          </div>
        </div>

        {canPlay && (
          <button
            onClick={onPlay}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Play
          </button>
        )}

        {match.status === 'completed' && match.winnerId && (
          <div className="text-right">
            {match.winnerId === currentUserId ? (
              <span className="text-xs text-green-400 font-medium">Won</span>
            ) : isMyMatch ? (
              <span className="text-xs text-red-400 font-medium">Lost</span>
            ) : (
              <span className="text-xs text-gray-500">Complete</span>
            )}
          </div>
        )}

        {match.status === 'in_progress' && !canPlay && isMyMatch && (
          <span className="text-xs text-yellow-400">Waiting...</span>
        )}
      </div>
    </div>
  )
}

interface PlayersListProps {
  participants: TournamentParticipant[]
  creatorId: string
  currentUserId: string
}

function PlayersList({ participants, creatorId, currentUserId }: PlayersListProps) {
  return (
    <div className="space-y-2">
      {participants.map((participant) => (
        <div
          key={participant.id}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            participant.id === currentUserId ? 'bg-trophy-gold/10 border border-trophy-gold/30' : 'bg-deep-green/30 border border-white/10'
          }`}
        >
          {participant.photoURL ? (
            <img
              src={participant.photoURL}
              alt={participant.displayName}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-bold">
              {participant.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-medium truncate ${participant.id === currentUserId ? 'text-trophy-gold' : 'text-white'}`}>
                {participant.displayName}
              </span>
              {participant.id === creatorId && (
                <span title="Tournament Creator">
                  <Crown className="w-4 h-4 text-trophy-gold flex-shrink-0" />
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
