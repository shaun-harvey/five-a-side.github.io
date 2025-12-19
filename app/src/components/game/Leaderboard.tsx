import { useEffect, useState } from 'react'
import { Medal, Trophy, Award } from 'lucide-react'
import { getLeaderboard } from '../../lib/firebase/firestore'
import type { LeaderboardEntry } from '../../types/user'

interface LeaderboardProps {
  showTitle?: boolean
  limit?: number
  refreshKey?: number // Increment to trigger refresh
}

export function Leaderboard({ showTitle = true, limit = 100, refreshKey = 0 }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        // Fetch data and enforce minimum delay to prevent jumpiness
        const [entries] = await Promise.all([
          getLeaderboard(limit),
          new Promise(resolve => setTimeout(resolve, 500)) // 500ms minimum
        ])
        setLeaderboard(entries as LeaderboardEntry[])
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err)
        setError('Failed to load leaderboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [limit, refreshKey])

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="text-gray-400">{rank}</span>
  }

  // Skeleton row for loading state
  const SkeletonRow = ({ index }: { index: number }) => (
    <div
      className={`grid grid-cols-12 gap-2 p-3 items-center ${
        index < 3 ? 'bg-yellow-500/5' : ''
      }`}
    >
      <div className="col-span-2 flex justify-center">
        <div className="w-5 h-5 bg-white/10 rounded-full animate-pulse" />
      </div>
      <div className="col-span-6">
        <div className="h-4 bg-white/10 rounded w-3/4 animate-pulse" />
      </div>
      <div className="col-span-4 flex justify-end">
        <div className="h-6 bg-white/10 rounded w-12 animate-pulse" />
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="w-full">
        {showTitle && (
          <h2 className="text-2xl font-bold text-white text-center mb-4">League Table</h2>
        )}
        <div className="bg-deep-green rounded-lg overflow-hidden border border-white/10">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 p-3 bg-black/30 text-gray-400 text-sm font-medium">
            <div className="col-span-2 text-center">#</div>
            <div className="col-span-6">Player</div>
            <div className="col-span-4 text-right">Score</div>
          </div>
          {/* Skeleton rows */}
          <div className="divide-y divide-white/10">
            {[...Array(4)].map((_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  const top4 = leaderboard.slice(0, 4)
  const rest = leaderboard.slice(4)

  const renderRow = (entry: LeaderboardEntry, index: number) => (
    <div
      key={entry.id || index}
      className={`grid grid-cols-12 gap-2 p-3 items-center transition-colors hover:bg-white/5 ${
        index < 3 ? 'bg-yellow-500/5' : ''
      }`}
    >
      <div className="col-span-2 flex justify-center">
        {getRankIcon(index + 1)}
      </div>
      <div className="col-span-6">
        <p className="font-medium text-white truncate">
          {entry.displayName}
        </p>
      </div>
      <div className="col-span-4 text-right">
        <span className="text-xl font-bold text-yellow-400">
          {entry.score}
        </span>
      </div>
    </div>
  )

  return (
    <div className="w-full">
      {showTitle && (
        <h2 className="text-2xl font-bold text-white text-center mb-4">League Table</h2>
      )}

      {/* Leaderboard Table */}
      <div className="bg-deep-green rounded-lg overflow-hidden border border-white/10">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 p-3 bg-black/30 text-gray-400 text-sm font-medium">
          <div className="col-span-2 text-center">#</div>
          <div className="col-span-6">Player</div>
          <div className="col-span-4 text-right">Score</div>
        </div>

        {leaderboard.length > 0 ? (
          <>
            {/* Top 4 - Fixed */}
            <div className="divide-y divide-white/10">
              {top4.map((entry, index) => renderRow(entry, index))}
            </div>

            {/* Rest - Scrollable */}
            {rest.length > 0 && (
              <div className="max-h-60 overflow-y-auto divide-y divide-white/10 border-t border-white/20">
                {rest.map((entry, index) => renderRow(entry, index + 4))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-400">No scores yet!</p>
            <p className="text-gray-500 text-sm mt-1">Be the first to set a high score.</p>
          </div>
        )}
      </div>
    </div>
  )
}
