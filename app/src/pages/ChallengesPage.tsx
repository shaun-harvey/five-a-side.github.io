import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useChallengeStore } from '../store/challengeStore'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { ChallengeCard } from '../components/challenges/ChallengeCard'
import { SendChallengeModal } from '../components/challenges/SendChallengeModal'
import { ShareLinkModal } from '../components/challenges/ShareLinkModal'
import { Swords, Plus, Clock, Trophy, History, Link2 } from 'lucide-react'

type TabType = 'pending' | 'active' | 'history'

export function ChallengesPage() {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, isInitialized } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('active')
  const [showSendModal, setShowSendModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const initializedRef = useRef(false)

  const {
    pendingChallenges,
    activeChallenges,
    completedChallenges,
    stats,
    isLoading,
    initialize,
    cleanup,
  } = useChallengeStore()

  // Initialize challenge store when authenticated (only once)
  useEffect(() => {
    if (isAuthenticated && user && profile && !initializedRef.current) {
      initializedRef.current = true
      initialize(user.uid, profile.displayName, profile.photoURL)
    }

    return () => {
      cleanup()
      initializedRef.current = false
    }
  }, [isAuthenticated, user?.uid, profile?.displayName, initialize, cleanup])

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login')
    }
  }, [isInitialized, isAuthenticated, navigate])

  if (!isInitialized || (isAuthenticated && isLoading)) {
    return <LoadingSpinner />
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'pending', label: 'Pending', icon: <Clock className="w-4 h-4" />, count: pendingChallenges.length },
    { id: 'active', label: 'Active', icon: <Swords className="w-4 h-4" />, count: activeChallenges.length },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" />, count: completedChallenges.length },
  ]

  const getDisplayedChallenges = () => {
    switch (activeTab) {
      case 'pending':
        return pendingChallenges
      case 'active':
        return activeChallenges
      case 'history':
        return completedChallenges
      default:
        return []
    }
  }

  const displayedChallenges = getDisplayedChallenges()

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-start justify-center p-4 pt-8">
      <div className="bg-stadium rounded-2xl shadow-xl p-6 w-full max-w-2xl border-2 border-white/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-white flex items-center gap-3">
            <Swords className="w-8 h-8 text-red-500" />
            Challenges
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg font-medium transition-colors text-white"
              title="Share challenge link"
            >
              <Link2 className="w-5 h-5" />
              <span className="hidden sm:inline">Link</span>
            </button>
            <button
              onClick={() => setShowSendModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg font-medium transition-colors text-white"
              title="Challenge a friend"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Challenge</span>
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-2 mb-6 p-4 bg-black/30 rounded-lg border border-white/10">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats.won}</p>
            <p className="text-xs text-green-400">Won</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats.lost}</p>
            <p className="text-xs text-red-400">Lost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats.sent}</p>
            <p className="text-xs text-gray-400">Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats.received}</p>
            <p className="text-xs text-gray-400">Received</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white'
                  : 'bg-black/30 text-gray-300 hover:bg-white/10'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-white/10'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Challenge List */}
        <div className="space-y-3">
          {displayedChallenges.length === 0 ? (
            <div className="text-center py-12 bg-black/30 rounded-lg border border-white/10">
              {activeTab === 'pending' && (
                <>
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No pending challenges</p>
                  <p className="text-gray-500 text-sm">Challenges you receive will appear here</p>
                </>
              )}
              {activeTab === 'active' && (
                <>
                  <Swords className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No active challenges</p>
                  <p className="text-gray-500 text-sm">Challenge a friend to compete!</p>
                </>
              )}
              {activeTab === 'history' && (
                <>
                  <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No challenge history yet</p>
                  <p className="text-gray-500 text-sm">Your completed challenges will appear here</p>
                </>
              )}
            </div>
          ) : (
            displayedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                currentUserId={user?.uid || ''}
              />
            ))
          )}
        </div>

        {/* Back to Play */}
        <button
          onClick={() => navigate('/play')}
          className="w-full mt-6 bg-pitch-green hover:bg-green-700 font-bold py-4 px-4 rounded-lg transition duration-300 text-lg text-white"
        >
          Back to Play
        </button>
      </div>

      {/* Send Challenge Modal */}
      {showSendModal && user && profile && (
        <SendChallengeModal
          currentUserId={user.uid}
          currentUserName={profile.displayName}
          currentUserPhotoURL={profile.photoURL}
          onClose={() => setShowSendModal(false)}
        />
      )}

      {/* Share Link Modal */}
      {showShareModal && user && profile && (
        <ShareLinkModal
          currentUserId={user.uid}
          currentUserName={profile.displayName}
          currentUserPhotoURL={profile.photoURL}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}
