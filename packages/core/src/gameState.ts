import type { RuntimeGameContent } from '@angelabc/ancadeba-content'

export interface GameState {
  currentLocationId: string
  inventoryItemIds: string[]
}

export function createInitialGameState(game: RuntimeGameContent): GameState {
  return {
    currentLocationId: game.start.locationId,
    inventoryItemIds: [],
  }
}
