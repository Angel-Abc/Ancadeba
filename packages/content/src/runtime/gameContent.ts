import type { RuntimeItem } from './item'
import type { RuntimeLocation } from './location'

interface Start {
  locationId: string
}

export interface RuntimeGameContent {
  gameId: string
  title: string
  description: string
  locations: Map<string, RuntimeLocation>
  items: Map<string, RuntimeItem>
  start: Start
}

