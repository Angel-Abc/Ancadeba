import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  followExit,
  getCurrentLocation,
  getExitAvailability,
} from '../src/index.js'
import {
  createGame,
  requireBrassKeyForEntranceExit,
} from './fixtures.js'

describe('core location navigation', () => {
  it('starts at the configured start location', () => {
    expect(createInitialGameState(createGame())).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: [],
      collectedItemIds: [],
      completedInteractionIds: [],
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
      inventoryItemIds: [],
      collectedItemIds: [],
      completedInteractionIds: [],
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

describe('core exit requirements', () => {
  it('reports an unrestricted exit as available', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    const exit = game.locations.get('entrance-hall')!.exits[0]!

    expect(getExitAvailability(exit, state)).toEqual({ available: true })
  })

  it('reports a required item and failure message when an exit is locked', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    const exit = requireBrassKeyForEntranceExit(game)

    expect(getExitAvailability(exit, state)).toEqual({
      available: false,
      failureMessage: 'The brass doors are locked.',
    })
  })

  it('rejects following a locked exit without changing the old state', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    requireBrassKeyForEntranceExit(game)

    expect(() =>
      followExit(game, state, 'entrance-hall-to-main-hall'),
    ).toThrow('The brass doors are locked.')
    expect(state).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: [],
      collectedItemIds: [],
      completedInteractionIds: [],
    })
  })

  it('follows a required-item exit and preserves the item in inventory', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
    }
    const exit = requireBrassKeyForEntranceExit(game)

    expect(getExitAvailability(exit, state)).toEqual({ available: true })
    expect(
      followExit(game, state, 'entrance-hall-to-main-hall'),
    ).toEqual({
      currentLocationId: 'main-hall',
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: [],
    })
  })

  it('follows a consuming-item exit without mutating the old state', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
    }
    requireBrassKeyForEntranceExit(game, true)

    const nextState = followExit(
      game,
      state,
      'entrance-hall-to-main-hall',
    )

    expect(nextState).toEqual({
      currentLocationId: 'main-hall',
      inventoryItemIds: [],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: [],
    })
    expect(state).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: [],
    })
  })

  it('reports a completed-interaction exit as unavailable before completion', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    const exit = game.locations.get('entrance-hall')!.exits[0]!
    exit.requirement = {
      type: 'completed-interaction',
      interactionId: 'repair-observatory-telescope',
      failureMessage: 'The telescope must be repaired.',
    }

    expect(getExitAvailability(exit, state)).toEqual({
      available: false,
      failureMessage: 'The telescope must be repaired.',
    })
  })

  it('follows a completed-interaction exit after completion', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      completedInteractionIds: ['repair-observatory-telescope'],
    }
    const exit = game.locations.get('entrance-hall')!.exits[0]!
    exit.requirement = {
      type: 'completed-interaction',
      interactionId: 'repair-observatory-telescope',
      failureMessage: 'The telescope must be repaired.',
    }

    expect(getExitAvailability(exit, state)).toEqual({ available: true })
    expect(
      followExit(game, state, 'entrance-hall-to-main-hall'),
    ).toEqual({
      currentLocationId: 'main-hall',
      inventoryItemIds: [],
      collectedItemIds: [],
      completedInteractionIds: ['repair-observatory-telescope'],
    })
  })
})
