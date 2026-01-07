import { useState, type FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface LoginFormProps {
  onSwitchToSignUp: () => void
}

export function LoginForm({ onSwitchToSignUp }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, isLoading, error, clearError } = useAuth()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()

    try {
      await signIn(email, password)
    } catch {
      // Error is handled by the store
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full p-4 bg-white border-2 border-gray-300 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:border-green-500 transition-colors"
          placeholder="Password"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 font-bold py-4 px-6 rounded-xl transition duration-300 text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 min-h-[52px]"
      >
        {isLoading ? 'Signing in...' : 'Enter the Pitch'}
      </button>

      <p className="text-center text-gray-400 text-base py-2">
        Don't have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-trophy-gold hover:underline font-medium"
        >
          Sign Up
        </button>
      </p>
    </form>
  )
}
