import { useNavigate } from 'react-router-dom'
import { useChallengeStore } from '../../store/challengeStore'
import type { Challenge } from '../../types/multiplayer'
import { Clock, CheckCircle, XCircle, Trophy, Swords, Play, Target } from 'lucide-react'

interface ChallengeCardProps {
  challenge: Challenge
  currentUserId: string
}

export function ChallengeCard({ challenge, currentUserId }: ChallengeCardProps) {
  const navigate = useNavigate()
  const { acceptChallenge, declineChallenge, cancelChallenge, isLoading } = useChallengeStore()

  const isChallenger = challenge.challengerId === currentUserId
  const opponent = isChallenger
    ? { id: challenge.opponentId, name: challenge.opponentName, photoURL: challenge.opponentPhotoURL }
    : { id: challenge.challengerId, name: challenge.challengerName, photoURL: challenge.challengerPhotoURL }

  const myScore = isChallenger ? challenge.challengerScore : challenge.opponentScore
  const theirScore = isChallenger ? challenge.opponentScore : challenge.challengerScore
  const hasSubmittedScore = myScore !== null
  const theySubmittedScore = theirScore !== null

  const isWinner = challenge.winnerId === currentUserId
  const isLoser = challenge.winnerId !== null && challenge.winnerId !== currentUserId

  // Format deadline
  const getTimeLeft = () => {
    if (!challenge.deadline) return null
    const now = Date.now()
    const deadline = challenge.deadline.toMillis()
    const diff = deadline - now

    if (diff <= 0) return 'Expired'

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d left`
    }
    if (hours > 0) return `${hours}h ${minutes}m left`
    return `${minutes}m left`
  }

  const handleAccept = async () => {
    await acceptChallenge(challenge.id)
  }

  const handleDecline = async () => {
    await declineChallenge(challenge.id)
  }

  const handleCancel = async () => {
    await cancelChallenge(challenge.id)
  }

  const handlePlayChallenge = () => {
    // Navigate to play with challenge context
    navigate(`/play?challenge=${challenge.id}`)
  }

  const handleTakePenalties = () => {
    navigate(`/penalties/${challenge.id}`)
  }

  const getStatusBadge = () => {
    switch (challenge.status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-yellow-400 text-xs">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'accepted':
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 text-blue-400 text-xs">
            <Swords className="w-3 h-3" />
            In Progress
          </span>
        )
      case 'completed':
        if (isWinner) {
          return (
            <span className="flex items-center gap-1 text-green-400 text-xs">
              <Trophy className="w-3 h-3" />
              Won
            </span>
          )
        } else if (isLoser) {
          return (
            <span className="flex items-center gap-1 text-red-400 text-xs">
              <XCircle className="w-3 h-3" />
              Lost
            </span>
          )
        }
        return (
          <span className="flex items-center gap-1 text-gray-400 text-xs">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        )
      case 'declined':
        return (
          <span className="flex items-center gap-1 text-gray-500 text-xs">
            <XCircle className="w-3 h-3" />
            Declined
          </span>
        )
      case 'expired':
        return (
          <span className="flex items-center gap-1 text-gray-500 text-xs">
            <Clock className="w-3 h-3" />
            Expired
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      challenge.status === 'completed' && isWinner
        ? 'bg-green-500/10 border-green-500/30'
        : challenge.status === 'completed' && isLoser
        ? 'bg-red-500/10 border-red-500/30'
        : 'bg-black/30 border-white/10 hover:border-white/20'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Opponent Avatar */}
          {opponent.photoURL ? (
            <img
              src={opponent.photoURL}
              alt={opponent.name ?? 'Opponent'}
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold border-2 border-white/30">
              {(opponent.name ?? 'O').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Opponent Info */}
          <div>
            <p className="font-medium text-white">{opponent.name ?? 'Waiting for opponent'}</p>
            <p className="text-xs text-gray-400">
              {isChallenger ? 'You challenged' : 'Challenged you'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        {getStatusBadge()}
      </div>

      {/* Scores (if in progress or completed) */}
      {(challenge.status === 'in_progress' || challenge.status === 'completed' || challenge.status === 'accepted') && (
        <div className="flex items-center justify-center gap-4 mb-3 py-2 bg-black/20 rounded">
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">You</p>
            <p className={`text-2xl font-bold ${
              myScore !== null
                ? isWinner ? 'text-green-400' : isLoser ? 'text-red-400' : 'text-white'
                : 'text-gray-500'
            }`}>
              {myScore !== null ? myScore : '-'}
            </p>
          </div>
          <div className="text-gray-500">vs</div>
          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">{(opponent.name ?? 'Opponent').split(' ')[0]}</p>
            <p className={`text-2xl font-bold ${
              theirScore !== null
                ? isLoser ? 'text-green-400' : isWinner ? 'text-red-400' : 'text-white'
                : 'text-gray-500'
            }`}>
              {theirScore !== null ? theirScore : '-'}
            </p>
          </div>
        </div>
      )}

      {/* Penalty indicator */}
      {challenge.wentToPenalties && challenge.penaltyResult && (
        <div className="text-center text-xs text-yellow-400 mb-3">
          Decided by penalties ({challenge.penaltyResult.challengerScore} - {challenge.penaltyResult.opponentScore})
        </div>
      )}

      {/* Time Left */}
      {(challenge.status === 'accepted' || challenge.status === 'in_progress') && (
        <div className="text-center text-xs text-gray-400 mb-3">
          <Clock className="w-3 h-3 inline mr-1" />
          {getTimeLeft()}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {/* Pending - Received */}
        {challenge.status === 'pending' && !isChallenger && (
          <>
            <button
              onClick={handleAccept}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors text-white"
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={handleDecline}
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors text-white"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </>
        )}

        {/* Pending - Sent */}
        {challenge.status === 'pending' && isChallenger && (
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-colors text-white"
          >
            <XCircle className="w-4 h-4" />
            Cancel
          </button>
        )}

        {/* Active - Need to play */}
        {(challenge.status === 'accepted' || challenge.status === 'in_progress') && !hasSubmittedScore && (
          <button
            onClick={handlePlayChallenge}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors text-white"
          >
            <Play className="w-4 h-4" />
            Play Now
          </button>
        )}

        {/* Active - Waiting for opponent */}
        {(challenge.status === 'accepted' || challenge.status === 'in_progress') && hasSubmittedScore && !theySubmittedScore && !challenge.wentToPenalties && (
          <div className="flex-1 flex items-center justify-center gap-2 bg-gray-700 px-4 py-2 rounded-lg font-medium text-gray-300">
            <Clock className="w-4 h-4 animate-pulse" />
            Waiting for {(opponent.name ?? 'opponent').split(' ')[0]}...
          </div>
        )}

        {/* Penalty Shootout needed */}
        {challenge.status === 'in_progress' && challenge.wentToPenalties && !challenge.penaltyResult && (
          <button
            onClick={handleTakePenalties}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg font-bold transition-colors text-gray-900"
          >
            <Target className="w-4 h-4" />
            Take Penalties!
          </button>
        )}
      </div>
    </div>
  )
}
