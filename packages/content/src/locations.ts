import { isIdentifier, isNonEmptyString, isRecord } from './validation.js'

export interface ExitDefinition {
  id: string
  label: string
  targetLocationId: string
}

export interface LocationDefinition {
  id: string
  name: string
  description: string
  exits: ExitDefinition[]
}

export interface LocationsFile {
  startLocationId: string
  locations: LocationDefinition[]
}

function parseExit(value: unknown, index: number, locationIndex: number): ExitDefinition {
  if (!isRecord(value)) {
    throw new Error(`locations[${locationIndex}].exits[${index}] must be an object.`)
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

function parseLocation(value: unknown, index: number): LocationDefinition {
  if (!isRecord(value)) {
    throw new Error(`locations[${index}] must be an object.`)
  }

  const { id, name, description, exits } = value

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
  const parsedExits = exits.map((exit, exitIndex) => parseExit(exit, exitIndex, index))

  return {
    id,
    name,
    description,
    exits: parsedExits,
  }
}

export function parseLocationsFile(value: unknown): LocationsFile {
  if (!isRecord(value)) {
    throw new Error('The locations file must be a JSON object.')
  }

  if (!Array.isArray(value.locations)) {
    throw new Error('The locations file must contain a locations array.')
  }

  const startLocationId = value.startLocationId
  if (!isIdentifier(startLocationId)) {
    throw new Error(
      'The locations file must contain a startLocationId that is a lowercase identifier.',
    )
  }

  const locations = value.locations.map(parseLocation)
  const identifiers = new Set<string>()

  for (const location of locations) {
    if (identifiers.has(location.id)) {
      throw new Error(`Duplicate location ID: ${location.id}`)
    }

    identifiers.add(location.id)
  }

  if (!identifiers.has(startLocationId)) {
    throw new Error(
      `The startLocationId "${startLocationId}" does not match any location ID.`,
    )
  }

  for (const location of locations) {
    if (location.exits) {
      for (const exit of location.exits) {
        if (!identifiers.has(exit.targetLocationId)) {
          throw new Error(
            `The exit "${exit.id}" in location "${location.id}" has a targetLocationId "${exit.targetLocationId}" that does not match any location ID.`,
          )
        }
      }
    }
  }

  return {
    locations,
    startLocationId,
  }
}
