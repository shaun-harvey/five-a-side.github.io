import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { subscribeToUserProfile } from '../lib/firebase/firestore'
import { Trophy, Target, Percent, Check, X, Flame, ArrowRightLeft, Eye, SkipForward, Clock, ClipboardList, Award, TrendingUp } from 'lucide-react'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import type { UserStats } from '../types/user'

export function StatsPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated, isInitialized } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login')
    }
  }, [isInitialized, isAuthenticated, navigate])

  // Subscribe to realtime stats updates
  useEffect(() => {
    if (!user?.uid) return

    const unsubscribe = subscribeToUserProfile(user.uid, (profile) => {
      if (profile?.stats) {
        setStats(profile.stats)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [user?.uid])

  if (!isInitialized || isLoading) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return null
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-bold text-center text-white mb-6 sm:mb-8">
          Your Underlying Numbers
        </h1>

        {/* Main Stats Grid */}
        <div className="bg-stadium rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-white/30 grass-texture mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-trophy-gold" />
            Performance
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-trophy-gold mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.highestScore || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Best Score</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.totalGamesPlayed || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Games</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.averageScore ? Math.round(stats.averageScore) : 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Avg Points</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <Percent className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">
                {stats?.accuracy ? `${Math.round(stats.accuracy)}%` : '0%'}
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">Accuracy</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.totalCorrectGuesses || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Correct</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.totalWrongGuesses || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Wrong</p>
            </div>
          </div>
        </div>

        {/* In-Game Management */}
        <div className="bg-stadium rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-white/30 grass-texture mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            In-Game Management
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.totalPassesUsed || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Passes</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <ArrowRightLeft className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.totalSubstitutionsUsed || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Subs</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.totalVARHintsUsed || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">VAR</p>
            </div>
          </div>
        </div>

        {/* Streaks & Time */}
        <div className="bg-stadium rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-white/30 grass-texture mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            Streaks & Time
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.longestCorrectStreak || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Best Streak</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 mx-auto mb-1.5 sm:mb-2" />
              <p className="text-xl sm:text-2xl font-bold text-white">{formatTime(stats?.totalPlayTimeSeconds || 0)}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Total Time</p>
            </div>
          </div>
        </div>

        {/* Game Outcomes */}
        <div className="bg-stadium rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border-2 border-white/30 grass-texture">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 text-trophy-gold" />
            Game Outcomes
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.gamesCompletedFully || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Complete</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 rounded-full bg-red-600 flex items-center justify-center">
                <X className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.gamesEndedByStrikes || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Red Cards</p>
            </div>

            <div className="bg-deep-green rounded-lg p-3 sm:p-4 text-center border border-white/10">
              <div className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-1.5 sm:mb-2 rounded-full bg-yellow-500 flex items-center justify-center">
                <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <p className="text-xl sm:text-2xl font-bold text-white">{stats?.gamesEndedByCheating || 0}</p>
              <p className="text-gray-400 text-xs sm:text-sm">Cheating</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
