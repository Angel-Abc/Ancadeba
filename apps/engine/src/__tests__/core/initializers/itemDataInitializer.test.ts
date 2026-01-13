import { describe, expect, it, vi } from 'vitest'
import type { Item } from '@ancadeba/schemas'
import type { IItemDataStorage } from '../../../resourceData/storage'
import { ItemDataInitializer } from '../../../core/initializers/itemDataInitializer'

describe('core/initializers/itemDataInitializer', () => {
  const createMockItemDataStorage = (): IItemDataStorage => ({
    addItemData: vi.fn(),
    getItemData: vi.fn(),
    getLoadedItemIds: vi.fn(() => []),
  })

  it('processes empty array without errors', () => {
    // Arrange
    const storage = createMockItemDataStorage()
    const initializer = new ItemDataInitializer(storage)

    // Act
    initializer.initializeItems([])

    // Assert
    expect(storage.addItemData).not.toHaveBeenCalled()
  })

  it('adds single item with correct ID', () => {
    // Arrange
    const storage = createMockItemDataStorage()
    const initializer = new ItemDataInitializer(storage)
    const item: Item = {
      id: 'apple',
      name: 'item.apple.name',
      description: 'item.apple.description',
      type: 'consumable',
      stackable: true,
      weight: 0.2,
    }

    // Act
    initializer.initializeItems([item])

    // Assert
    expect(storage.addItemData).toHaveBeenCalledTimes(1)
    expect(storage.addItemData).toHaveBeenCalledWith('apple', item)
  })

  it('adds multiple items', () => {
    // Arrange
    const storage = createMockItemDataStorage()
    const initializer = new ItemDataInitializer(storage)
    const item1: Item = {
      id: 'apple',
      name: 'item.apple.name',
      description: 'item.apple.description',
      type: 'consumable',
      stackable: true,
      weight: 0.2,
    }
    const item2: Item = {
      id: 'brass-key',
      name: 'item.brass-key.name',
      description: 'item.brass-key.description',
      type: 'key',
      stackable: false,
      weight: 0.1,
    }
    const item3: Item = {
      id: 'wooden-sword',
      name: 'item.wooden-sword.name',
      description: 'item.wooden-sword.description',
      type: 'equipment',
      stackable: false,
      weight: 2.0,
    }

    // Act
    initializer.initializeItems([item1, item2, item3])

    // Assert
    expect(storage.addItemData).toHaveBeenCalledTimes(3)
    expect(storage.addItemData).toHaveBeenCalledWith('apple', item1)
    expect(storage.addItemData).toHaveBeenCalledWith('brass-key', item2)
    expect(storage.addItemData).toHaveBeenCalledWith('wooden-sword', item3)
  })

  it('handles items with all optional properties', () => {
    // Arrange
    const storage = createMockItemDataStorage()
    const initializer = new ItemDataInitializer(storage)
    const item: Item = {
      id: 'health-potion',
      name: 'item.health-potion.name',
      description: 'item.health-potion.description',
      type: 'consumable',
      stackable: true,
      maxStack: 5,
      weight: 0.5,
      image: 'items/health-potion.png',
      properties: {
        healAmount: 50,
      },
    }

    // Act
    initializer.initializeItems([item])

    // Assert
    expect(storage.addItemData).toHaveBeenCalledTimes(1)
    expect(storage.addItemData).toHaveBeenCalledWith('health-potion', item)
  })
})
