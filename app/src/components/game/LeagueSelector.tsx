import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { LEAGUE_CONFIG, LeagueBadge } from '../icons/LeagueLogos'
import type { LeagueId } from '../../types/user'
import { ChevronDown, Lock } from 'lucide-react'

export function LeagueSelector() {
  const { selectedLeague, setSelectedLeague } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (leagueId: LeagueId) => {
    const league = LEAGUE_CONFIG[leagueId]
    if (!league.available) return
    setSelectedLeague(leagueId)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-gray-100 transition-colors shadow-lg"
      >
        <LeagueBadge leagueId={selectedLeague} className="w-8 h-8" />
        <ChevronDown className={`w-5 h-5 text-gray-700 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-3 right-0 z-[100] w-72 bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <p className="text-gray-800 text-sm font-bold uppercase tracking-wide">Select League</p>
          </div>
          <div className="p-2">
            {(Object.entries(LEAGUE_CONFIG) as [LeagueId, typeof LEAGUE_CONFIG[LeagueId]][]).map(
              ([id, league]) => {
                const isSelected = selectedLeague === id
                const isAvailable = league.available

                return (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    disabled={!isAvailable}
                    className={`
                      w-full flex items-center gap-4 px-4 py-3 rounded-xl mb-1 transition-all
                      ${
                        isSelected
                          ? 'bg-green-600 text-white'
                          : isAvailable
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <LeagueBadge leagueId={id} className="w-10 h-10" />
                    <div className="flex-1 text-left">
                      <span className={`text-base font-semibold ${!isAvailable ? 'text-gray-400' : ''}`}>
                        {league.name}
                      </span>
                    </div>
                    {!isAvailable && (
                      <div className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-lg">
                        <Lock className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-500 font-medium">Soon</span>
                      </div>
                    )}
                    {isSelected && isAvailable && (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    )}
                  </button>
                )
              }
            )}
          </div>
        </div>
      )}
    </div>
  )
}
