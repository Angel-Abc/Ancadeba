import {
  isIdentifier,
  isNonEmptyString,
  isRecord,
} from './validation.js'

export interface LocationDefinition {
  id: string
  name: string
  description: string
}

export interface LocationsFile {
  locations: LocationDefinition[]
}

function parseLocation(
  value: unknown,
  index: number,
): LocationDefinition {
  if (!isRecord(value)) {
    throw new Error(`locations[${index}] must be an object.`)
  }

  const { id, name, description } = value

  if (!isIdentifier(id)) {
    throw new Error(
      `locations[${index}].id must be a lowercase identifier.`,
    )
  }

  if (!isNonEmptyString(name)) {
    throw new Error(
      `locations[${index}].name must be a non-empty string.`,
    )
  }

  if (!isNonEmptyString(description)) {
    throw new Error(
      `locations[${index}].description must be a non-empty string.`,
    )
  }

  return {
    id,
    name,
    description,
  }
}

export function parseLocationsFile(value: unknown): LocationsFile {
  if (!isRecord(value)) {
    throw new Error('The locations file must be a JSON object.')
  }

  if (!Array.isArray(value.locations)) {
    throw new Error(
      'The locations file must contain a locations array.',
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

  return {
    locations,
  }
}