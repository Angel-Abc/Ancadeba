import { describe, expect, it } from 'vitest'
import { parseLocationsFile } from '../src/index.js'

function createExit() {
  return {
    id: 'entrance-hall-to-main-hall',
    label: 'Pass through the brass doors',
    targetLocationId: 'main-hall',
  }
}

function createLocation() {
  return {
    id: 'entrance-hall',
    name: 'Entrance Hall',
    description: 'Dusty doors lead deeper into the observatory.',
    exits: [createExit()],
  }
}

function createSecondLocation() {
  return {
    id: 'main-hall',
    name: 'Main Hall',
    description: 'A large hall with a high ceiling and a grand staircase.',
    exits: [
      {
        id: 'main-hall-to-entrance-hall',
        label: 'Return to the entrance hall',
        targetLocationId: 'entrance-hall',
      },
    ],
  }
}

describe('parseLocationsFile', () => {
  it('parses a valid locations file', () => {
    const value = {
      locations: [createLocation(), createSecondLocation()],
    }

    expect(parseLocationsFile(value)).toEqual(value)
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

  it('rejects a missing exits array', () => {
    expect(() =>
      parseLocationsFile({
        locations: [
          {
            id: 'entrance-hall',
            name: 'Entrance Hall',
            description: 'Dusty doors lead deeper into the observatory.',
          },
          createSecondLocation(),
        ],
      }),
    ).toThrow('locations[0].exits must be an array of objects.')
  })
})
