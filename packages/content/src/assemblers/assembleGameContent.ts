import type { GameManifest } from '../authored/gameManifest'
import type { LocationsFile } from '../authored/locationsFile'
import type { RuntimeGameContent } from '../runtime/gameContent'
import type { RuntimeLocation } from '../runtime/location'

export function assembleGameContent(
  manifest: GameManifest,
  locationsFile: LocationsFile,
): RuntimeGameContent {
  const locations = new Map<string, RuntimeLocation>()

  for (const location of locationsFile.locations) {
    if (locations.has(location.id)) {
      throw new Error(`Duplicate location ID: ${location.id}`)
    }

    const exitIds = new Set<string>()

    for (const exit of location.exits) {
      if (exitIds.has(exit.id)) {
        throw new Error(
          `Duplicate exit ID "${exit.id}" in location "${location.id}".`,
        )
      }

      exitIds.add(exit.id)
    }

    locations.set(location.id, {
      id: location.id,
      name: location.name,
      description: location.description,
      exits: location.exits.map((exit) => ({
        id: exit.id,
        label: exit.label,
        targetLocationId: exit.targetLocationId,
      })),
    })
  }

  if (!locations.has(manifest.start.locationId)) {
    throw new Error(
      `The start.locationId "${manifest.start.locationId}" does not match any location ID.`,
    )
  }

  for (const location of locations.values()) {
    for (const exit of location.exits) {
      if (!locations.has(exit.targetLocationId)) {
        throw new Error(
          `The exit "${exit.id}" in location "${location.id}" has a targetLocationId "${exit.targetLocationId}" that does not match any location ID.`,
        )
      }
    }
  }

  return {
    gameId: manifest.id,
    title: manifest.title,
    description: manifest.description,
    start: {
      locationId: manifest.start.locationId,
    },
    locations,
  }
}
