import {
  isGamePath,
  isIdentifier,
  isNonEmptyString,
  isRecord,
} from './validation.js'

export interface GameContent {
  locations: string
}

export interface GameManifest {
  formatVersion: 1
  id: string
  title: string
  description: string
  content: GameContent
}

export function parseGameManifest(value: unknown): GameManifest {
  if (!isRecord(value)) {
    throw new Error('The game manifest must be a JSON object.')
  }

  const { formatVersion, id, title, description, content } = value

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

  return {
    formatVersion,
    id,
    title,
    description,
    content: {
      locations: content.locations,
    },
  }
}
