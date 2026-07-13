import type {
  RuntimeGameContent,
  RuntimeLocation,
} from '@angelabc/ancadeba-content'

export interface GameState {
  currentLocationId: string
}

export function createInitialGameState(
  game: RuntimeGameContent,
): GameState {
  return {
    currentLocationId: game.start.locationId,
  }
}

export function getCurrentLocation(
  game: RuntimeGameContent,
  state: GameState,
): RuntimeLocation {
  const location = game.locations.get(state.currentLocationId)

  if (!location) {
    throw new Error(
      `Location with id "${state.currentLocationId}" not found.`,
    )
  }

  return location
}

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

  return {
    ...state,
    currentLocationId: exit.targetLocationId,
  }
}