import { describe, expect, it, vi } from 'vitest'
import type { AppearanceCategory } from '@ancadeba/schemas'
import type { IAppearanceCategoryStorage } from '../../../resourceData/storage'
import { AppearanceCategoryInitializer } from '../../../core/initializers/appearanceCategoryInitializer'

describe('core/initializers/appearanceCategoryInitializer', () => {
  const createMockAppearanceCategoryStorage =
    (): IAppearanceCategoryStorage => ({
      addAppearanceCategoryData: vi.fn(),
      getAppearanceCategoryData: vi.fn(),
      getAllAppearanceCategories: vi.fn(() => []),
    })

  it('processes empty array without errors', () => {
    // Arrange
    const storage = createMockAppearanceCategoryStorage()
    const initializer = new AppearanceCategoryInitializer(storage)

    // Act
    initializer.initializeAppearanceCategories([])

    // Assert
    expect(storage.addAppearanceCategoryData).not.toHaveBeenCalled()
  })

  it('adds single category with correct ID', () => {
    // Arrange
    const storage = createMockAppearanceCategoryStorage()
    const initializer = new AppearanceCategoryInitializer(storage)
    const category: AppearanceCategory = {
      id: 'armor',
      name: 'appearance.category.armor.name',
      description: 'appearance.category.armor.description',
      grid: {
        rows: 5,
        columns: 3,
      },
      cells: [
        {
          position: { row: 0, column: 1 },
          slotId: 'head',
        },
      ],
    }

    // Act
    initializer.initializeAppearanceCategories([category])

    // Assert
    expect(storage.addAppearanceCategoryData).toHaveBeenCalledTimes(1)
    expect(storage.addAppearanceCategoryData).toHaveBeenCalledWith(
      'armor',
      category
    )
  })

  it('adds multiple categories', () => {
    // Arrange
    const storage = createMockAppearanceCategoryStorage()
    const initializer = new AppearanceCategoryInitializer(storage)
    const category1: AppearanceCategory = {
      id: 'armor',
      name: 'appearance.category.armor.name',
      description: 'appearance.category.armor.description',
      grid: {
        rows: 5,
        columns: 3,
      },
      cells: [],
    }
    const category2: AppearanceCategory = {
      id: 'tattoos',
      name: 'appearance.category.tattoos.name',
      description: 'appearance.category.tattoos.description',
      grid: {
        rows: 8,
        columns: 6,
      },
      cells: [],
    }

    // Act
    initializer.initializeAppearanceCategories([category1, category2])

    // Assert
    expect(storage.addAppearanceCategoryData).toHaveBeenCalledTimes(2)
    expect(storage.addAppearanceCategoryData).toHaveBeenCalledWith(
      'armor',
      category1
    )
    expect(storage.addAppearanceCategoryData).toHaveBeenCalledWith(
      'tattoos',
      category2
    )
  })

  it('adds all categories from array in order', () => {
    // Arrange
    const storage = createMockAppearanceCategoryStorage()
    const initializer = new AppearanceCategoryInitializer(storage)
    const categories: AppearanceCategory[] = [
      {
        id: 'armor',
        name: 'appearance.category.armor.name',
        description: 'appearance.category.armor.description',
        grid: { rows: 5, columns: 3 },
        cells: [],
      },
      {
        id: 'tattoos',
        name: 'appearance.category.tattoos.name',
        description: 'appearance.category.tattoos.description',
        grid: { rows: 8, columns: 6 },
        cells: [],
      },
      {
        id: 'hairstyles',
        name: 'appearance.category.hairstyles.name',
        description: 'appearance.category.hairstyles.description',
        grid: { rows: 4, columns: 4 },
        cells: [],
      },
    ]

    // Act
    initializer.initializeAppearanceCategories(categories)

    // Assert
    expect(storage.addAppearanceCategoryData).toHaveBeenCalledTimes(3)
    categories.forEach((category) => {
      expect(storage.addAppearanceCategoryData).toHaveBeenCalledWith(
        category.id,
        category
      )
    })
  })
})
