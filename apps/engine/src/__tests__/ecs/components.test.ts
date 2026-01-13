import { describe, expect, it } from 'vitest'
import {
  createInventory,
  createPlayerTag,
  InventoryComponent,
  InventoryItem,
  PlayerTagComponent,
} from '../../ecs/components'

describe('ecs/components', () => {
  describe('createPlayerTag', () => {
    it('creates player tag with isPlayer true', () => {
      // Act
      const playerTag = createPlayerTag()

      // Assert
      expect(playerTag).toEqual({ isPlayer: true })
    })

    it('returns correct type', () => {
      // Arrange
      const playerTag: PlayerTagComponent = createPlayerTag()

      // Assert
      expect(playerTag.isPlayer).toBe(true)
    })
  })

  describe('createInventory', () => {
    it('creates empty inventory', () => {
      // Act
      const inventory = createInventory()

      // Assert
      expect(inventory).toEqual({ items: [] })
    })

    it('returns inventory with empty items array', () => {
      // Arrange
      const inventory: InventoryComponent = createInventory()

      // Assert
      expect(inventory.items).toEqual([])
      expect(Array.isArray(inventory.items)).toBe(true)
    })

    it('creates new instance each time', () => {
      // Act
      const inventory1 = createInventory()
      const inventory2 = createInventory()

      // Assert
      expect(inventory1).not.toBe(inventory2)
      expect(inventory1.items).not.toBe(inventory2.items)
    })
  })

  describe('InventoryComponent', () => {
    it('can hold multiple items', () => {
      // Arrange
      const inventory: InventoryComponent = createInventory()
      const item1: InventoryItem = { itemId: 'apple', quantity: 3 }
      const item2: InventoryItem = { itemId: 'brass-key', quantity: 1 }

      // Act
      inventory.items.push(item1, item2)

      // Assert
      expect(inventory.items).toHaveLength(2)
      expect(inventory.items[0]).toEqual({ itemId: 'apple', quantity: 3 })
      expect(inventory.items[1]).toEqual({ itemId: 'brass-key', quantity: 1 })
    })

    it('supports optional weight properties', () => {
      // Arrange
      const inventory: InventoryComponent = {
        items: [],
        maxWeight: 100,
        currentWeight: 25.5,
      }

      // Assert
      expect(inventory.maxWeight).toBe(100)
      expect(inventory.currentWeight).toBe(25.5)
    })

    it('allows weight properties to be undefined', () => {
      // Arrange
      const inventory: InventoryComponent = createInventory()

      // Assert
      expect(inventory.maxWeight).toBeUndefined()
      expect(inventory.currentWeight).toBeUndefined()
    })
  })

  describe('InventoryItem', () => {
    it('has itemId and quantity', () => {
      // Arrange
      const item: InventoryItem = {
        itemId: 'health-potion',
        quantity: 5,
      }

      // Assert
      expect(item.itemId).toBe('health-potion')
      expect(item.quantity).toBe(5)
    })

    it('supports quantity of 1 for non-stackable items', () => {
      // Arrange
      const item: InventoryItem = {
        itemId: 'wooden-sword',
        quantity: 1,
      }

      // Assert
      expect(item.quantity).toBe(1)
    })
  })
})
