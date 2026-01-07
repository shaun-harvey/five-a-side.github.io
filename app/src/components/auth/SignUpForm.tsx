import { useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { Eye, EyeOff, Wand2 } from 'lucide-react'

interface SignUpFormProps {
  onSwitchToLogin: () => void
}

// Generate a strong random password
function generatePassword(): string {
  const length = 16
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*'
  const allChars = lowercase + uppercase + numbers + symbols

  // Ensure at least one of each type
  let password = ''
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const { signUp, isLoading, error, clearError } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationError('')

    // Validation
    if (displayName.trim().length < 2) {
      setValidationError('Display name must be at least 2 characters')
      return
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters')
      return
    }

    try {
      await signUp(email, password, displayName.trim())
    } catch {
      // Error is handled by the store
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = generatePassword()
    setPassword(newPassword)
    setShowPassword(true) // Show the password so user can see it
  }

  const displayError = validationError || error

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          id="displayName"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          autoComplete="name"
          className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
          placeholder="Your name"
        />
      </div>

      <div>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
          placeholder="Email address"
        />
      </div>

      <div className="relative">
        <input
          id="password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          className="w-full p-4 pr-24 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
          placeholder="Password"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Show/Hide Password Toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-2.5 text-gray-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          {/* Password Generator Wand */}
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="p-2.5 text-trophy-gold hover:text-yellow-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Generate strong password"
          >
            <Wand2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {displayError && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {displayError}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 font-bold py-4 px-6 rounded-xl transition duration-300 text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 min-h-[52px]"
      >
        {isLoading ? 'Creating account...' : 'Enter the Pitch'}
      </button>

      <p className="text-center text-gray-400 text-base py-2">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-trophy-gold hover:underline font-medium"
        >
          Sign In
        </button>
      </p>
    </form>
  )
}
