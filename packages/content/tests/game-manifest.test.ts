import { describe, expect, it } from 'vitest'
import { parseGameManifest } from '../src/index.js'

function createManifest(): Record<string, unknown> {
  return {
    formatVersion: 1,
    id: 'locked-observatory',
    title: 'The Locked Observatory',
    description: 'A mysterious observatory.',
    content: {
      locations: 'data/locations.json',
      items: 'data/items.json',
    },
    start: {
      locationId: 'entrance-hall',
    },
  }
}

describe('parseGameManifest', () => {
  it('parses a valid manifest', () => {
    expect(parseGameManifest(createManifest())).toEqual(createManifest())
  })

  it('rejects a value that is not an object', () => {
    expect(() => parseGameManifest([])).toThrow(
      'The game manifest must be a JSON object.',
    )
  })

  it('rejects an unsupported format version', () => {
    expect(() =>
      parseGameManifest({
        ...createManifest(),
        formatVersion: 2,
      }),
    ).toThrow('Unsupported game format version: 2')
  })

  it('rejects an invalid game ID', () => {
    expect(() =>
      parseGameManifest({
        ...createManifest(),
        id: 'Locked-Observatory',
      }),
    ).toThrow('The game manifest must contain a lowercase game ID.')
  })

  it('rejects a missing start object', () => {
    expect(() =>
      parseGameManifest({
        ...createManifest(),
        start: undefined,
      }),
    ).toThrow('The game manifest must contain a start object.')
  })

  it('rejects an invalid start location ID', () => {
    expect(() =>
      parseGameManifest({
        ...createManifest(),
        start: {
          locationId: 'Entrance-Hall',
        },
      }),
    ).toThrow(
      'The game manifest must contain a start.locationId that is a lowercase identifier.',
    )
  })

  it.each([
    'Data/locations.json',
    '../locations.json',
    '/data/locations.json',
    'data\\locations.json',
  ])('rejects the invalid game path %s', (locations) => {
    expect(() =>
      parseGameManifest({
        ...createManifest(),
        content: {
          locations,
          items: 'data/items.json',
        },
      }),
    ).toThrow(
      'The game manifest must contain a valid locations path.',
    )
  })

  it.each([
    'Data/items.json',
    '../items.json',
    '/data/items.json',
    'data\\items.json',
  ])('rejects the invalid items path %s', (items) => {
    expect(() =>
      parseGameManifest({
        ...createManifest(),
        content: {
          locations: 'data/locations.json',
          items,
        },
      }),
    ).toThrow('The game manifest must contain a valid items path.')
  })
})
