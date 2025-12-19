/**
 * League logo configuration using local images
 */
import type { LeagueId } from '../../types/user'

// Local logo paths (stored in public/logos/)
const LOGO_URLS: Record<LeagueId, string> = {
  'premier-league': '/logos/premier-league.png',
  'champions-league': '/logos/champions-league.png',
  'la-liga': '/logos/la-liga.png',
  'bundesliga': '/logos/bundesliga.png',
  'serie-a': '/logos/serie-a.png',
  'ligue-1': '/logos/ligue-1.png',
}

interface LeagueBadgeProps {
  leagueId: LeagueId
  className?: string
}

// Simple image component for league logos
export function LeagueBadge({ leagueId, className = 'w-8 h-8' }: LeagueBadgeProps) {
  return (
    <img
      src={LOGO_URLS[leagueId]}
      alt={LEAGUE_CONFIG[leagueId].name}
      className={`${className} object-contain`}
    />
  )
}

// Export league config
export const LEAGUE_CONFIG: Record<LeagueId, {
  name: string
  shortName: string
  logoUrl: string
  available: boolean
}> = {
  'premier-league': {
    name: 'Premier League',
    shortName: 'PL',
    logoUrl: LOGO_URLS['premier-league'],
    available: true,
  },
  'champions-league': {
    name: 'Champions League',
    shortName: 'UCL',
    logoUrl: LOGO_URLS['champions-league'],
    available: true,
  },
  'la-liga': {
    name: 'La Liga',
    shortName: 'LL',
    logoUrl: LOGO_URLS['la-liga'],
    available: false,
  },
  'bundesliga': {
    name: 'Bundesliga',
    shortName: 'BL',
    logoUrl: LOGO_URLS['bundesliga'],
    available: false,
  },
  'serie-a': {
    name: 'Serie A',
    shortName: 'SA',
    logoUrl: LOGO_URLS['serie-a'],
    available: false,
  },
  'ligue-1': {
    name: 'Ligue 1',
    shortName: 'L1',
    logoUrl: LOGO_URLS['ligue-1'],
    available: false,
  },
}

// Re-export the LeagueId type for convenience
export type { LeagueId }
