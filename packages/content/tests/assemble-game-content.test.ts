import { describe, expect, it } from 'vitest'
import {
  assembleGameContent,
  type GameManifest,
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
      },
    ],
  }
}

describe('assembleGameContent', () => {
  it('assembles authored content into runtime content', () => {
    const game = assembleGameContent(createManifest(), createLocationsFile())

    expect(game.gameId).toBe('locked-observatory')
    expect(game.start).toEqual({ locationId: 'entrance-hall' })
    expect([...game.locations.keys()]).toEqual(['entrance-hall', 'main-hall'])
    expect(game.locations.get('entrance-hall')).toEqual(
      createLocationsFile().locations[0],
    )
  })

  it('rejects duplicate location IDs', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations.push({
      ...locationsFile.locations[0]!,
      name: 'Another Entrance Hall',
    })

    expect(() =>
      assembleGameContent(createManifest(), locationsFile),
    ).toThrow('Duplicate location ID: entrance-hall')
  })

  it('rejects duplicate exit IDs within a location', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.exits.push(
      locationsFile.locations[0]!.exits[0]!,
    )

    expect(() =>
      assembleGameContent(createManifest(), locationsFile),
    ).toThrow(
      'Duplicate exit ID "entrance-hall-to-main-hall" in location "entrance-hall".',
    )
  })

  it('rejects a start location that does not exist', () => {
    const manifest = createManifest()
    manifest.start.locationId = 'missing-room'

    expect(() =>
      assembleGameContent(manifest, createLocationsFile()),
    ).toThrow(
      'The start.locationId "missing-room" does not match any location ID.',
    )
  })

  it('rejects an exit target that does not exist', () => {
    const locationsFile = createLocationsFile()
    locationsFile.locations[0]!.exits[0]!.targetLocationId = 'missing-room'

    expect(() =>
      assembleGameContent(createManifest(), locationsFile),
    ).toThrow(
      'The exit "entrance-hall-to-main-hall" in location "entrance-hall" has a targetLocationId "missing-room" that does not match any location ID.',
    )
  })
})
