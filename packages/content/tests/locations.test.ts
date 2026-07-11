import { describe, expect, it } from 'vitest'
import { parseLocationsFile } from '../src/index.js'

function createLocation() {
  return {
    id: 'entrance-hall',
    name: 'Entrance Hall',
    description: 'Dusty doors lead deeper into the observatory.',
  }
}

describe('parseLocationsFile', () => {
  it('parses a valid locations file', () => {
    const value = {
      locations: [createLocation()],
    }

    expect(parseLocationsFile(value)).toEqual(value)
  })

  it('allows an empty locations array', () => {
    expect(
      parseLocationsFile({
        locations: [],
      }),
    ).toEqual({
      locations: [],
    })
  })

  it('rejects a missing locations array', () => {
    expect(() => parseLocationsFile({})).toThrow(
      'The locations file must contain a locations array.',
    )
  })

  it('reports the index of an invalid location', () => {
    expect(() =>
      parseLocationsFile({
        locations: [createLocation(), null],
      }),
    ).toThrow('locations[1] must be an object.')
  })

  it('rejects duplicate location IDs', () => {
    expect(() =>
      parseLocationsFile({
        locations: [
          createLocation(),
          {
            ...createLocation(),
            name: 'Another Entrance Hall',
          },
        ],
      }),
    ).toThrow('Duplicate location ID: entrance-hall')
  })
})
