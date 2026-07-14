import { describe, expect, it } from 'vitest'
import { parseItemsFile } from '../src/index.js'

function createItem() {
  return {
    id: 'brass-key',
    name: 'Brass Key',
    description: 'A small brass key with intricate engravings.',
  }
}

describe('parseItemsFile', () => {
  it('parses a valid items file', () => {
    const value = {
      items: [createItem()],
    }

    expect(parseItemsFile(value)).toEqual(value)
  })

  it('rejects a value that is not an object', () => {
    expect(() => parseItemsFile([])).toThrow('Items file must be an object.')
  })

  it('rejects a missing items array', () => {
    expect(() => parseItemsFile({})).toThrow(
      'Items file must have an "items" property that is an array.',
    )
  })

  it('reports the index of an invalid item', () => {
    expect(() =>
      parseItemsFile({
        items: [createItem(), null],
      }),
    ).toThrow('items[1] must be an object.')
  })

  it('rejects an invalid item ID', () => {
    expect(() =>
      parseItemsFile({
        items: [
          {
            ...createItem(),
            id: 'Brass-Key',
          },
        ],
      }),
    ).toThrow('items[0].id must be a lowercase identifier.')
  })

  it('rejects an empty item name', () => {
    expect(() =>
      parseItemsFile({
        items: [
          {
            ...createItem(),
            name: ' ',
          },
        ],
      }),
    ).toThrow('items[0].name must be a non-empty string.')
  })

  it('rejects an empty item description', () => {
    expect(() =>
      parseItemsFile({
        items: [
          {
            ...createItem(),
            description: '',
          },
        ],
      }),
    ).toThrow('items[0].description must be a non-empty string.')
  })
})
