import { describe, expect, it, vi } from 'vitest'
import { AppearanceService } from '../../appearance/appearanceService'
import type { IWorld } from '../../ecs/world'
import {
  COMPONENT_KEYS,
  AppearanceComponent,
  EquippedAppearance,
} from '../../ecs/components'

describe('appearance/appearanceService', () => {
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

  describe('getPlayerAppearances', () => {
    it('returns player appearances when they exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const appearances: AppearanceComponent = {
        equipped: [{ categoryId: 'armor', appearanceId: 'steel-plate-armor' }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(appearances)

      // Act
      const result = service.getPlayerAppearances()

      // Assert
      expect(result).toBe(appearances)
      expect(world.getEntitiesWith).toHaveBeenCalledWith(COMPONENT_KEYS.player)
      expect(world.getComponent).toHaveBeenCalledWith(
        1,
        COMPONENT_KEYS.appearance
      )
    })

    it('returns undefined when player entity does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([])

      // Act
      const result = service.getPlayerAppearances()

      // Assert
      expect(result).toBeUndefined()
    })

    it('returns undefined when player has no appearance component', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      const result = service.getPlayerAppearances()

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('hasAppearanceInCategory', () => {
    it('returns true when appearance is equipped in category', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const appearances: AppearanceComponent = {
        equipped: [{ categoryId: 'armor', appearanceId: 'steel-plate-armor' }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(appearances)

      // Act
      const result = service.hasAppearanceInCategory('armor')

      // Assert
      expect(result).toBe(true)
    })

    it('returns false when no appearance is equipped in category', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const appearances: AppearanceComponent = {
        equipped: [{ categoryId: 'armor', appearanceId: 'steel-plate-armor' }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(appearances)

      // Act
      const result = service.hasAppearanceInCategory('tattoos')

      // Assert
      expect(result).toBe(false)
    })

    it('returns false when player has no appearances', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      const result = service.hasAppearanceInCategory('armor')

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('getEquippedAppearance', () => {
    it('returns appearance ID when equipped in category', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const appearances: AppearanceComponent = {
        equipped: [
          { categoryId: 'armor', appearanceId: 'steel-plate-armor' },
          { categoryId: 'tattoos', appearanceId: 'tribal-face-tattoo' },
        ],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(appearances)

      // Act
      const result = service.getEquippedAppearance('armor')

      // Assert
      expect(result).toBe('steel-plate-armor')
    })

    it('returns undefined when no appearance equipped in category', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const appearances: AppearanceComponent = {
        equipped: [{ categoryId: 'armor', appearanceId: 'steel-plate-armor' }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(appearances)

      // Act
      const result = service.getEquippedAppearance('tattoos')

      // Assert
      expect(result).toBeUndefined()
    })

    it('returns undefined when player has no appearances', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      const result = service.getEquippedAppearance('armor')

      // Assert
      expect(result).toBeUndefined()
    })
  })

  describe('equipAppearance', () => {
    it('equips appearance in empty category', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const existingAppearances: AppearanceComponent = {
        equipped: [],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(existingAppearances)

      // Act
      service.equipAppearance('armor', 'steel-plate-armor')

      // Assert
      expect(world.setComponent).toHaveBeenCalledWith(
        1,
        COMPONENT_KEYS.appearance,
        {
          equipped: [
            { categoryId: 'armor', appearanceId: 'steel-plate-armor' },
          ],
        }
      )
    })

    it('replaces existing appearance in same category', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const existingAppearances: AppearanceComponent = {
        equipped: [{ categoryId: 'armor', appearanceId: 'leather-vest' }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(existingAppearances)

      // Act
      service.equipAppearance('armor', 'steel-plate-armor')

      // Assert
      expect(world.setComponent).toHaveBeenCalledWith(
        1,
        COMPONENT_KEYS.appearance,
        {
          equipped: [
            { categoryId: 'armor', appearanceId: 'steel-plate-armor' },
          ],
        }
      )
    })

    it('preserves appearances in other categories', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const existingAppearances: AppearanceComponent = {
        equipped: [
          { categoryId: 'armor', appearanceId: 'leather-vest' },
          { categoryId: 'tattoos', appearanceId: 'tribal-face-tattoo' },
        ],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(existingAppearances)

      // Act
      service.equipAppearance('armor', 'steel-plate-armor')

      // Assert
      const call = vi.mocked(world.setComponent).mock.calls[0]
      const updatedAppearances = call[2] as AppearanceComponent
      expect(updatedAppearances.equipped).toHaveLength(2)
      expect(updatedAppearances.equipped).toContainEqual({
        categoryId: 'armor',
        appearanceId: 'steel-plate-armor',
      })
      expect(updatedAppearances.equipped).toContainEqual({
        categoryId: 'tattoos',
        appearanceId: 'tribal-face-tattoo',
      })
    })

    it('creates appearance component if it does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      service.equipAppearance('armor', 'steel-plate-armor')

      // Assert
      expect(world.setComponent).toHaveBeenCalledWith(
        1,
        COMPONENT_KEYS.appearance,
        {
          equipped: [
            { categoryId: 'armor', appearanceId: 'steel-plate-armor' },
          ],
        }
      )
    })

    it('does nothing when player does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([])

      // Act
      service.equipAppearance('armor', 'steel-plate-armor')

      // Assert
      expect(world.setComponent).not.toHaveBeenCalled()
    })
  })

  describe('unequipAppearance', () => {
    it('removes appearance from category', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const existingAppearances: AppearanceComponent = {
        equipped: [{ categoryId: 'armor', appearanceId: 'steel-plate-armor' }],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(existingAppearances)

      // Act
      service.unequipAppearance('armor')

      // Assert
      expect(world.setComponent).toHaveBeenCalledWith(
        1,
        COMPONENT_KEYS.appearance,
        {
          equipped: [],
        }
      )
    })

    it('preserves appearances in other categories', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const existingAppearances: AppearanceComponent = {
        equipped: [
          { categoryId: 'armor', appearanceId: 'steel-plate-armor' },
          { categoryId: 'tattoos', appearanceId: 'tribal-face-tattoo' },
        ],
      }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(existingAppearances)

      // Act
      service.unequipAppearance('armor')

      // Assert
      expect(world.setComponent).toHaveBeenCalledWith(
        1,
        COMPONENT_KEYS.appearance,
        {
          equipped: [
            { categoryId: 'tattoos', appearanceId: 'tribal-face-tattoo' },
          ],
        }
      )
    })

    it('does nothing when player has no appearances', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      service.unequipAppearance('armor')

      // Assert
      expect(world.setComponent).not.toHaveBeenCalled()
    })

    it('does nothing when player does not exist', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([])

      // Act
      service.unequipAppearance('armor')

      // Assert
      expect(world.setComponent).not.toHaveBeenCalled()
    })
  })

  describe('getAllEquippedAppearances', () => {
    it('returns all equipped appearances', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const equipped: EquippedAppearance[] = [
        { categoryId: 'armor', appearanceId: 'steel-plate-armor' },
        { categoryId: 'tattoos', appearanceId: 'tribal-face-tattoo' },
      ]
      const appearances: AppearanceComponent = { equipped }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(appearances)

      // Act
      const result = service.getAllEquippedAppearances()

      // Assert
      expect(result).toEqual(equipped)
      expect(result).toHaveLength(2)
    })

    it('returns empty array when no appearances equipped', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const appearances: AppearanceComponent = { equipped: [] }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(appearances)

      // Act
      const result = service.getAllEquippedAppearances()

      // Assert
      expect(result).toEqual([])
    })

    it('returns empty array when player has no appearances component', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(undefined)

      // Act
      const result = service.getAllEquippedAppearances()

      // Assert
      expect(result).toEqual([])
    })

    it('returns a copy of the array not the original', () => {
      // Arrange
      const world = createMockWorld()
      const service = new AppearanceService(world)

      const equipped: EquippedAppearance[] = [
        { categoryId: 'armor', appearanceId: 'steel-plate-armor' },
      ]
      const appearances: AppearanceComponent = { equipped }
      vi.mocked(world.getEntitiesWith).mockReturnValue([1])
      vi.mocked(world.getComponent).mockReturnValue(appearances)

      // Act
      const result = service.getAllEquippedAppearances()

      // Assert
      expect(result).not.toBe(equipped)
      expect(result).toEqual(equipped)
    })
  })
})
