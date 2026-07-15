import type {
  RuntimeExit,
  RuntimeGameContent,
  RuntimeLocation,
} from '@angelabc/ancadeba-content'
import type { GameState } from './gameState'

export type ExitAvailability =
  | { available: true }
  | { available: false; failureMessage: string }

export function followExit(
  game: RuntimeGameContent,
  state: GameState,
  exitId: string,
): GameState {
  const currentLocation = getCurrentLocation(game, state)
  const exit = currentLocation.exits.find((exit) => exit.id === exitId)

  if (!exit) {
    throw new Error(
      `Exit with id "${exitId}" not found in location "${currentLocation.id}".`,
    )
  }

  const exitAvailability = getExitAvailability(exit, state)

  if (!exitAvailability.available) {
    throw new Error(exitAvailability.failureMessage)
  }

  return {
    ...state,
    currentLocationId: exit.targetLocationId,
  }
}

export function getExitAvailability(
  exit: RuntimeExit,
  state: GameState,
): ExitAvailability {
  if (
    exit.requirement &&
    !state.inventoryItemIds.includes(exit.requirement.itemId)
  ) {
    return {
      available: false,
      failureMessage: exit.requirement.failureMessage,
    }
  }

  return { available: true }
}

export function getCurrentLocation(
  game: RuntimeGameContent,
  state: GameState,
): RuntimeLocation {
  const location = game.locations.get(state.currentLocationId)

  if (!location) {
    throw new Error(`Location with id "${state.currentLocationId}" not found.`)
  }

  return location
}
