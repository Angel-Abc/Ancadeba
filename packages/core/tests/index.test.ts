import { describe, expect, it } from 'vitest'
import type { RuntimeGameContent } from '@angelabc/ancadeba-content'
import {
  createInitialGameState,
  followExit,
  getCurrentLocation,
} from '../src/index.js'

function createGame(): RuntimeGameContent {
  return {
    gameId: 'locked-observatory',
    title: 'The Locked Observatory',
    description: 'A mysterious observatory.',
    start: {
      locationId: 'entrance-hall',
    },
    locations: new Map([
      ['entrance-hall', {
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
      }],
      ['main-hall', {
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
      }],
    ]),
  }
}

describe('core location navigation', () => {
  it('starts at the configured start location', () => {
    expect(createInitialGameState(createGame())).toEqual({
      currentLocationId: 'entrance-hall',
    })
  })

  it('returns the current location from game state', () => {
    const game = createGame()
    const state = createInitialGameState(game)

    expect(getCurrentLocation(game, state)).toEqual(
      game.locations.get('entrance-hall'),
    )
  })

  it('moves to the target location for a valid exit', () => {
    const game = createGame()
    const state = createInitialGameState(game)

    expect(
      followExit(game, state, 'entrance-hall-to-main-hall'),
    ).toEqual({
      currentLocationId: 'main-hall',
    })
  })

  it('rejects an exit id that does not exist on the current location', () => {
    const game = createGame()
    const state = createInitialGameState(game)

    expect(() => followExit(game, state, 'missing-exit')).toThrow(
      'Exit with id "missing-exit" not found in location "entrance-hall".',
    )
  })
})
