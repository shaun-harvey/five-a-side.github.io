import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateUserProfile } from '../lib/firebase/firestore'
import { uploadUserAvatar } from '../lib/firebase/storage'
import { Save, LogOut, Camera, Check, Trash2, AlertTriangle } from 'lucide-react'
import { LoadingSpinner } from '../components/common/LoadingSpinner'

// Compress and resize image for avatar
async function compressImage(file: File, maxSize: number = 256): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width)
          width = maxSize
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height)
          height = maxSize
        }
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      // Use high quality image rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to blob with JPEG compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'))
            return
          }
          // Create new file from blob
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        'image/jpeg',
        0.85 // High quality compression
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, profile, isAuthenticated, isInitialized, refreshProfile, signOut, deleteAccount } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login')
    }
  }, [isInitialized, isAuthenticated, navigate])

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '')
    }
  }, [profile])

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setSaveMessage({ type: 'error', text: 'Please select an image file.' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setSaveMessage({ type: 'error', text: 'Image must be less than 5MB.' })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    setAvatarFile(file)
  }

  const handleSave = async () => {
    if (!user || !displayName.trim()) return

    setIsSaving(true)
    setSaveMessage(null)

    try {
      let photoURL = profile?.photoURL

      // Upload avatar if a new one was selected
      if (avatarFile) {
        setIsUploadingAvatar(true)
        // Compress image before uploading for optimal quality and size
        const compressedFile = await compressImage(avatarFile, 256)
        photoURL = await uploadUserAvatar(user.uid, compressedFile)
        setIsUploadingAvatar(false)
        setAvatarFile(null)
      }

      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        ...(photoURL && { photoURL }),
      })
      await refreshProfile()
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      console.error('Failed to update profile:', error)
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
    } finally {
      setIsSaving(false)
      setIsUploadingAvatar(false)
    }
  }

  const handleSignOut = () => {
    signOut()
    navigate('/')
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return

    setIsDeleting(true)
    try {
      await deleteAccount()
      navigate('/')
    } catch (error) {
      console.error('Failed to delete account:', error)
      setSaveMessage({ type: 'error', text: 'Failed to delete account. Please try again.' })
      setShowDeleteConfirm(false)
    } finally {
      setIsDeleting(false)
    }
  }

  // Get current avatar URL (preview > profile photo > null)
  const currentAvatarUrl = avatarPreview || profile?.photoURL || null

  if (!isInitialized) {
    return <LoadingSpinner />
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      {/* Main Container - Stadium themed card */}
      <div className="bg-stadium rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-lg border-2 border-white/30 grass-texture">
        {/* Title */}
        <h1 className="text-2xl sm:text-4xl font-bold text-center text-white mb-6 sm:mb-8 stadium-lights">
          Settings
        </h1>

        {/* Profile Section */}
        <div className="mb-6 sm:mb-8">
          {/* Avatar with upload option */}
          <div className="flex flex-col items-center mb-5 sm:mb-6">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="relative group min-w-[88px] min-h-[88px]"
            >
              {currentAvatarUrl ? (
                <img
                  src={currentAvatarUrl}
                  alt="Avatar"
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-white/30 group-hover:border-green-500 transition-colors"
                />
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-600 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white border-4 border-white/30 group-hover:border-green-500 transition-colors">
                  {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              {/* Camera overlay */}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              {/* Pending upload indicator */}
              {avatarFile && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-gray-400 text-sm mt-2">Click to change avatar</p>
            {avatarFile && (
              <p className="text-yellow-400 text-xs mt-1">New avatar selected - click Save to apply</p>
            )}
          </div>

          {/* User info */}
          <div className="text-center mb-5 sm:mb-6">
            <p className="text-white font-bold text-base sm:text-lg">{displayName || 'Set your name'}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
          </div>

          {/* Display Name Input */}
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="w-full p-4 bg-deep-green border-2 border-white/30 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                maxLength={30}
              />
              <p className="text-gray-500 text-xs mt-1">Max 30 characters</p>
            </div>

            {/* Save Message */}
            {saveMessage && (
              <div
                className={`p-4 rounded-xl text-sm text-center font-medium ${
                  saveMessage.type === 'success'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving || !displayName.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/20 text-base sm:text-lg min-h-[52px]"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  {isUploadingAvatar ? 'Uploading avatar...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={handleSignOut}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/20 text-base sm:text-lg min-h-[52px]"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        {/* Delete Account Button */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full mt-4 bg-transparent hover:bg-red-900/30 text-red-400 font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-red-500/30 min-h-[48px]"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-stadium rounded-xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-sm border-2 border-red-500/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">Delete Account</h3>
                <p className="text-xs sm:text-sm text-gray-400">This cannot be undone</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3 sm:mb-4">
              This will permanently delete your account and all your data including:
            </p>
            <ul className="text-gray-400 text-sm mb-3 sm:mb-4 list-disc list-inside space-y-1">
              <li>Your profile and avatar</li>
              <li>All your game stats</li>
              <li>Your leaderboard entries</li>
            </ul>

            <p className="text-gray-300 text-sm mb-2">
              Type <span className="font-bold text-red-400">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full p-4 bg-deep-green border-2 border-red-500/30 rounded-xl text-white text-base placeholder-gray-500 focus:outline-none focus:border-red-500 mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-4 px-4 rounded-xl transition-colors min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 min-h-[48px]"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
