import type { ExitDefinition, ItemPlacementDefinition, LocationDefinition, LocationsFile } from '../authored/locationsFile'
import { isIdentifier, isNonEmptyString, isRecord } from '../validation'

function parseItemPlacement(
  value: unknown,
  index: number,
  locationIndex: number
): ItemPlacementDefinition {
  if (!isRecord(value)) {
    throw new Error(
      `locations[${locationIndex}].items[${index}] must be an object.`,
    )
  }
  const { itemId, takeLabel } = value

  if (!isIdentifier(itemId)) {
    throw new Error(
      `locations[${locationIndex}].items[${index}].itemId must be a lowercase identifier.`,
    )
  }

  if (!isNonEmptyString(takeLabel)) {
    throw new Error(
      `locations[${locationIndex}].items[${index}].takeLabel must be a non-empty string.`,
    )
  }

  return {
    itemId,
    takeLabel,
  }
}

function parseExit(
  value: unknown,
  index: number,
  locationIndex: number,
): ExitDefinition {
  if (!isRecord(value)) {
    throw new Error(
      `locations[${locationIndex}].exits[${index}] must be an object.`,
    )
  }
  const { id, label, targetLocationId } = value

  if (!isIdentifier(id)) {
    throw new Error(
      `locations[${locationIndex}].exits[${index}].id must be a lowercase identifier.`,
    )
  }

  if (!isNonEmptyString(label)) {
    throw new Error(
      `locations[${locationIndex}].exits[${index}].label must be a non-empty string.`,
    )
  }

  if (!isIdentifier(targetLocationId)) {
    throw new Error(
      `locations[${locationIndex}].exits[${index}].targetLocationId must be a lowercase identifier.`,
    )
  }

  return {
    id,
    label,
    targetLocationId,
  }
}

export function parseLocation(value: unknown, index: number): LocationDefinition {
  if (!isRecord(value)) {
    throw new Error(`locations[${index}] must be an object.`)
  }

  const { id, name, description, exits, items } = value

  if (!isIdentifier(id)) {
    throw new Error(`locations[${index}].id must be a lowercase identifier.`)
  }

  if (!isNonEmptyString(name)) {
    throw new Error(`locations[${index}].name must be a non-empty string.`)
  }

  if (!isNonEmptyString(description)) {
    throw new Error(
      `locations[${index}].description must be a non-empty string.`,
    )
  }

  if (!Array.isArray(exits)) {
    throw new Error(`locations[${index}].exits must be an array of objects.`)
  }
  if (!Array.isArray(items)) {
    throw new Error(`locations[${index}].items must be an array of objects.`)
  }

  const parsedExits = exits.map((exit, exitIndex) =>
    parseExit(exit, exitIndex, index),
  )

  const parsedItems = items.map((item, itemIndex) =>
    parseItemPlacement(item, itemIndex, index),
  )

  return {
    id,
    name,
    description,
    exits: parsedExits,
    items: parsedItems,
  }
}

export function parseLocationsFile(value: unknown): LocationsFile {
  if (!isRecord(value)) {
    throw new Error('The locations file must be a JSON object.')
  }

  if (!Array.isArray(value.locations)) {
    throw new Error('The locations file must contain a locations array.')
  }

  const locations = value.locations.map(parseLocation)

  return {
    locations
  }
}