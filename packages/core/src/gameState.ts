import type { RuntimeGameContent } from '@angelabc/ancadeba-content'

export interface GameState {
  currentLocationId: string
  inventoryItemIds: string[]
  completedInteractionIds: string[]
}

export function createInitialGameState(game: RuntimeGameContent): GameState {
  return {
    currentLocationId: game.start.locationId,
    inventoryItemIds: [],
    completedInteractionIds: [],
  }
}
