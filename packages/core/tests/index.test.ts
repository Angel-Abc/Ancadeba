import { describe, expect, it } from 'vitest'
import type { LocationsFile } from '@angelabc/ancadeba-content'
import {
  createInitialGameState,
  getCurrentLocation,
  moveToLocationUsingExit,
} from '../src/index.js'

function createLocationsFile(): LocationsFile {
  return {
    startLocationId: 'entrance-hall',
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

describe('core location navigation', () => {
  it('starts at the configured start location', () => {
    expect(createInitialGameState(createLocationsFile())).toEqual({
      currentLocationId: 'entrance-hall',
    })
  })

  it('returns the current location from game state', () => {
    const locationsFile = createLocationsFile()
    const state = createInitialGameState(locationsFile)

    expect(getCurrentLocation(state, locationsFile)).toEqual(
      locationsFile.locations[0],
    )
  })

  it('moves to the target location for a valid exit', () => {
    const locationsFile = createLocationsFile()
    const state = createInitialGameState(locationsFile)

    expect(
      moveToLocationUsingExit(
        state,
        locationsFile,
        'entrance-hall-to-main-hall',
      ),
    ).toEqual({
      currentLocationId: 'main-hall',
    })
  })

  it('rejects an exit id that does not exist on the current location', () => {
    const locationsFile = createLocationsFile()
    const state = createInitialGameState(locationsFile)

    expect(() =>
      moveToLocationUsingExit(state, locationsFile, 'missing-exit'),
    ).toThrow(
      'Exit with id "missing-exit" not found in location "entrance-hall".',
    )
  })
})
