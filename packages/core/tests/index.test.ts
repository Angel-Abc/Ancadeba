import { describe, expect, it } from 'vitest'
import type { RuntimeGameContent } from '@angelabc/ancadeba-content'
import {
  createInitialGameState,
  followExit,
  getAvailableItemPlacements,
  getCurrentLocation,
  getExitAvailability,
  getInteractionAvailability,
  getItem,
  getInventoryItems,
  isInteractionCompleted,
  performInteraction,
  takeItem,
} from '../src/index.js'

function createGame(): RuntimeGameContent {
  return {
    gameId: 'locked-observatory',
    title: 'The Locked Observatory',
    description: 'A mysterious observatory.',
    start: {
      locationId: 'entrance-hall',
    },
    items: new Map([
      [
        'brass-key',
        {
          id: 'brass-key',
          name: 'Brass Key',
          description: 'A small brass key with intricate engravings.',
        },
      ],
    ]),
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
        items: [],
        interactions: [],
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
        items: [
          {
            itemId: 'brass-key',
            takeLabel: 'Pull the brass key from beneath the staircase',
          },
        ],
        interactions: [],
      }],
    ]),
  }
}

function requireBrassKeyForEntranceExit(game: RuntimeGameContent) {
  const exit = game.locations.get('entrance-hall')!.exits[0]!
  exit.requirement = {
    itemId: 'brass-key',
    failureMessage: 'The brass doors are locked.',
  }
  return exit
}

function addEntranceInteraction(
  game: RuntimeGameContent,
  requiresBrassKey = false,
) {
  const interaction = {
    id: 'repair-observatory-telescope',
    label: 'Repair the telescope',
    completionMessage: 'The telescope is repaired.',
    requirement: requiresBrassKey
      ? {
          itemId: 'brass-key',
          failureMessage: 'You need the brass key.',
        }
      : undefined,
  }

  game.locations.get('entrance-hall')!.interactions.push(interaction)
  return interaction
}

describe('core location navigation', () => {
  it('starts at the configured start location', () => {
    expect(createInitialGameState(createGame())).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: [],
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
      completedInteractionIds: [],
    })
  })

  it('follows a required-item exit and preserves the item in inventory', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
    }
    const exit = requireBrassKeyForEntranceExit(game)

    expect(getExitAvailability(exit, state)).toEqual({ available: true })
    expect(
      followExit(game, state, 'entrance-hall-to-main-hall'),
    ).toEqual({
      currentLocationId: 'main-hall',
      inventoryItemIds: ['brass-key'],
      completedInteractionIds: [],
    })
  })
})

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
      completedInteractionIds: [],
    })
    expect(state.inventoryItemIds).toEqual([])
    expect(getAvailableItemPlacements(game, nextState)).toEqual([])
  })

  it('resolves inventory item IDs to runtime items', () => {
    const game = createGame()
    const state = {
      ...createInitialGameState(game),
      inventoryItemIds: ['brass-key'],
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
      completedInteractionIds: ['repair-observatory-telescope'],
    }

    expect(
      followExit(game, state, 'entrance-hall-to-main-hall'),
    ).toEqual({
      currentLocationId: 'main-hall',
      inventoryItemIds: ['brass-key'],
      completedInteractionIds: ['repair-observatory-telescope'],
    })
  })
})

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
      completedInteractionIds: ['repair-observatory-telescope'],
    })
    expect(state).toEqual({
      currentLocationId: 'entrance-hall',
      inventoryItemIds: ['brass-key'],
      completedInteractionIds: [],
    })
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
