import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  followExit,
  getAvailableItemPlacements,
  getInteractionAvailability,
  isInteractionCompleted,
  performInteraction,
  takeItem,
} from '../src/index.js'
import {
  addEntranceInteraction,
  createGame,
} from './fixtures.js'

describe('core interactions', () => {
  it('reports an unrestricted interaction as available', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    const interaction = addEntranceInteraction(game)

    expect(getInteractionAvailability(interaction, state)).toEqual({
      available: true,
    })
  })

  it('reports a required item and failure message when unavailable', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    const interaction = addEntranceInteraction(game, true)

    expect(getInteractionAvailability(interaction, state)).toEqual({
      available: false,
      failureMessage: 'You need the brass key.',
    })
  })

  it('reports a required-item interaction as available when the item is held', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
    }
    const interaction = addEntranceInteraction(game, true)

    expect(getInteractionAvailability(interaction, state)).toEqual({
      available: true,
    })
  })

  it('reports whether an interaction has been completed', () => {
    const state = {
      ...createInitialGameState(createGame()),
      completedInteractionIds: ['repair-observatory-telescope'],
    }

    expect(
      isInteractionCompleted(state, 'repair-observatory-telescope'),
    ).toBe(true)
    expect(isInteractionCompleted(state, 'missing-interaction')).toBe(false)
  })

  it('completes an interaction without mutating the old state or consuming its item', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
    }
    addEntranceInteraction(game, true)

    const nextState = performInteraction(
      game,
      state,
      'repair-observatory-telescope',
    )

    expect(nextState).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: ['repair-observatory-telescope'],
    })
    expect(state).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: [],
    })
  })

  it('consumes a required item without making its placement available again', () => {
    const game = createGame()
    addEntranceInteraction(game, true, true)
    const mainHallState = followExit(
      game,
      createInitialGameState(game),
      'entrance-hall-to-main-hall',
    )
    const carryingState = takeItem(game, mainHallState, 'brass-key')
    const entranceState = followExit(
      game,
      carryingState,
      'main-hall-to-entrance-hall',
    )

    const completedState = performInteraction(
      game,
      entranceState,
      'repair-observatory-telescope',
    )

    expect(completedState).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: [],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: ['repair-observatory-telescope'],
    })
    expect(entranceState).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: [],
    })

    const revisitedMainHallState = followExit(
      game,
      completedState,
      'entrance-hall-to-main-hall',
    )
    expect(getAvailableItemPlacements(game, revisitedMainHallState)).toEqual([])
    expect(() =>
      takeItem(game, revisitedMainHallState, 'brass-key'),
    ).toThrow('Item with id "brass-key" has already been collected.')
  })

  it('rejects an interaction outside the current location', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    const interaction = addEntranceInteraction(game)
    game.locations.get('entrance-hall')!.interactions = []
    game.locations.get('main-hall')!.interactions.push(interaction)

    expect(() =>
      performInteraction(game, state, 'repair-observatory-telescope'),
    ).toThrow(
      'Interaction with id "repair-observatory-telescope" not found in location "entrance-hall".',
    )
  })

  it('rejects an interaction when its item requirement is not met', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    addEntranceInteraction(game, true)

    expect(() =>
      performInteraction(game, state, 'repair-observatory-telescope'),
    ).toThrow('You need the brass key.')
    expect(state.completedInteractionIds).toEqual([])
  })

  it('uses the authored failure message when a consumed item is missing', () => {
    const game = createGame()
    const state = createInitialGameState(game)
    addEntranceInteraction(game, true, true)

    expect(() =>
      performInteraction(game, state, 'repair-observatory-telescope'),
    ).toThrow('You need the brass key.')
    expect(state).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: [],
      collectedItemIds: [],
      completedInteractionIds: [],
    })
  })

  it('rejects completing the same interaction twice', () => {
    const game = createGame()
    addEntranceInteraction(game)
    const state = {
      ...createInitialGameState(game),
      completedInteractionIds: ['repair-observatory-telescope'],
    }

    expect(() =>
      performInteraction(game, state, 'repair-observatory-telescope'),
    ).toThrow(
      'Interaction with id "repair-observatory-telescope" is already completed.',
    )
  })
})
