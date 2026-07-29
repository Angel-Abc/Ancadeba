import type { RuntimeGameContent } from '@angelabc/ancadeba-content'

export interface GameState {
  currentLocationId: string
  inventoryItemIds: string[]
  collectedItemIds: string[]
  completedInteractionIds: string[]
}

export function createInitialGameState(game: RuntimeGameContent): GameState {
  return {
    currentLocationId: game.start.locationId,
    inventoryItemIds: [],
    collectedItemIds: [],
    completedInteractionIds: [],
  }
}
