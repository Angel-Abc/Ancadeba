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
      startLocationId: 'entrance-hall',
      locations: [createLocation(), createSecondLocation()],
    }

    expect(parseLocationsFile(value)).toEqual(value)
  })

  it('rejects a missing locations array', () => {
    expect(() =>
      parseLocationsFile({
        startLocationId: 'entrance-hall',
      }),
    ).toThrow(
      'The locations file must contain a locations array.',
    )
  })

  it('rejects a missing startLocationId', () => {
    expect(() =>
      parseLocationsFile({
        locations: [createLocation(), createSecondLocation()],
      }),
    ).toThrow(
      'The locations file must contain a startLocationId that is a lowercase identifier.',
    )
  })

  it('rejects a startLocationId that does not exist', () => {
    expect(() =>
      parseLocationsFile({
        startLocationId: 'unknown-location',
        locations: [createLocation(), createSecondLocation()],
      }),
    ).toThrow(
      'The startLocationId "unknown-location" does not match any location ID.',
    )
  })

  it('reports the index of an invalid location', () => {
    expect(() =>
      parseLocationsFile({
        startLocationId: 'entrance-hall',
        locations: [createLocation(), null],
      }),
    ).toThrow('locations[1] must be an object.')
  })

  it('rejects duplicate location IDs', () => {
    expect(() =>
      parseLocationsFile({
        startLocationId: 'entrance-hall',
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

  it('rejects a missing exits array', () => {
    expect(() =>
      parseLocationsFile({
        startLocationId: 'entrance-hall',
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

  it('rejects an exit that targets an unknown location', () => {
    expect(() =>
      parseLocationsFile({
        startLocationId: 'entrance-hall',
        locations: [
          {
            ...createLocation(),
            exits: [
              {
                ...createExit(),
                targetLocationId: 'missing-room',
              },
            ],
          },
          createSecondLocation(),
        ],
      }),
    ).toThrow(
      'The exit "entrance-hall-to-main-hall" in location "entrance-hall" has a targetLocationId "missing-room" that does not match any location ID.',
    )
  })
})
