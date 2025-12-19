import { Component, type ReactNode } from 'react'
import { RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-deep-green to-stadium">
          <div className="text-center max-w-md">
            {/* Error Icon */}
            <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-5xl">⚠️</span>
            </div>

            {/* Message */}
            <h1 className="text-3xl font-bold text-white mb-4">
              VAR Check Failed!
            </h1>
            <p className="text-lg text-gray-300 mb-8">
              Something went wrong on the pitch. The referee is reviewing the situation.
            </p>

            {/* Error details (collapsed) */}
            {this.state.error && (
              <details className="mb-6 text-left bg-black/30 rounded-lg p-4">
                <summary className="text-gray-400 cursor-pointer hover:text-white">
                  Technical details
                </summary>
                <pre className="mt-2 text-xs text-red-400 overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-lg transition duration-300"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
