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
        },
      }),
    ).toThrow(
      'The game manifest must contain a valid locations path.',
    )
  })
})
