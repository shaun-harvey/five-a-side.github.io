import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getLeaderboard } from '../lib/firebase/firestore'
import type { LeaderboardEntry } from '../types/user'
import { Trophy, Medal, Award } from 'lucide-react'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

export function LeaderboardPage() {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, isInitialized } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Find user's rank in the leaderboard
  const userRank = leaderboard.findIndex(entry => entry.userId === user?.uid) + 1

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        // Fetch data and enforce minimum delay to prevent jumpiness
        const [entries] = await Promise.all([
          getLeaderboard(50),
          new Promise(resolve => setTimeout(resolve, 1500)) // 1.5s minimum
        ])
        setLeaderboard(entries as LeaderboardEntry[])
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login')
    }
  }, [isInitialized, isAuthenticated, navigate])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
    return <span className="text-gray-400 font-bold">{rank}</span>
  }

  const top4 = leaderboard.slice(0, 4)
  const rest = leaderboard.slice(4)

  const renderRow = (entry: LeaderboardEntry, index: number) => (
    <div
      key={entry.id || index}
      className={`grid grid-cols-12 gap-2 p-4 items-center transition-colors hover:bg-white/5 ${
        index < 3 ? 'bg-yellow-500/5' : ''
      }`}
    >
      <div className="col-span-2 flex justify-center">
        {getRankIcon(index + 1)}
      </div>
      <div className="col-span-6 flex items-center gap-3">
        {entry.photoURL ? (
          <img
            src={entry.photoURL}
            alt={entry.displayName}
            className="w-8 h-8 rounded-full object-cover border-2 border-white/30 flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 border-2 border-white/30">
            {entry.displayName?.charAt(0).toUpperCase() || '?'}
          </div>
        )}
        <p className="font-medium text-white truncate">
          {entry.displayName}
        </p>
      </div>
      <div className="col-span-4 text-right">
        <span className={`text-xl font-bold ${index < 3 ? 'text-yellow-400' : 'text-white'}`}>
          {entry.score}
        </span>
      </div>
    </div>
  )

  if (!isInitialized) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      {/* Main Container - Stadium themed card */}
      <div className="bg-stadium rounded-2xl shadow-xl p-6 w-full max-w-2xl border-2 border-white/30">
        {/* Title */}
        <h1 className="text-3xl sm:text-4xl font-bold text-center text-white mb-6">
          League Table
        </h1>

        {/* User's Best Score & Rank */}
        {!!(isAuthenticated && profile?.stats?.highestScore && profile.stats.highestScore > 0) && (
          <div className="mb-6 p-4 bg-black/30 border border-yellow-500/30 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="text-center flex-1">
                <p className="text-gray-400 text-sm mb-1">Your Best</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {profile.stats.highestScore}
                </p>
              </div>
              <div className="w-px h-12 bg-white/20" />
              <div className="text-center flex-1">
                <p className="text-gray-400 text-sm mb-1">Your Rank</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {userRank > 0 ? `#${userRank}` : '-'}
                  <span className="text-lg text-gray-400 font-normal">
                    {userRank > 0 && ` / ${leaderboard.length}`}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard Table */}
        <div className="bg-black/30 rounded-lg overflow-hidden border border-white/10">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-4 bg-black/30 text-gray-400 text-sm font-bold uppercase tracking-wide border-b border-white/10">
            <div className="col-span-2 text-center">#</div>
            <div className="col-span-6">Player</div>
            <div className="col-span-4 text-right">Score</div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="divide-y divide-white/5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-12 gap-2 p-4 items-center ${
                    i < 3 ? 'bg-yellow-500/5' : ''
                  }`}
                >
                  <div className="col-span-2 flex justify-center">
                    <div className="w-6 h-6 bg-white/10 rounded-full animate-pulse" />
                  </div>
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full animate-pulse flex-shrink-0" />
                    <div className="h-5 bg-white/10 rounded w-3/4 animate-pulse" />
                  </div>
                  <div className="col-span-4 flex justify-end">
                    <div className="h-7 bg-white/10 rounded w-14 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Table Body */}
          {!isLoading && leaderboard.length > 0 && (
            <>
              {/* Top 4 - Fixed */}
              <div className="divide-y divide-white/5">
                {top4.map((entry, index) => renderRow(entry, index))}
              </div>

              {/* Rest - Scrollable */}
              {rest.length > 0 && (
                <div className="max-h-72 overflow-y-auto divide-y divide-white/5 border-t border-white/20">
                  {rest.map((entry, index) => renderRow(entry, index + 4))}
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!isLoading && leaderboard.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No scores yet!</p>
              <p className="text-gray-500 text-sm">Be the first to set a high score.</p>
            </div>
          )}
        </div>

        {/* Play Button */}
        <button
          onClick={() => navigate('/play')}
          className="w-full mt-6 bg-green-600 hover:bg-green-700 font-bold py-4 px-4 rounded-lg transition duration-300 text-lg text-white"
        >
          Play Now
        </button>
      </div>
    </div>
  )
}
