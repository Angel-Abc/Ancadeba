import { describe, expect, it, vi } from 'vitest'
import type { Appearance } from '@ancadeba/schemas'
import type { IAppearanceDataStorage } from '../../../resourceData/storage'
import { AppearanceDataInitializer } from '../../../core/initializers/appearanceDataInitializer'

describe('core/initializers/appearanceDataInitializer', () => {
  const createMockAppearanceDataStorage = (): IAppearanceDataStorage => ({
    addAppearanceData: vi.fn(),
    getAppearanceData: vi.fn(),
    getAppearancesByCategory: vi.fn(() => []),
  })

  it('processes empty array without errors', () => {
    // Arrange
    const storage = createMockAppearanceDataStorage()
    const initializer = new AppearanceDataInitializer(storage)

    // Act
    initializer.initializeAppearances([])

    // Assert
    expect(storage.addAppearanceData).not.toHaveBeenCalled()
  })

  it('adds single appearance with correct ID', () => {
    // Arrange
    const storage = createMockAppearanceDataStorage()
    const initializer = new AppearanceDataInitializer(storage)
    const appearance: Appearance = {
      id: 'steel-plate-armor',
      name: 'appearance.steel-plate-armor.name',
      description: 'appearance.steel-plate-armor.description',
      categoryId: 'armor',
      slots: [
        {
          slotId: 'torso',
          images: ['assets/images/armor/steel-plate-torso.png'],
          layer: 2,
        },
      ],
    }

    // Act
    initializer.initializeAppearances([appearance])

    // Assert
    expect(storage.addAppearanceData).toHaveBeenCalledTimes(1)
    expect(storage.addAppearanceData).toHaveBeenCalledWith(
      'steel-plate-armor',
      appearance
    )
  })

  it('adds multiple appearances', () => {
    // Arrange
    const storage = createMockAppearanceDataStorage()
    const initializer = new AppearanceDataInitializer(storage)
    const appearance1: Appearance = {
      id: 'steel-plate-armor',
      name: 'appearance.steel-plate-armor.name',
      description: 'appearance.steel-plate-armor.description',
      categoryId: 'armor',
      slots: [],
    }
    const appearance2: Appearance = {
      id: 'tribal-face-tattoo',
      name: 'appearance.tribal-face-tattoo.name',
      description: 'appearance.tribal-face-tattoo.description',
      categoryId: 'tattoos',
      slots: [],
    }

    // Act
    initializer.initializeAppearances([appearance1, appearance2])

    // Assert
    expect(storage.addAppearanceData).toHaveBeenCalledTimes(2)
    expect(storage.addAppearanceData).toHaveBeenCalledWith(
      'steel-plate-armor',
      appearance1
    )
    expect(storage.addAppearanceData).toHaveBeenCalledWith(
      'tribal-face-tattoo',
      appearance2
    )
  })

  it('adds all appearances from array in order', () => {
    // Arrange
    const storage = createMockAppearanceDataStorage()
    const initializer = new AppearanceDataInitializer(storage)
    const appearances: Appearance[] = [
      {
        id: 'steel-plate-armor',
        name: 'appearance.steel-plate-armor.name',
        description: 'appearance.steel-plate-armor.description',
        categoryId: 'armor',
        slots: [],
      },
      {
        id: 'leather-vest',
        name: 'appearance.leather-vest.name',
        description: 'appearance.leather-vest.description',
        categoryId: 'armor',
        slots: [],
      },
      {
        id: 'tribal-face-tattoo',
        name: 'appearance.tribal-face-tattoo.name',
        description: 'appearance.tribal-face-tattoo.description',
        categoryId: 'tattoos',
        slots: [],
      },
    ]

    // Act
    initializer.initializeAppearances(appearances)

    // Assert
    expect(storage.addAppearanceData).toHaveBeenCalledTimes(3)
    appearances.forEach((appearance) => {
      expect(storage.addAppearanceData).toHaveBeenCalledWith(
        appearance.id,
        appearance
      )
    })
  })
})
