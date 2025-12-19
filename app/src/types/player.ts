export type PlayerCategory = 'modern' | 'legend' | 'obscure'
export type League = 'premier-league' | 'la-liga' | 'serie-a' | 'bundesliga' | 'ligue-1' | 'champions-league'

export interface Player {
  id: string
  name: string
  hint: string
  category: PlayerCategory
  league?: League // Optional for now, defaults to premier-league
  isActive: boolean
  createdAt?: Date
}

export interface PlayerWithMeta extends Player {
  timesGuessed?: number
  timesShown?: number
}
