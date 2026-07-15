import { describe, expect, it } from 'vitest'
import {
  parseLocationsFile,
  type LocationDefinition,
} from '../src/index.js'

function createExit() {
  return {
    id: 'entrance-hall-to-main-hall',
    label: 'Pass through the brass doors',
    targetLocationId: 'main-hall',
  }
}

function createLocation(): LocationDefinition {
  return {
    id: 'entrance-hall',
    name: 'Entrance Hall',
    description: 'Dusty doors lead deeper into the observatory.',
    exits: [createExit()],
    items: [],
  }
}

function createSecondLocation(): LocationDefinition {
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
    items: [
      {
        itemId: 'brass-key',
        takeLabel: 'Pull the brass key from beneath the staircase',
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

  it('parses a valid exit item requirement', () => {
    const value = {
      locations: [
        {
          ...createLocation(),
          exits: [
            {
              ...createExit(),
              requirement: {
                itemId: 'brass-key',
                failureMessage: 'The door is locked.',
              },
            },
          ],
        },
      ],
    }

    expect(parseLocationsFile(value)).toEqual(value)
  })

  it('rejects an exit requirement that is not an object', () => {
    expect(() =>
      parseLocationsFile({
        locations: [
          {
            ...createLocation(),
            exits: [
              {
                ...createExit(),
                requirement: 'brass-key',
              },
            ],
          },
        ],
      }),
    ).toThrow('locations[0].exits[0].requirement must be an object.')
  })

  it('rejects an invalid exit requirement item ID', () => {
    expect(() =>
      parseLocationsFile({
        locations: [
          {
            ...createLocation(),
            exits: [
              {
                ...createExit(),
                requirement: {
                  itemId: 'Brass-Key',
                  failureMessage: 'The door is locked.',
                },
              },
            ],
          },
        ],
      }),
    ).toThrow(
      'locations[0].exits[0].requirement.itemId must be a lowercase identifier.',
    )
  })

  it('rejects an empty exit requirement failure message', () => {
    expect(() =>
      parseLocationsFile({
        locations: [
          {
            ...createLocation(),
            exits: [
              {
                ...createExit(),
                requirement: {
                  itemId: 'brass-key',
                  failureMessage: ' ',
                },
              },
            ],
          },
        ],
      }),
    ).toThrow(
      'locations[0].exits[0].requirement.failureMessage must be a non-empty string.',
    )
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
            items: [],
          },
          createSecondLocation(),
        ],
      }),
    ).toThrow('locations[0].exits must be an array of objects.')
  })

  it('rejects a missing items array', () => {
    const location = createLocation()
    const { items: _items, ...locationWithoutItems } = location

    expect(() =>
      parseLocationsFile({
        locations: [locationWithoutItems],
      }),
    ).toThrow('locations[0].items must be an array of objects.')
  })

  it('reports the index of an invalid item placement', () => {
    const location = createLocation()
    location.items.push(null as never)

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow('locations[0].items[0] must be an object.')
  })

  it('rejects an invalid item placement ID', () => {
    const location = createLocation()
    location.items.push({
      itemId: 'Brass-Key',
      takeLabel: 'Take the brass key',
    })

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow(
      'locations[0].items[0].itemId must be a lowercase identifier.',
    )
  })

  it('rejects an empty item placement label', () => {
    const location = createLocation()
    location.items.push({
      itemId: 'brass-key',
      takeLabel: ' ',
    })

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow(
      'locations[0].items[0].takeLabel must be a non-empty string.',
    )
  })
})
