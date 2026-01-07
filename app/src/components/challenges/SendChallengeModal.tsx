import { useState, useEffect, useRef } from 'react'
import { useChallengeStore } from '../../store/challengeStore'
import { X, Search, Loader2, Send, User } from 'lucide-react'
import type { PublicProfile } from '../../lib/firebase/challenges'

interface SendChallengeModalProps {
  currentUserId: string
  currentUserName: string
  currentUserPhotoURL?: string
  onClose: () => void
}

export function SendChallengeModal({
  currentUserId,
  currentUserName,
  currentUserPhotoURL,
  onClose,
}: SendChallengeModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<PublicProfile | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    searchResults,
    isSearching,
    searchUsers,
    clearSearchResults,
    sendChallenge,
  } = useChallengeStore()

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Search when term changes
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm.trim().length >= 2) {
        searchUsers(searchTerm.trim(), currentUserId)
      } else {
        clearSearchResults()
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchTerm, currentUserId, searchUsers, clearSearchResults])

  const handleSelectUser = (user: PublicProfile) => {
    setSelectedUser(user)
    setSearchTerm('')
    clearSearchResults()
  }

  const handleClearSelection = () => {
    setSelectedUser(null)
    setError(null)
    inputRef.current?.focus()
  }

  const handleSendChallenge = async () => {
    if (!selectedUser) return

    setIsSending(true)
    setError(null)

    try {
      await sendChallenge(
        currentUserId,
        currentUserName,
        currentUserPhotoURL,
        selectedUser.id,
        selectedUser.displayName,
        selectedUser.photoURL
      )
      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send challenge')
    } finally {
      setIsSending(false)
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
          <h2 className="text-xl font-bold text-white">Challenge a Friend</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-xl font-bold text-white mb-2">Challenge Sent!</p>
            <p className="text-gray-400">
              Waiting for {selectedUser?.displayName} to accept...
            </p>
          </div>
        )}

        {/* Main Content */}
        {!success && (
          <>
            {/* Selected User */}
            {selectedUser ? (
              <div className="mb-6 p-4 bg-black/30 rounded-lg border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedUser.photoURL ? (
                      <img
                        src={selectedUser.photoURL}
                        alt={selectedUser.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold border-2 border-green-500">
                        {selectedUser.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">{selectedUser.displayName}</p>
                      <p className="text-xs text-green-400">Ready to challenge</p>
                    </div>
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Search Input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by username..."
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mb-4 max-h-60 overflow-y-auto rounded-lg border border-white/10 divide-y divide-white/10">
                    {searchResults.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-white/10 transition-colors text-left"
                      >
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-full object-cover border border-white/20"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold border border-white/20">
                            {user.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium text-white">{user.displayName}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {searchTerm.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No users found</p>
                    <p className="text-sm text-gray-500">Try a different search term</p>
                  </div>
                )}

                {/* Initial State */}
                {searchTerm.length < 2 && (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Search for a friend to challenge</p>
                    <p className="text-sm text-gray-500">Enter at least 2 characters</p>
                  </div>
                )}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Send Button */}
            <button
              onClick={handleSendChallenge}
              disabled={!selectedUser || isSending}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed font-bold py-4 px-4 rounded-lg transition duration-300 text-lg text-white"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send Challenge
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
