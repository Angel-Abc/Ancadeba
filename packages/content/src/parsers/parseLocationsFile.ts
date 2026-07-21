import type {
  ExitDefinition,
  ExitRequirementDefinition,
  InteractionDefinition,
  InteractionRequirementDefinition,
  ItemPlacementDefinition,
  LocationDefinition,
  LocationsFile,
} from '../authored/locationsFile'
import { isIdentifier, isNonEmptyString, isRecord } from '../validation'

function parseItemPlacement(
  value: unknown,
  index: number,
  locationIndex: number,
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

function parseExitRequirement(
  value: unknown,
  index: number,
  locationIndex: number,
): ExitRequirementDefinition | undefined {
  if (value === undefined) {
    return undefined
  }

  if (!isRecord(value)) {
    throw new Error(
      `locations[${locationIndex}].exits[${index}].requirement must be an object.`,
    )
  }

  const { type } = value

  if (type === 'item') {
    const { itemId, failureMessage } = value

    if (!isIdentifier(itemId)) {
      throw new Error(
        `locations[${locationIndex}].exits[${index}].requirement.itemId must be a lowercase identifier.`,
      )
    }

    if (!isNonEmptyString(failureMessage)) {
      throw new Error(
        `locations[${locationIndex}].exits[${index}].requirement.failureMessage must be a non-empty string.`,
      )
    }

    return {
      type: 'item',
      itemId,
      failureMessage,
    }
  }

  if (type === 'completed-interaction') {
    const { interactionId, failureMessage } = value

    if (!isIdentifier(interactionId)) {
      throw new Error(
        `locations[${locationIndex}].exits[${index}].requirement.interactionId must be a lowercase identifier.`,
      )
    }

    if (!isNonEmptyString(failureMessage)) {
      throw new Error(
        `locations[${locationIndex}].exits[${index}].requirement.failureMessage must be a non-empty string.`,
      )
    }

    return {
      type: 'completed-interaction',
      interactionId,
      failureMessage,
    }
  }

  throw new Error(
    `locations[${locationIndex}].exits[${index}].requirement.type must be either "item" or "completed-interaction".`,
  )
}

function parseInteractionRequirement(
  value: unknown,
  index: number,
  locationIndex: number,
): InteractionRequirementDefinition | undefined {
  if (value === undefined) {
    return undefined
  }
  if (!isRecord(value)) {
    throw new Error(
      `locations[${locationIndex}].interactions[${index}].requirement must be an object.`,
    )
  }

  const { itemId, failureMessage } = value

  if (!isIdentifier(itemId)) {
    throw new Error(
      `locations[${locationIndex}].interactions[${index}].requirement.itemId must be a lowercase identifier.`,
    )
  }

  if (!isNonEmptyString(failureMessage)) {
    throw new Error(
      `locations[${locationIndex}].interactions[${index}].requirement.failureMessage must be a non-empty string.`,
    )
  }

  return {
    itemId,
    failureMessage,
  }
}

function parseInteraction(
  value: unknown,
  index: number,
  locationIndex: number,
): InteractionDefinition {
  if (!isRecord(value)) {
    throw new Error(
      `locations[${locationIndex}].interactions[${index}] must be an object.`,
    )
  }
  const { id, label, completionMessage } = value

  if (!isIdentifier(id)) {
    throw new Error(
      `locations[${locationIndex}].interactions[${index}].id must be a lowercase identifier.`,
    )
  }

  if (!isNonEmptyString(label)) {
    throw new Error(
      `locations[${locationIndex}].interactions[${index}].label must be a non-empty string.`,
    )
  }

  if (!isNonEmptyString(completionMessage)) {
    throw new Error(
      `locations[${locationIndex}].interactions[${index}].completionMessage must be a non-empty string.`,
    )
  }

  const requirement = parseInteractionRequirement(
    value.requirement,
    index,
    locationIndex,
  )

  return {
    id,
    label,
    completionMessage,
    requirement,
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

  const requirement = parseExitRequirement(
    value.requirement,
    index,
    locationIndex,
  )

  return {
    id,
    label,
    targetLocationId,
    requirement,
  }
}

export function parseLocation(
  value: unknown,
  index: number,
): LocationDefinition {
  if (!isRecord(value)) {
    throw new Error(`locations[${index}] must be an object.`)
  }

  const { id, name, description, exits, items, interactions } = value

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
  if (!Array.isArray(interactions)) {
    throw new Error(
      `locations[${index}].interactions must be an array of objects.`,
    )
  }

  const parsedExits = exits.map((exit, exitIndex) =>
    parseExit(exit, exitIndex, index),
  )

  const parsedItems = items.map((item, itemIndex) =>
    parseItemPlacement(item, itemIndex, index),
  )

  const parsedInteractions = interactions.map((interaction, interactionIndex) =>
    parseInteraction(interaction, interactionIndex, index),
  )

  return {
    id,
    name,
    description,
    exits: parsedExits,
    items: parsedItems,
    interactions: parsedInteractions,
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
    locations,
  }
}
