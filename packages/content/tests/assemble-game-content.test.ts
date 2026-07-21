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
        interactions: [],
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
        interactions: [],
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

  it('preserves an exit item requirement in runtime content', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.exits[0]!.requirement = {
      type: 'item',
      itemId: 'brass-key',
      failureMessage: 'The door is locked.',
    }

    const game = assembleGameContent(
      createManifest(),
      locationsFile,
      createItemsFile(),
    )

    expect(game.locations.get('entrance-hall')?.exits[0]?.requirement).toEqual({
      type: 'item',
      itemId: 'brass-key',
      failureMessage: 'The door is locked.',
    })
  })

  it('rejects an exit requirement that references an unknown item', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.exits[0]!.requirement = {
      type: 'item',
      itemId: 'missing-item',
      failureMessage: 'The door is locked.',
    }

    expect(() =>
      assembleGameContent(
        createManifest(),
        locationsFile,
        createItemsFile(),
      ),
    ).toThrow(
      'Exit "entrance-hall-to-main-hall" in location "entrance-hall" has a requirement for unknown item ID "missing-item".',
    )
  })

  it('preserves a forward completed-interaction exit requirement', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.exits[0]!.requirement = {
      type: 'completed-interaction',
      interactionId: 'repair-observatory-telescope',
      failureMessage: 'The telescope must be repaired.',
    }
    locationsFile.locations[1]!.interactions.push({
      id: 'repair-observatory-telescope',
      label: 'Repair the telescope',
      completionMessage: 'The telescope is repaired.',
    })

    const game = assembleGameContent(
      createManifest(),
      locationsFile,
      createItemsFile(),
    )

    expect(game.locations.get('entrance-hall')?.exits[0]?.requirement).toEqual({
      type: 'completed-interaction',
      interactionId: 'repair-observatory-telescope',
      failureMessage: 'The telescope must be repaired.',
    })
  })

  it('rejects an exit requirement that references an unknown interaction', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.exits[0]!.requirement = {
      type: 'completed-interaction',
      interactionId: 'missing-interaction',
      failureMessage: 'The interaction must be completed.',
    }

    expect(() =>
      assembleGameContent(
        createManifest(),
        locationsFile,
        createItemsFile(),
      ),
    ).toThrow(
      'Exit "entrance-hall-to-main-hall" in location "entrance-hall" has a requirement for unknown interaction ID "missing-interaction".',
    )
  })

  it('preserves an interaction and its item requirement in runtime content', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.interactions.push({
      id: 'repair-observatory-telescope',
      label: 'Repair the telescope',
      completionMessage: 'The telescope is repaired.',
      requirement: {
        itemId: 'brass-key',
        failureMessage: 'You need the brass key.',
      },
    })

    const game = assembleGameContent(
      createManifest(),
      locationsFile,
      createItemsFile(),
    )

    expect(game.locations.get('entrance-hall')?.interactions).toEqual([
      {
        id: 'repair-observatory-telescope',
        label: 'Repair the telescope',
        completionMessage: 'The telescope is repaired.',
        requirement: {
          itemId: 'brass-key',
          failureMessage: 'You need the brass key.',
        },
      },
    ])
  })

  it('rejects an interaction requirement that references an unknown item', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.interactions.push({
      id: 'repair-observatory-telescope',
      label: 'Repair the telescope',
      completionMessage: 'The telescope is repaired.',
      requirement: {
        itemId: 'missing-item',
        failureMessage: 'You need the telescope lens.',
      },
    })

    expect(() =>
      assembleGameContent(
        createManifest(),
        locationsFile,
        createItemsFile(),
      ),
    ).toThrow(
      'Interaction "repair-observatory-telescope" in location "entrance-hall" has a requirement for unknown item ID "missing-item".',
    )
  })

  it('rejects duplicate interaction IDs across locations', () => {
    const locationsFile = createLocationsFile()
    const interaction = {
      id: 'repair-observatory-telescope',
      label: 'Repair the telescope',
      completionMessage: 'The telescope is repaired.',
    }
    locationsFile.locations[0]!.interactions.push(interaction)
    locationsFile.locations[1]!.interactions.push(interaction)

    expect(() =>
      assembleGameContent(
        createManifest(),
        locationsFile,
        createItemsFile(),
      ),
    ).toThrow(
      'Duplicate interaction ID "repair-observatory-telescope" in location "main-hall".',
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
