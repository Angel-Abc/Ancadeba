import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { Item } from '@ancadeba/schemas'
import { ItemDataStorage } from '../../resourceData/itemDataStorage'

describe('resourceData/ItemDataStorage', () => {
  const createMockLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
    fatal: vi.fn(() => {
      throw new Error('fatal')
    }),
  })

  it('stores and retrieves item data', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new ItemDataStorage(logger)
    const item: Item = {
      id: 'test-item',
      name: 'item.test-item.name',
      description: 'item.test-item.description',
      type: 'misc',
      stackable: true,
      weight: 1.0,
    }

    // Act
    storage.addItemData('test-item', item)
    const retrievedItem = storage.getItemData('test-item')

    // Assert
    expect(retrievedItem).toBe(item)
  })

  it('throws fatal error when retrieving non-existent item', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new ItemDataStorage(logger)

    // Act & Assert
    expect(() => storage.getItemData('non-existent')).toThrow('fatal')
    expect(logger.fatal).toHaveBeenCalledWith(
      'engine/resourceData/ItemDataStorage',
      'No item data for id: {0}',
      'non-existent'
    )
  })

  it('handles multiple items', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new ItemDataStorage(logger)
    const item1: Item = {
      id: 'item-1',
      name: 'item.item-1.name',
      description: 'item.item-1.description',
      type: 'consumable',
      stackable: true,
      weight: 0.5,
    }
    const item2: Item = {
      id: 'item-2',
      name: 'item.item-2.name',
      description: 'item.item-2.description',
      type: 'key',
      stackable: false,
      weight: 0.1,
    }

    // Act
    storage.addItemData('item-1', item1)
    storage.addItemData('item-2', item2)

    // Assert
    expect(storage.getItemData('item-1')).toBe(item1)
    expect(storage.getItemData('item-2')).toBe(item2)
  })

  it('returns loaded item IDs', () => {
    // Arrange
    const logger = createMockLogger()
    const storage = new ItemDataStorage(logger)
    const item1: Item = {
      id: 'item-1',
      name: 'item.item-1.name',
      description: 'item.item-1.description',
      type: 'consumable',
      stackable: true,
      weight: 0.5,
    }
    const item2: Item = {
      id: 'item-2',
      name: 'item.item-2.name',
      description: 'item.item-2.description',
      type: 'equipment',
      stackable: false,
      weight: 2.0,
    }

    // Act
    storage.addItemData('item-1', item1)
    storage.addItemData('item-2', item2)
    const loadedIds = storage.getLoadedItemIds()

    // Assert
    expect(loadedIds).toEqual(['item-1', 'item-2'])
  })
})
