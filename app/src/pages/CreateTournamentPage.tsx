import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTournamentStore } from '../store/tournamentStore'
import { Trophy, ArrowLeft, Users, Globe, Lock, Swords, Table } from 'lucide-react'
import type { TournamentType } from '../types/multiplayer'

export function CreateTournamentPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { create, isLoading, error, clearError } = useTournamentStore()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TournamentType>('knockout')
  const [maxPlayers, setMaxPlayers] = useState<4 | 8 | 16 | 32>(8)
  const [isPublic, setIsPublic] = useState(false)
  const [matchDeadlineHours, setMatchDeadlineHours] = useState(24)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return

    try {
      const tournamentId = await create(
        user.uid,
        user.displayName || 'Anonymous',
        name.trim(),
        type,
        maxPlayers,
        isPublic,
        matchDeadlineHours,
        description.trim() || undefined
      )
      navigate(`/tournaments/${tournamentId}`)
    } catch {
      // Error is handled by the store
    }
  }

  const playerOptions = type === 'knockout' ? [4, 8, 16, 32] : [4, 6, 8, 10, 12]

  return (
    <div className="min-h-screen bg-stadium">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/tournaments"
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <Trophy className="w-8 h-8 text-trophy-gold" />
          <h1 className="text-2xl font-bold text-white">Create Tournament</h1>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tournament Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tournament Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Weekend Warriors Cup"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-trophy-gold"
              maxLength={50}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell players what this tournament is about..."
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-trophy-gold resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          {/* Tournament Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tournament Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setType('knockout')
                  if (![4, 8, 16, 32].includes(maxPlayers)) {
                    setMaxPlayers(8)
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'knockout'
                    ? 'border-trophy-gold bg-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <Swords className={`w-8 h-8 mx-auto mb-2 ${type === 'knockout' ? 'text-trophy-gold' : 'text-gray-400'}`} />
                <h3 className={`font-semibold ${type === 'knockout' ? 'text-gray-900' : 'text-gray-700'}`}>
                  Knockout
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Single elimination bracket
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setType('league')
                  if (![4, 6, 8, 10, 12].includes(maxPlayers)) {
                    setMaxPlayers(8)
                  }
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  type === 'league'
                    ? 'border-trophy-gold bg-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <Table className={`w-8 h-8 mx-auto mb-2 ${type === 'league' ? 'text-trophy-gold' : 'text-gray-400'}`} />
                <h3 className={`font-semibold ${type === 'league' ? 'text-gray-900' : 'text-gray-700'}`}>
                  League
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Everyone plays everyone
                </p>
              </button>
            </div>
          </div>

          {/* Max Players */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              <Users className="w-4 h-4 inline mr-2" />
              Number of Players
            </label>
            <div className="flex flex-wrap gap-2">
              {playerOptions.map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setMaxPlayers(num as 4 | 8 | 16 | 32)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    maxPlayers === num
                      ? 'bg-trophy-gold text-gray-900'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {num} players
                </button>
              ))}
            </div>
            {type === 'knockout' && (
              <p className="text-xs text-gray-500 mt-2">
                Knockout tournaments require power-of-2 player counts for proper brackets
              </p>
            )}
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Tournament Visibility
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  !isPublic
                    ? 'border-trophy-gold bg-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <Lock className={`w-6 h-6 mx-auto mb-2 ${!isPublic ? 'text-trophy-gold' : 'text-gray-400'}`} />
                <h3 className={`font-semibold ${!isPublic ? 'text-gray-900' : 'text-gray-700'}`}>
                  Private
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Invite only via code
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isPublic
                    ? 'border-trophy-gold bg-white'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <Globe className={`w-6 h-6 mx-auto mb-2 ${isPublic ? 'text-trophy-gold' : 'text-gray-400'}`} />
                <h3 className={`font-semibold ${isPublic ? 'text-gray-900' : 'text-gray-700'}`}>
                  Public
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Anyone can join
                </p>
              </button>
            </div>
          </div>

          {/* Match Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Match Deadline (hours)
            </label>
            <select
              value={matchDeadlineHours}
              onChange={(e) => setMatchDeadlineHours(Number(e.target.value))}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-trophy-gold"
            >
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
              <option value={72}>72 hours (3 days)</option>
              <option value={168}>168 hours (1 week)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Time limit for each player to complete their match
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!name.trim() || isLoading}
            className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            {isLoading ? 'Creating...' : 'Create Tournament'}
          </button>
        </form>
      </div>
    </div>
  )
}
