import { describe, expect, it, vi } from 'vitest'
import { RemoveItemActionHandler } from '../../../core/actionHandlers/RemoveItemActionHandler'
import type { ILogger } from '@ancadeba/utils'
import type { IWorld } from '../../../ecs/world'
import { COMPONENT_KEYS, InventoryComponent } from '../../../ecs/components'

describe('core/actionHandlers/RemoveItemActionHandler', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  const createMockWorld = (): IWorld => ({
    createEntity: vi.fn(() => 1),
    destroyEntity: vi.fn(),
    hasEntity: vi.fn(() => true),
    setComponent: vi.fn(),
    removeComponent: vi.fn(),
    getComponent: vi.fn(),
    getEntitiesWith: vi.fn(() => []),
    subscribe: vi.fn(() => () => undefined),
  })

  it('canHandle returns true for remove-item actions', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    // Act
    const result = handler.canHandle({
      type: 'remove-item',
      itemId: 'apple',
      quantity: 1,
    })

    // Assert
    expect(result).toBe(true)
  })

  it('canHandle returns false for other action types', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    // Act
    const result = handler.canHandle({ type: 'back' })

    // Assert
    expect(result).toBe(false)
  })

  it('removes item completely when quantity becomes zero', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'apple', quantity: 3 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    // Act
    handler.handle({ type: 'remove-item', itemId: 'apple', quantity: 3 })

    // Assert
    expect(inventory.items).toHaveLength(0)
    expect(world.setComponent).toHaveBeenCalledWith(
      1,
      COMPONENT_KEYS.inventory,
      inventory
    )
  })

  it('decrements quantity when removing partial amount', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'apple', quantity: 5 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    // Act
    handler.handle({ type: 'remove-item', itemId: 'apple', quantity: 2 })

    // Assert
    expect(inventory.items).toHaveLength(1)
    const item = inventory.items[0]
    if (!item) {
      throw new Error('Expected inventory item to exist')
    }
    expect(item.quantity).toBe(3)
    expect(world.setComponent).toHaveBeenCalledWith(
      1,
      COMPONENT_KEYS.inventory,
      inventory
    )
  })

  it('warns when trying to remove more than available', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'apple', quantity: 2 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    // Act
    handler.handle({ type: 'remove-item', itemId: 'apple', quantity: 5 })

    // Assert
    const item = inventory.items[0]
    if (!item) {
      throw new Error('Expected inventory item to exist')
    }
    expect(item.quantity).toBe(2) // Should not change
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/actionHandlers/RemoveItemActionHandler',
      'Cannot remove {0} {1}: only {2} available',
      5,
      'apple',
      2
    )
  })

  it('warns when item not found in inventory', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    const inventory: InventoryComponent = {
      items: [{ itemId: 'apple', quantity: 3 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    // Act
    handler.handle({ type: 'remove-item', itemId: 'brass-key', quantity: 1 })

    // Assert
    expect(inventory.items).toHaveLength(1)
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/actionHandlers/RemoveItemActionHandler',
      'Cannot remove {0}: item not found in inventory',
      'brass-key'
    )
  })

  it('warns when player entity not found', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    vi.mocked(world.getEntitiesWith).mockReturnValue([])

    // Act
    handler.handle({ type: 'remove-item', itemId: 'apple', quantity: 1 })

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/actionHandlers/RemoveItemActionHandler',
      'No player entity found'
    )
  })

  it('warns when player has no inventory component', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(undefined)

    // Act
    handler.handle({ type: 'remove-item', itemId: 'apple', quantity: 1 })

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/actionHandlers/RemoveItemActionHandler',
      'Player has no inventory component'
    )
  })

  it('does nothing for non-remove-item actions', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    // Act
    handler.handle({ type: 'back' })

    // Assert
    expect(world.getEntitiesWith).not.toHaveBeenCalled()
  })

  it('handles removing from inventory with multiple items', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const handler = new RemoveItemActionHandler(logger, world)

    const inventory: InventoryComponent = {
      items: [
        { itemId: 'apple', quantity: 5 },
        { itemId: 'brass-key', quantity: 1 },
        { itemId: 'health-potion', quantity: 3 },
      ],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)

    // Act
    handler.handle({ type: 'remove-item', itemId: 'brass-key', quantity: 1 })

    // Assert
    expect(inventory.items).toHaveLength(2)
    expect(inventory.items).toEqual([
      { itemId: 'apple', quantity: 5 },
      { itemId: 'health-potion', quantity: 3 },
    ])
    expect(world.setComponent).toHaveBeenCalledWith(
      1,
      COMPONENT_KEYS.inventory,
      inventory
    )
  })
})
