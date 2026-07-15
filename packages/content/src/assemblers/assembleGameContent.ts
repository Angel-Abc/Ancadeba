import type { GameManifest } from '../authored/gameManifest'
import type { ItemDefinition, ItemsFile } from '../authored/itemsFile'
import type { LocationsFile } from '../authored/locationsFile'
import type { RuntimeGameContent } from '../runtime/gameContent'
import type { RuntimeItem } from '../runtime/item'
import type { RuntimeLocation } from '../runtime/location'

export function assembleGameContent(
  manifest: GameManifest,
  locationsFile: LocationsFile,
  itemsFile: ItemsFile,
): RuntimeGameContent {
  const locations = new Map<string, RuntimeLocation>()
  const items = new Map<string, RuntimeItem>()

  for (const item of itemsFile.items) {
    if (items.has(item.id)) {
      throw new Error(`Duplicate item ID: ${item.id}`)
    }
    items.set(item.id, {
      id: item.id,
      name: item.name,
      description: item.description,
    })
  }

  const placedItemIds = new Set<string>()

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

      if (exit.requirement && !items.has(exit.requirement.itemId)) {
        throw new Error(
          `Exit "${exit.id}" in location "${location.id}" has a requirement for unknown item ID "${exit.requirement.itemId}".`,
        )
      }

      exitIds.add(exit.id)
    }

    const itemIds = new Set<string>()

    for (const itemPlacement of location.items) {
      if (!items.has(itemPlacement.itemId)) {
        throw new Error(
          `Item placement in location "${location.id}" references unknown item ID "${itemPlacement.itemId}".`,
        )
      }
      if (itemIds.has(itemPlacement.itemId)) {
        throw new Error(
          `Duplicate item placement for item ID "${itemPlacement.itemId}" in location "${location.id}".`,
        )
      }

      if (placedItemIds.has(itemPlacement.itemId)) {
        throw new Error(
          `Item ID "${itemPlacement.itemId}" is placed in multiple locations.`,
        )
      }

      itemIds.add(itemPlacement.itemId)
      placedItemIds.add(itemPlacement.itemId)
    }

    locations.set(location.id, {
      id: location.id,
      name: location.name,
      description: location.description,
      exits: location.exits.map((exit) => ({
        id: exit.id,
        label: exit.label,
        targetLocationId: exit.targetLocationId,
        requirement: exit.requirement
          ? {
              itemId: exit.requirement.itemId,
              failureMessage: exit.requirement.failureMessage,
            }
          : undefined,
      })),
      items: location.items.map((itemPlacement) => ({
        itemId: itemPlacement.itemId,
        takeLabel: itemPlacement.takeLabel,
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
    items,
  }
}
