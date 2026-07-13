import type { GameManifest } from '../authored/gameManifest'
import {
  isGamePath,
  isIdentifier,
  isNonEmptyString,
  isRecord,
} from '../validation'

export function parseGameManifest(value: unknown): GameManifest {
  if (!isRecord(value)) {
    throw new Error('The game manifest must be a JSON object.')
  }

  const { formatVersion, id, title, description, content, start } = value

  if (formatVersion !== 1) {
    throw new Error(`Unsupported game format version: ${String(formatVersion)}`)
  }

  if (!isIdentifier(id)) {
    throw new Error('The game manifest must contain a lowercase game ID.')
  }

  if (!isNonEmptyString(title)) {
    throw new Error('The game manifest must contain a non-empty title.')
  }

  if (!isNonEmptyString(description)) {
    throw new Error('The game manifest must contain a non-empty description.')
  }

  if (!isRecord(content)) {
    throw new Error('The game manifest must contain a content object.')
  }

  if (!isGamePath(content.locations)) {
    throw new Error('The game manifest must contain a valid locations path.')
  }

  if (!isRecord(start)) {
    throw new Error('The game manifest must contain a start object.')
  }

  if (!isIdentifier(start.locationId)) {
    throw new Error(
      'The game manifest must contain a start.locationId that is a lowercase identifier.',
    )
  }

  return {
    formatVersion,
    id,
    title,
    description,
    content: {
      locations: content.locations,
    },
    start: {
      locationId: start.locationId,
    },
  }
}
