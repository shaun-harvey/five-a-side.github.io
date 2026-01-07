import { useState } from 'react'
import { X, Link2, Copy, Check, Loader2, Share2 } from 'lucide-react'
import { createChallengeLink } from '../../lib/firebase/challenges'

interface ShareLinkModalProps {
  currentUserId: string
  currentUserName: string
  currentUserPhotoURL?: string
  onClose: () => void
}

export function ShareLinkModal({
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  onClose,
}: ShareLinkModalProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createLink = async () => {
    setIsCreating(true)
    setError(null)

    try {
      const result = await createChallengeLink(
        currentUserId,
        currentUserName,
        currentUserPhotoURL
      )
      setInviteCode(result.inviteCode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create challenge link')
    } finally {
      setIsCreating(false)
    }
  }

  const getShareUrl = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/join/${inviteCode}`
  }

  const handleCopy = async () => {
    if (!inviteCode) return

    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = getShareUrl()
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleShare = async () => {
    if (!inviteCode) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Challenge me on Five-a-Side!',
          text: `${currentUserName} has challenged you to a game of Five-a-Side! Use code: ${inviteCode}`,
          url: getShareUrl(),
        })
      } catch {
        // User cancelled or share failed - that's ok
      }
    } else {
      // Fallback to copy
      handleCopy()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-gradient-to-b from-[#1a3409] to-[#2d5016] rounded-xl p-5 sm:p-6 max-w-md w-full border-2 border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Link2 className="w-5 h-5 text-blue-400" />
            Share Challenge Link
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!inviteCode ? (
          <>
            <p className="text-gray-300 mb-6">
              Create a shareable link that anyone can use to challenge you.
              They'll need to sign in or create an account to play.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={createLink}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-bold py-4 px-4 rounded-lg transition duration-300 text-lg text-white"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  Create Challenge Link
                </>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-gray-300 mb-2">Link created! Share it with your friend:</p>
            </div>

            {/* Code Display */}
            <div className="mb-4 p-4 bg-black/30 rounded-lg border border-white/10 text-center">
              <p className="text-sm text-gray-400 mb-2">Challenge Code</p>
              <p className="text-3xl font-bold text-white tracking-widest">{inviteCode}</p>
            </div>

            {/* URL Display */}
            <div className="mb-6 p-3 bg-black/30 rounded-lg border border-white/10">
              <p className="text-sm text-gray-400 break-all">{getShareUrl()}</p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 font-medium py-3 px-4 rounded-lg transition-colors text-white"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 font-medium py-3 px-4 rounded-lg transition-colors text-white"
              >
                <Share2 className="w-5 h-5" />
                Share
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center mt-4">
              Link expires in 72 hours
            </p>
          </>
        )}
      </div>
    </div>
  )
}
