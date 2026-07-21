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
    interactions: [],
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
    interactions: [],
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
                type: 'item',
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

  it('parses a valid completed-interaction exit requirement', () => {
    const value = {
      locations: [
        {
          ...createLocation(),
          exits: [
            {
              ...createExit(),
              requirement: {
                type: 'completed-interaction',
                interactionId: 'repair-observatory-telescope',
                failureMessage: 'The telescope must be repaired.',
              },
            },
          ],
        },
      ],
    }

    expect(parseLocationsFile(value)).toEqual(value)
  })

  it('parses a valid interaction with an item requirement', () => {
    const value = {
      locations: [
        {
          ...createLocation(),
          interactions: [
            {
              id: 'repair-observatory-telescope',
              label: 'Repair the telescope',
              completionMessage: 'The telescope is repaired.',
              requirement: {
                itemId: 'telescope-lens',
                failureMessage: 'You need the telescope lens.',
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
                  type: 'item',
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
                  type: 'item',
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

  it('rejects an invalid completed-interaction requirement ID', () => {
    expect(() =>
      parseLocationsFile({
        locations: [
          {
            ...createLocation(),
            exits: [
              {
                ...createExit(),
                requirement: {
                  type: 'completed-interaction',
                  interactionId: 'Repair-Telescope',
                  failureMessage: 'The telescope must be repaired.',
                },
              },
            ],
          },
        ],
      }),
    ).toThrow(
      'locations[0].exits[0].requirement.interactionId must be a lowercase identifier.',
    )
  })

  it('rejects an unknown exit requirement type', () => {
    expect(() =>
      parseLocationsFile({
        locations: [
          {
            ...createLocation(),
            exits: [
              {
                ...createExit(),
                requirement: {
                  type: 'quest',
                  failureMessage: 'Complete the quest first.',
                },
              },
            ],
          },
        ],
      }),
    ).toThrow(
      'locations[0].exits[0].requirement.type must be either "item" or "completed-interaction".',
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

  it('rejects a missing interactions array', () => {
    const location = createLocation()
    const { interactions: _interactions, ...locationWithoutInteractions } =
      location

    expect(() =>
      parseLocationsFile({
        locations: [locationWithoutInteractions],
      }),
    ).toThrow('locations[0].interactions must be an array of objects.')
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

  it('reports the index of an invalid interaction', () => {
    const location = createLocation()
    location.interactions.push(null as never)

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow('locations[0].interactions[0] must be an object.')
  })

  it('rejects an invalid interaction ID', () => {
    const location = createLocation()
    location.interactions.push({
      id: 'Repair-Telescope',
      label: 'Repair the telescope',
      completionMessage: 'The telescope is repaired.',
    })

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow(
      'locations[0].interactions[0].id must be a lowercase identifier.',
    )
  })

  it('rejects an empty interaction label', () => {
    const location = createLocation()
    location.interactions.push({
      id: 'repair-telescope',
      label: ' ',
      completionMessage: 'The telescope is repaired.',
    })

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow(
      'locations[0].interactions[0].label must be a non-empty string.',
    )
  })

  it('rejects an empty interaction completion message', () => {
    const location = createLocation()
    location.interactions.push({
      id: 'repair-telescope',
      label: 'Repair the telescope',
      completionMessage: ' ',
    })

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow(
      'locations[0].interactions[0].completionMessage must be a non-empty string.',
    )
  })

  it('rejects an interaction requirement that is not an object', () => {
    const location = createLocation()

    expect(() =>
      parseLocationsFile({
        locations: [
          {
            ...location,
            interactions: [
              {
                id: 'repair-telescope',
                label: 'Repair the telescope',
                completionMessage: 'The telescope is repaired.',
                requirement: 'telescope-lens',
              },
            ],
          },
        ],
      }),
    ).toThrow(
      'locations[0].interactions[0].requirement must be an object.',
    )
  })

  it('rejects an invalid interaction requirement item ID', () => {
    const location = createLocation()
    location.interactions.push({
      id: 'repair-telescope',
      label: 'Repair the telescope',
      completionMessage: 'The telescope is repaired.',
      requirement: {
        itemId: 'Telescope-Lens',
        failureMessage: 'You need the telescope lens.',
      },
    })

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow(
      'locations[0].interactions[0].requirement.itemId must be a lowercase identifier.',
    )
  })

  it('rejects an empty interaction requirement failure message', () => {
    const location = createLocation()
    location.interactions.push({
      id: 'repair-telescope',
      label: 'Repair the telescope',
      completionMessage: 'The telescope is repaired.',
      requirement: {
        itemId: 'telescope-lens',
        failureMessage: ' ',
      },
    })

    expect(() =>
      parseLocationsFile({
        locations: [location],
      }),
    ).toThrow(
      'locations[0].interactions[0].requirement.failureMessage must be a non-empty string.',
    )
  })
})
