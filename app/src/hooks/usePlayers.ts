import { useEffect, useState, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import type { Player } from '../types/player'
// Import local players - this is the primary data source for database efficiency
import localPlayers from '../data/players.json'

/**
 * Hook to load players from local JSON data
 *
 * Database Efficiency: Using local JSON means zero Firestore reads for player data.
 * Players are bundled with the app and load instantly.
 *
 * To add new players, update the players.json file and redeploy.
 */
export function usePlayers() {
  const [isLoaded, setIsLoaded] = useState(false)

  const players = useGameStore((state) => state.players)
  const setPlayers = useGameStore((state) => state.setPlayers)

  const loadPlayers = useCallback(() => {
    // Check if already loaded
    if (players.modern.length > 0 || players.legend.length > 0 || players.obscure.length > 0) {
      setIsLoaded(true)
      return
    }

    // Convert local JSON to Player format
    const modernPlayers: Player[] = localPlayers.modern.map((p, i) => ({
      id: `modern-${i}`,
      name: p.name,
      hint: p.hint,
      category: 'modern' as const,
      league: (p as { league?: string }).league as Player['league'],
      isActive: true,
    }))

    const legendPlayers: Player[] = localPlayers.legend.map((p, i) => ({
      id: `legend-${i}`,
      name: p.name,
      hint: p.hint,
      category: 'legend' as const,
      league: (p as { league?: string }).league as Player['league'],
      isActive: true,
    }))

    const obscurePlayers: Player[] = localPlayers.obscure.map((p, i) => ({
      id: `obscure-${i}`,
      name: p.name,
      hint: p.hint,
      category: 'obscure' as const,
      league: (p as { league?: string }).league as Player['league'],
      isActive: true,
    }))

    setPlayers('modern', modernPlayers)
    setPlayers('legend', legendPlayers)
    setPlayers('obscure', obscurePlayers)
    setIsLoaded(true)
  }, [players, setPlayers])

  // Load on mount (instant since it's from bundled JSON)
  useEffect(() => {
    loadPlayers()
  }, [loadPlayers])

  return {
    players,
    isLoaded,
    isLoading: !isLoaded,
    dataSource: 'local' as const,
    reload: loadPlayers,
    playerCounts: {
      modern: players.modern.length,
      legend: players.legend.length,
      obscure: players.obscure.length,
      total:
        players.modern.length +
        players.legend.length +
        players.obscure.length,
    },
  }
}
