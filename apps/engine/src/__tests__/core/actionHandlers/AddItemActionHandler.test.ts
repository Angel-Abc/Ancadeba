import { describe, expect, it, vi } from 'vitest'
import { AddItemActionHandler } from '../../../core/actionHandlers/AddItemActionHandler'
import type { ILogger } from '@ancadeba/utils'
import type { IWorld } from '../../../ecs/world'
import type { IResourceDataProvider } from '../../../resourceData/provider'
import type { Item } from '@ancadeba/schemas'
import { COMPONENT_KEYS, InventoryComponent } from '../../../ecs/components'

describe('core/actionHandlers/AddItemActionHandler', () => {
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

  const createMockResourceDataProvider = (): IResourceDataProvider => ({
    get assetsUrl() {
      return '/assets'
    },
    getSceneData: vi.fn(),
    getCssFilePaths: vi.fn(() => []),
    getMapData: vi.fn(),
    getItemData: vi.fn(),
    getComponentDefinition: vi.fn(),
    hasComponentDefinition: vi.fn(() => false),
    resolveComponent: vi.fn((c) => c),
    getAppearanceCategoryData: vi.fn(),
    getAppearanceData: vi.fn(),
    getAllAppearanceCategories: vi.fn(() => []),
    getAppearancesByCategory: vi.fn(() => []),
    getLanguageFilePaths: vi.fn(() => []),
  })

  it('canHandle returns true for add-item actions', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    // Act
    const result = handler.canHandle({
      type: 'add-item',
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
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    // Act
    const result = handler.canHandle({ type: 'back' })

    // Assert
    expect(result).toBe(false)
  })

  it('adds new item to empty inventory', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    const inventory: InventoryComponent = { items: [] }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)
    vi.mocked(resourceDataProvider.getItemData).mockReturnValue({
      id: 'apple',
      name: 'item.apple.name',
      description: 'item.apple.description',
      type: 'consumable',
      stackable: true,
      weight: 0.2,
    } as Item)

    // Act
    handler.handle({ type: 'add-item', itemId: 'apple', quantity: 3 })

    // Assert
    expect(inventory.items).toHaveLength(1)
    const firstItem = inventory.items[0]
    if (!firstItem) {
      throw new Error('Expected inventory item to be added')
    }
    expect(firstItem).toEqual({ itemId: 'apple', quantity: 3 })
    expect(world.setComponent).toHaveBeenCalledWith(
      1,
      COMPONENT_KEYS.inventory,
      inventory
    )
  })

  it('increments quantity for existing stackable item', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    const inventory: InventoryComponent = {
      items: [{ itemId: 'apple', quantity: 2 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)
    vi.mocked(resourceDataProvider.getItemData).mockReturnValue({
      id: 'apple',
      name: 'item.apple.name',
      description: 'item.apple.description',
      type: 'consumable',
      stackable: true,
      weight: 0.2,
    } as Item)

    // Act
    handler.handle({ type: 'add-item', itemId: 'apple', quantity: 3 })

    // Assert
    expect(inventory.items).toHaveLength(1)
    const item = inventory.items[0]
    if (!item) {
      throw new Error('Expected inventory item to exist')
    }
    expect(item.quantity).toBe(5)
  })

  it('adds non-stackable item as separate entry', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    const inventory: InventoryComponent = {
      items: [{ itemId: 'brass-key', quantity: 1 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)
    vi.mocked(resourceDataProvider.getItemData).mockReturnValue({
      id: 'brass-key',
      name: 'item.brass-key.name',
      description: 'item.brass-key.description',
      type: 'key',
      stackable: false,
      weight: 0.1,
    } as Item)

    // Act
    handler.handle({ type: 'add-item', itemId: 'brass-key', quantity: 1 })

    // Assert
    expect(inventory.items).toHaveLength(2)
    const item = inventory.items[1]
    if (!item) {
      throw new Error('Expected inventory item to be added')
    }
    expect(item).toEqual({ itemId: 'brass-key', quantity: 1 })
  })

  it('respects maxStack limit', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    const inventory: InventoryComponent = {
      items: [{ itemId: 'health-potion', quantity: 4 }],
    }
    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(inventory)
    vi.mocked(resourceDataProvider.getItemData).mockReturnValue({
      id: 'health-potion',
      name: 'item.health-potion.name',
      description: 'item.health-potion.description',
      type: 'consumable',
      stackable: true,
      maxStack: 5,
      weight: 0.5,
    } as Item)

    // Act
    handler.handle({ type: 'add-item', itemId: 'health-potion', quantity: 2 })

    // Assert
    const item = inventory.items[0]
    if (!item) {
      throw new Error('Expected inventory item to exist')
    }
    expect(item.quantity).toBe(4) // Should not change
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/actionHandlers/AddItemActionHandler',
      'Cannot add {0} {1}: would exceed max stack of {2}',
      2,
      'health-potion',
      5
    )
  })

  it('warns when player entity not found', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    vi.mocked(world.getEntitiesWith).mockReturnValue([])

    // Act
    handler.handle({ type: 'add-item', itemId: 'apple', quantity: 1 })

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/actionHandlers/AddItemActionHandler',
      'No player entity found'
    )
  })

  it('warns when player has no inventory component', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    vi.mocked(world.getEntitiesWith).mockReturnValue([1])
    vi.mocked(world.getComponent).mockReturnValue(undefined)

    // Act
    handler.handle({ type: 'add-item', itemId: 'apple', quantity: 1 })

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/actionHandlers/AddItemActionHandler',
      'Player has no inventory component'
    )
  })

  it('does nothing for non-add-item actions', () => {
    // Arrange
    const logger = createMockLogger()
    const world = createMockWorld()
    const resourceDataProvider = createMockResourceDataProvider()
    const handler = new AddItemActionHandler(
      logger,
      world,
      resourceDataProvider
    )

    // Act
    handler.handle({ type: 'back' })

    // Assert
    expect(world.getEntitiesWith).not.toHaveBeenCalled()
  })
})
