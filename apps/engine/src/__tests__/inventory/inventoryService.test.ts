import { describe, expect, it, vi } from 'vitest'
import { InventoryService } from '../../inventory/inventoryService'
import type { IWorld } from '../../ecs/world'
import { COMPONENT_KEYS, InventoryComponent } from '../../ecs/components'

describe('inventory/inventoryService', () => {
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

  describe('getPlayerInventory', () => {
    it('returns player inventory when it exists', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [{ itemId: 'apple', quantity: 3 }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.getPlayerInventory()

      // Assert
      expect(result).toBe(inventory)
      expect(world.getEntitiesWith).toHaveBeenCalledWith(COMPONENT_KEYS.player)
      expect(world.getComponent).toHaveBeenCalledWith(
        1,
        COMPONENT_KEYS.inventory
      )
    })

    it('returns undefined when player entity does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([])

      // Act
      const result = service.getPlayerInventory()

      // Assert
      expect(result).toBeUndefined()
    })

    it('returns undefined when player has no inventory component', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      const result = service.getPlayerInventory()

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('hasItem', () => {
    it('returns true when player has item with sufficient quantity', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [{ itemId: 'apple', quantity: 5 }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.hasItem('apple', 3)

      // Assert
      expect(result).toBe(true)
    })

    it('returns true when player has exact quantity', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [{ itemId: 'brass-key', quantity: 1 }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.hasItem('brass-key', 1)

      // Assert
      expect(result).toBe(true)
    })

    it('uses default quantity of 1 when not specified', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [{ itemId: 'health-potion', quantity: 2 }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.hasItem('health-potion')

      // Assert
      expect(result).toBe(true)
    })

    it('returns false when player has insufficient quantity', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [{ itemId: 'apple', quantity: 2 }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.hasItem('apple', 5)

      // Assert
      expect(result).toBe(false)
    })

    it('returns false when item does not exist in inventory', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [{ itemId: 'apple', quantity: 3 }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.hasItem('brass-key')

      // Assert
      expect(result).toBe(false)
    })

    it('returns false when player has no inventory', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      const result = service.hasItem('apple')

      // Assert
      expect(result).toBe(false)
    })

    it('returns false when player entity does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([])

      // Act
      const result = service.hasItem('apple')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getItemQuantity', () => {
    it('returns correct quantity when item exists', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [
          { itemId: 'apple', quantity: 7 },
          { itemId: 'brass-key', quantity: 1 },
        ],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.getItemQuantity('apple')

      // Assert
      expect(result).toBe(7)
    })

    it('returns 0 when item does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [{ itemId: 'apple', quantity: 5 }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.getItemQuantity('brass-key')

      // Assert
      expect(result).toBe(0)
    })

    it('returns 0 when player has no inventory', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      const result = service.getItemQuantity('apple')

      // Assert
      expect(result).toBe(0)
    })

    it('returns 0 when player entity does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([])

      // Act
      const result = service.getItemQuantity('apple')

      // Assert
      expect(result).toBe(0)
    })

    it('returns 0 for empty inventory', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.getItemQuantity('apple')

      // Assert
      expect(result).toBe(0)
    })
  })

  describe('getTotalItems', () => {
    it('returns correct count for multiple items', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

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
      const result = service.getTotalItems()

      // Assert
      expect(result).toBe(3)
    })

    it('returns 1 for single item', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [{ itemId: 'apple', quantity: 10 }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.getTotalItems()

      // Assert
      expect(result).toBe(1)
    })

    it('returns 0 for empty inventory', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      const inventory: InventoryComponent = {
        items: [],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(inventory)

      // Act
      const result = service.getTotalItems()

      // Assert
      expect(result).toBe(0)
    })

    it('returns 0 when player has no inventory', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      const result = service.getTotalItems()

      // Assert
      expect(result).toBe(0)
    })

    it('returns 0 when player entity does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new InventoryService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([])

      // Act
      const result = service.getTotalItems()

      // Assert
      expect(result).toBe(0)
    })
  })
})
