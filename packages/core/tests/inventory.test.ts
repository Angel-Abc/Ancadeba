import { describe, expect, it } from 'vitest'
import {
  createInitialGameState,
  followExit,
  getAvailableItemPlacements,
  getInventoryItems,
  getItem,
  takeItem,
} from '../src/index.js'
import { createGame } from './fixtures.js'

describe('core inventory', () => {
  it('returns an item by ID', () => {
    const game = createGame()

    expect(getItem(game, 'brass-key')).toEqual({
      id: 'brass-key',
      name: 'Brass Key',
      description: 'A small brass key with intricate engravings.',
    })
  })

  it('rejects an item ID that does not exist in runtime content', () => {
    expect(() => getItem(createGame(), 'missing-item')).toThrow(
      'Item with id "missing-item" not found.',
    )
  })

  it('returns the available item placements in the current location', () => {
    const game = createGame()
    const state = followExit(
      game,
      createInitialGameState(game),
      'entrance-hall-to-main-hall',
    )

    expect(getAvailableItemPlacements(game, state)).toEqual([
      {
        itemId: 'brass-key',
        takeLabel: 'Pull the brass key from beneath the staircase',
      },
    ])
  })

  it('takes an item from the current location without mutating the old state', () => {
    const game = createGame()
    const state = followExit(
      game,
      createInitialGameState(game),
      'entrance-hall-to-main-hall',
    )

    const nextState = takeItem(game, state, 'brass-key')

    expect(nextState).toEqual({
      currentLocationId: 'main-hall',
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: [],
    })
    expect(state.inventoryItemIds).toEqual([])
    expect(state.collectedItemIds).toEqual([])
    expect(getAvailableItemPlacements(game, nextState)).toEqual([])
  })

  it('resolves inventory item IDs to runtime items', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
    }

    expect(getInventoryItems(game, state)).toEqual([
      {
        id: 'brass-key',
        name: 'Brass Key',
        description: 'A small brass key with intricate engravings.',
      },
    ])
  })

  it('rejects an inventory item ID that does not exist in runtime content', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['missing-item'],
    }

    expect(() => getInventoryItems(game, state)).toThrow(
      'Item with id "missing-item" not found.',
    )
  })

  it('rejects taking an item outside its location', () => {
    const game = createGame()
    const state = createInitialGameState(game)

    expect(() => takeItem(game, state, 'brass-key')).toThrow(
      'Item with id "brass-key" not found in location "entrance-hall".',
    )
  })

  it('rejects taking an item that is already in the inventory', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
    }

    expect(() => takeItem(game, state, 'brass-key')).toThrow(
      'Item with id "brass-key" is already in the inventory.',
    )
  })

  it('preserves inventory while following an exit', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: ['repair-observatory-telescope'],
    }

    expect(
      followExit(game, state, 'entrance-hall-to-main-hall'),
    ).toEqual({
      currentLocationId: 'main-hall',
      inventoryItemIds: ['brass-key'],
      collectedItemIds: ['brass-key'],
      completedInteractionIds: ['repair-observatory-telescope'],
    })
  })
})
