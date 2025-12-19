import { useGameStore } from '../../store/gameStore'

export function PlayerCard() {
  const displayedName = useGameStore((state) => state.displayedName)
  const currentPlayer = useGameStore((state) => state.currentPlayer)

  if (!currentPlayer) {
    return (
      <div id="player-card" className="bg-pitch-green rounded-lg p-4 mb-4 shadow-inner border-2 border-white/30 stadium-glow">
        <div id="player-name" className="text-2xl sm:text-3xl font-bold text-center tracking-wider h-10 sm:h-12 font-mono text-white">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div id="player-card" className="bg-pitch-green rounded-lg p-4 mb-4 shadow-inner border-2 border-white/30 stadium-glow">
      <div id="player-name" className="text-2xl sm:text-3xl font-bold text-center tracking-wider h-10 sm:h-12 font-mono text-white flex items-center justify-center">
        {displayedName}
      </div>
    </div>
  )
}
