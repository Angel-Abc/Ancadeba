import { isRecord } from '../validation'
import type { ItemDefinition, ItemsFile } from '../authored/itemsFile'
import { isIdentifier, isNonEmptyString } from '../validation'

export function parseItem(value: unknown, index: number): ItemDefinition {
  if (!isRecord(value)) {
    throw new Error(`items[${index}] must be an object.`)
  }
  const { id, name, description } = value

  if (!isIdentifier(id)) {
    throw new Error(`items[${index}].id must be a lowercase identifier.`)
  }

  if (!isNonEmptyString(name)) {
    throw new Error(`items[${index}].name must be a non-empty string.`)
  }

  if (!isNonEmptyString(description)) {
    throw new Error(`items[${index}].description must be a non-empty string.`)
  }

  return {
    id,
    name,
    description,
  }
}

export function parseItemsFile(value: unknown): ItemsFile {
  if (!isRecord(value)) {
    throw new Error(`Items file must be an object.`)
  }

  if (!Array.isArray(value.items)) {
    throw new Error(
      `Items file must have an "items" property that is an array.`,
    )
  }

  const items = value.items.map(parseItem)

  return {
    items,
  }
}
