import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTournamentStore } from '../store/tournamentStore'
import { Trophy, Plus, Users, Globe, Lock, Crown, ChevronRight, Copy, Check } from 'lucide-react'
import type { Tournament } from '../types/multiplayer'

type Tab = 'my' | 'public'

export function TournamentsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const {
    tournaments,
    publicTournaments,
    isLoading,
    error,
    loadUserTournaments,
    loadPublicTournaments,
    joinByCode,
    clearError,
  } = useTournamentStore()

  const [activeTab, setActiveTab] = useState<Tab>('my')
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Load tournaments on mount
  useEffect(() => {
    if (user) {
      loadUserTournaments(user.uid)
    }
    loadPublicTournaments()
  }, [user, loadUserTournaments, loadPublicTournaments])

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  const handleJoinByCode = async () => {
    if (!user || !joinCode.trim()) return

    setIsJoining(true)
    setJoinError(null)

    try {
      const tournamentId = await joinByCode(
        joinCode.trim().toUpperCase(),
        user.uid,
        user.displayName || 'Anonymous',
        user.photoURL || undefined
      )
      setJoinCode('')
      navigate(`/tournaments/${tournamentId}`)
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : 'Failed to join tournament')
    } finally {
      setIsJoining(false)
    }
  }

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getStatusBadge = (tournament: Tournament) => {
    switch (tournament.status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">Waiting for Players</span>
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">In Progress</span>
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">Completed</span>
      default:
        return null
    }
  }

  const displayedTournaments = activeTab === 'my' ? tournaments : publicTournaments

  if (authLoading) {
    return (
      <div className="min-h-screen bg-stadium flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-trophy-gold border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stadium">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-trophy-gold" />
            <h1 className="text-2xl font-bold text-white">Tournaments</h1>
          </div>
          <Link
            to="/tournaments/create"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create
          </Link>
        </div>

        {/* Join by Code */}
        <div className="bg-deep-green/50 rounded-xl p-4 mb-6 border border-white/10">
          <h2 className="text-sm font-medium text-gray-300 mb-3">Join with Invite Code</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g., TRN-8K4M)"
              className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:border-trophy-gold"
              maxLength={8}
            />
            <button
              onClick={handleJoinByCode}
              disabled={!joinCode.trim() || isJoining}
              className="px-6 py-2 bg-trophy-gold hover:bg-yellow-500 text-gray-900 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : 'Join'}
            </button>
          </div>
          {joinError && (
            <p className="mt-2 text-sm text-red-400">{joinError}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'my'
                ? 'bg-trophy-gold text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            My Tournaments
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'public'
                ? 'bg-trophy-gold text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <Globe className="w-4 h-4" />
            Browse Public
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-400">{error}</p>
            <button onClick={clearError} className="text-sm text-red-300 underline mt-1">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-trophy-gold border-t-transparent rounded-full" />
          </div>
        )}

        {/* Tournaments List */}
        {!isLoading && (
          <div className="space-y-3">
            {displayedTournaments.length === 0 ? (
              <div className="text-center py-12 bg-deep-green/30 rounded-xl border border-white/10">
                <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 mb-4">
                  {activeTab === 'my'
                    ? "You haven't joined any tournaments yet"
                    : 'No public tournaments available'}
                </p>
                {activeTab === 'my' && (
                  <Link
                    to="/tournaments/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    Create Your First Tournament
                  </Link>
                )}
              </div>
            ) : (
              displayedTournaments.map((tournament) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  currentUserId={user?.uid || ''}
                  onCopyCode={copyInviteCode}
                  copiedCode={copiedCode}
                  getStatusBadge={getStatusBadge}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface TournamentCardProps {
  tournament: Tournament
  currentUserId: string
  onCopyCode: (code: string) => void
  copiedCode: string | null
  getStatusBadge: (tournament: Tournament) => React.ReactNode
}

function TournamentCard({
  tournament,
  currentUserId,
  onCopyCode,
  copiedCode,
  getStatusBadge,
}: TournamentCardProps) {
  const navigate = useNavigate()
  const isCreator = tournament.creatorId === currentUserId

  return (
    <div
      onClick={() => navigate(`/tournaments/${tournament.id}`)}
      className="bg-deep-green/50 rounded-xl p-4 border border-white/10 hover:border-trophy-gold/50 cursor-pointer transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white truncate">{tournament.name}</h3>
            {isCreator && (
              <span title="You created this">
                <Crown className="w-4 h-4 text-trophy-gold flex-shrink-0" />
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
            <span className="flex items-center gap-1">
              {tournament.isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {tournament.isPublic ? 'Public' : 'Private'}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {tournament.participants.length}/{tournament.maxPlayers}
            </span>
            <span className="capitalize">
              {tournament.type === 'knockout' ? 'Knockout' : 'League'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {getStatusBadge(tournament)}
            {tournament.status === 'pending' && !tournament.isPublic && tournament.inviteCode && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyCode(tournament.inviteCode!)
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
              >
                {copiedCode === tournament.inviteCode ? (
                  <>
                    <Check className="w-3 h-3 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    {tournament.inviteCode}
                  </>
                )}
              </button>
            )}
          </div>

          {tournament.description && (
            <p className="mt-2 text-sm text-gray-500 truncate">{tournament.description}</p>
          )}
        </div>

        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-trophy-gold transition-colors flex-shrink-0" />
      </div>
    </div>
  )
}
