import { describe, expect, it } from 'vitest'
import {
  createInventory,
  createPlayerTag,
  createAppearanceComponent,
  InventoryComponent,
  InventoryItem,
  PlayerTagComponent,
  AppearanceComponent,
  EquippedAppearance,
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

  describe('createAppearanceComponent', () => {
    it('creates empty appearance component', () => {
      // Act
      const appearance = createAppearanceComponent()

      // Assert
      expect(appearance).toEqual({ equipped: [] })
    })

    it('returns appearance with empty equipped array', () => {
      // Arrange
      const appearance: AppearanceComponent = createAppearanceComponent()

      // Assert
      expect(appearance.equipped).toEqual([])
      expect(Array.isArray(appearance.equipped)).toBe(true)
    })

    it('creates new instance each time', () => {
      // Act
      const appearance1 = createAppearanceComponent()
      const appearance2 = createAppearanceComponent()

      // Assert
      expect(appearance1).not.toBe(appearance2)
      expect(appearance1.equipped).not.toBe(appearance2.equipped)
    })
  })

  describe('AppearanceComponent', () => {
    it('can hold multiple equipped appearances', () => {
      // Arrange
      const appearance: AppearanceComponent = createAppearanceComponent()
      const equipped1: EquippedAppearance = {
        categoryId: 'armor',
        appearanceId: 'steel-plate-armor',
      }
      const equipped2: EquippedAppearance = {
        categoryId: 'tattoos',
        appearanceId: 'tribal-face-tattoo',
      }

      // Act
      appearance.equipped.push(equipped1, equipped2)

      // Assert
      expect(appearance.equipped).toHaveLength(2)
      expect(appearance.equipped[0]).toEqual({
        categoryId: 'armor',
        appearanceId: 'steel-plate-armor',
      })
      expect(appearance.equipped[1]).toEqual({
        categoryId: 'tattoos',
        appearanceId: 'tribal-face-tattoo',
      })
    })

    it('allows empty equipped array', () => {
      // Arrange
      const appearance: AppearanceComponent = {
        equipped: [],
      }

      // Assert
      expect(appearance.equipped).toEqual([])
    })
  })

  describe('EquippedAppearance', () => {
    it('has categoryId and appearanceId', () => {
      // Arrange
      const equipped: EquippedAppearance = {
        categoryId: 'armor',
        appearanceId: 'leather-vest',
      }

      // Assert
      expect(equipped.categoryId).toBe('armor')
      expect(equipped.appearanceId).toBe('leather-vest')
    })
  })
})
