import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Big 404 */}
        <h1 className="text-9xl font-bold text-white opacity-20">404</h1>

        {/* Message */}
        <div className="mt-[-2rem]">
          <h2 className="text-3xl font-bold text-white mb-4">
            Offside!
          </h2>
          <p className="text-lg text-gray-300 mb-8">
            Looks like you've wandered into the wrong part of the pitch.
            This page doesn't exist.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            <Home className="w-5 h-5" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
