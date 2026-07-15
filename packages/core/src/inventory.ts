import type {
  RuntimeGameContent,
  RuntimeItemPlacement,
  RuntimeItem,
} from '@angelabc/ancadeba-content'
import type { GameState } from './gameState'
import { getCurrentLocation } from './navigation'

export function getAvailableItemPlacements(
  game: RuntimeGameContent,
  state: GameState,
): RuntimeItemPlacement[] {
  const currentLocation = getCurrentLocation(game, state)
  const availableItemPlacements = currentLocation.items.filter(
    (item) => !state.inventoryItemIds.includes(item.itemId),
  )
  return availableItemPlacements
}

export function getItem(game: RuntimeGameContent, itemId: string): RuntimeItem {
  const item = game.items.get(itemId)
  if (!item) {
    throw new Error(`Item with id "${itemId}" not found.`)
  }
  return item
}

export function getInventoryItems(
  game: RuntimeGameContent,
  state: GameState,
): RuntimeItem[] {
  const inventoryItems = state.inventoryItemIds.map((itemId) =>
    getItem(game, itemId),
  )
  return inventoryItems
}

export function takeItem(
  game: RuntimeGameContent,
  state: GameState,
  itemId: string,
): GameState {
  if (state.inventoryItemIds.includes(itemId)) {
    throw new Error(`Item with id "${itemId}" is already in the inventory.`)
  }
  const availableItemPlacements = getAvailableItemPlacements(game, state)
  const itemPlacement = availableItemPlacements.find(
    (item) => item.itemId === itemId,
  )
  if (!itemPlacement) {
    throw new Error(
      `Item with id "${itemId}" not found in location "${getCurrentLocation(game, state).id}".`,
    )
  }

  return {
    ...state,
    inventoryItemIds: [...state.inventoryItemIds, itemId],
  }
}
