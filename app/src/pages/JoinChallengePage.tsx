import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { findChallengeByCode, acceptChallengeByCode } from '../lib/firebase/challenges'
import { LoadingSpinner } from '../components/common/LoadingSpinner'
import { Swords, AlertTriangle, CheckCircle, Loader2, User } from 'lucide-react'
import type { Challenge } from '../types/multiplayer'

export function JoinChallengePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, isInitialized } = useAuth()

  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load challenge details
  useEffect(() => {
    async function loadChallenge() {
      if (!code) {
        setError('Invalid challenge code')
        setIsLoading(false)
        return
      }

      try {
        const foundChallenge = await findChallengeByCode(code.toUpperCase())
        if (!foundChallenge) {
          setError('Challenge not found. The code may be invalid or expired.')
        } else if (foundChallenge.status !== 'pending') {
          setError('This challenge is no longer available.')
        } else if (foundChallenge.opponentId !== null) {
          setError('This challenge has already been accepted by someone else.')
        } else {
          setChallenge(foundChallenge)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load challenge')
      } finally {
        setIsLoading(false)
      }
    }

    loadChallenge()
  }, [code])

  // Check if this is the user's own challenge
  const isOwnChallenge = challenge && user && challenge.challengerId === user.uid

  const handleAccept = async () => {
    if (!challenge || !user || !profile || !code) return

    setIsAccepting(true)
    setError(null)

    try {
      await acceptChallengeByCode(
        code.toUpperCase(),
        user.uid,
        profile.displayName,
        profile.photoURL
      )
      setSuccess(true)
      // Redirect to challenges page after a short delay
      setTimeout(() => {
        navigate('/challenges')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept challenge')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleLogin = () => {
    // Store the challenge code so we can return after login
    sessionStorage.setItem('pendingChallengeCode', code || '')
    navigate('/login')
  }

  // Show loading while checking auth or loading challenge
  if (!isInitialized || isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="bg-stadium rounded-2xl shadow-xl p-6 w-full max-w-md border-2 border-white/30">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Swords className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Challenge Invite</h1>
          {code && (
            <p className="text-gray-400 mt-1">Code: <span className="font-mono text-white">{code.toUpperCase()}</span></p>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => navigate('/challenges')}
              className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Go to Challenges
            </button>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xl font-bold text-white mb-2">Challenge Accepted!</p>
            <p className="text-gray-400">Redirecting to your challenges...</p>
          </div>
        )}

        {/* Challenge Details */}
        {challenge && !error && !success && (
          <>
            {/* Challenger Info */}
            <div className="mb-6 p-4 bg-black/30 rounded-lg border border-white/10">
              <div className="flex items-center gap-4">
                {challenge.challengerPhotoURL ? (
                  <img
                    src={challenge.challengerPhotoURL}
                    alt={challenge.challengerName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-red-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-xl border-2 border-red-500">
                    {challenge.challengerName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-bold text-white text-lg">{challenge.challengerName}</p>
                  <p className="text-red-400">wants to challenge you!</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 text-center">
              <p className="text-gray-300">
                Accept this 1v1 challenge to compete head-to-head.
                Both players play the same game and the highest score wins!
              </p>
            </div>

            {/* Actions */}
            {!isAuthenticated ? (
              // Not logged in - show login button
              <div className="space-y-4">
                <p className="text-center text-gray-400 text-sm">
                  Sign in or create an account to accept this challenge
                </p>
                <button
                  onClick={handleLogin}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 font-bold py-4 px-4 rounded-lg transition-colors text-white"
                >
                  <User className="w-5 h-5" />
                  Sign In to Accept
                </button>
              </div>
            ) : isOwnChallenge ? (
              // User's own challenge
              <div className="text-center py-4">
                <p className="text-yellow-400 mb-4">
                  This is your own challenge link! Share it with a friend.
                </p>
                <button
                  onClick={() => navigate('/challenges')}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                >
                  Go to Challenges
                </button>
              </div>
            ) : (
              // Ready to accept
              <div className="space-y-3">
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-bold py-4 px-4 rounded-lg transition-colors text-lg text-white"
                >
                  {isAccepting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <Swords className="w-5 h-5" />
                      Accept Challenge
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/challenges')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Decline
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
