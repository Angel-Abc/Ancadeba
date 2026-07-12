import type {
  LocationsFile,
  LocationDefinition,
} from '@angelabc/ancadeba-content'

export interface GameState {
  currentLocationId: string
}

export function createInitialGameState(
  locationsFile: LocationsFile,
): GameState {
  return {
    currentLocationId: locationsFile.startLocationId,
  }
}

export function getCurrentLocation(
  state: GameState,
  locationsFile: LocationsFile,
): LocationDefinition {
  const location = locationsFile.locations.find(
    (location) => location.id === state.currentLocationId,
  )

  if (!location) {
    throw new Error(`Location with id "${state.currentLocationId}" not found.`)
  }
  return location
}

export function moveToLocationUsingExit(
  state: GameState,
  locationsFile: LocationsFile,
  exitId: string,
): GameState {
  const currentLocation = getCurrentLocation(state, locationsFile)
  const exit = currentLocation.exits.find((exit) => exit.id === exitId)
  if (!exit) {
    throw new Error(
      `Exit with id "${exitId}" not found in location "${currentLocation.id}".`,
    )
  }

  const newState = {
    ...state,
    currentLocationId: exit.targetLocationId,
  }
  return newState
}
