import { describe, expect, it } from 'vitest'
import {
  assembleGameContent,
  type GameManifest,
  type ItemsFile,
  type LocationsFile,
} from '../src/index.js'

function createManifest(): GameManifest {
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

function createLocationsFile(): LocationsFile {
  return {
    locations: [
      {
        id: 'entrance-hall',
        name: 'Entrance Hall',
        description: 'Dusty doors lead deeper into the observatory.',
        exits: [
          {
            id: 'entrance-hall-to-main-hall',
            label: 'Pass through the brass doors',
            targetLocationId: 'main-hall',
          },
        ],
        items: [],
      },
      {
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
      },
    ],
  }
}

function createItemsFile(): ItemsFile {
  return {
    items: [
      {
        id: 'brass-key',
        name: 'Brass Key',
        description: 'A small brass key with intricate engravings.',
      },
    ],
  }
}

describe('assembleGameContent', () => {
  it('assembles authored content into runtime content', () => {
    const game = assembleGameContent(
      createManifest(),
      createLocationsFile(),
      createItemsFile(),
    )

    expect(game.gameId).toBe('locked-observatory')
    expect(game.start).toEqual({ locationId: 'entrance-hall' })
    expect([...game.locations.keys()]).toEqual(['entrance-hall', 'main-hall'])
    expect(game.locations.get('entrance-hall')).toEqual(
      createLocationsFile().locations[0],
    )
    expect(game.locations.get('main-hall')?.items).toEqual([
      {
        itemId: 'brass-key',
        takeLabel: 'Pull the brass key from beneath the staircase',
      },
    ])
    expect(game.items.get('brass-key')).toEqual({
      id: 'brass-key',
      name: 'Brass Key',
      description: 'A small brass key with intricate engravings.',
    })
  })

  it('rejects duplicate location IDs', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations.push({
      ...locationsFile.locations[0]!,
      name: 'Another Entrance Hall',
    })

    expect(() =>
      assembleGameContent(createManifest(), locationsFile, createItemsFile()),
    ).toThrow('Duplicate location ID: entrance-hall')
  })

  it('rejects duplicate exit IDs within a location', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.exits.push(
      locationsFile.locations[0]!.exits[0]!,
    )

    expect(() =>
      assembleGameContent(createManifest(), locationsFile, createItemsFile()),
    ).toThrow(
      'Duplicate exit ID "entrance-hall-to-main-hall" in location "entrance-hall".',
    )
  })

  it('rejects a start location that does not exist', () => {
    const manifest = createManifest()
    manifest.start.locationId = 'missing-room'

    expect(() =>
      assembleGameContent(manifest, createLocationsFile(), createItemsFile()),
    ).toThrow(
      'The start.locationId "missing-room" does not match any location ID.',
    )
  })

  it('rejects an exit target that does not exist', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.exits[0]!.targetLocationId = 'missing-room'

    expect(() =>
      assembleGameContent(createManifest(), locationsFile, createItemsFile()),
    ).toThrow(
      'The exit "entrance-hall-to-main-hall" in location "entrance-hall" has a targetLocationId "missing-room" that does not match any location ID.',
    )
  })

  it('rejects duplicate item IDs', () => {
    const itemsFile = createItemsFile()
    itemsFile.items.push({
      ...itemsFile.items[0]!,
      name: 'Another Brass Key',
    })

    expect(() =>
      assembleGameContent(
        createManifest(),
        createLocationsFile(),
        itemsFile,
      ),
    ).toThrow('Duplicate item ID: brass-key')
  })

  it('rejects an item placement that references an unknown item', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[1]!.items[0]!.itemId = 'missing-item'

    expect(() =>
      assembleGameContent(
        createManifest(),
        locationsFile,
        createItemsFile(),
      ),
    ).toThrow(
      'Item placement in location "main-hall" references unknown item ID "missing-item".',
    )
  })

  it('rejects duplicate item placements within a location', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[1]!.items.push(
      locationsFile.locations[1]!.items[0]!,
    )

    expect(() =>
      assembleGameContent(
        createManifest(),
        locationsFile,
        createItemsFile(),
      ),
    ).toThrow(
      'Duplicate item placement for item ID "brass-key" in location "main-hall".',
    )
  })

  it('rejects placing an item in multiple locations', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.items.push(
      locationsFile.locations[1]!.items[0]!,
    )

    expect(() =>
      assembleGameContent(
        createManifest(),
        locationsFile,
        createItemsFile(),
      ),
    ).toThrow('Item ID "brass-key" is placed in multiple locations.')
  })
})
