import { describe, expect, it, vi } from 'vitest'
import { UnequipAppearanceActionHandler } from '../../../core/actionHandlers/UnequipAppearanceActionHandler'
import type { IAppearanceService } from '../../../appearance/appearanceService'

describe('core/actionHandlers/UnequipAppearanceActionHandler', () => {
  const createMockAppearanceService = (): IAppearanceService => ({
    getPlayerAppearances: vi.fn(),
    hasAppearanceInCategory: vi.fn(() => false),
    getEquippedAppearance: vi.fn(),
    equipAppearance: vi.fn(),
    unequipAppearance: vi.fn(),
    getAllEquippedAppearances: vi.fn(() => []),
  })

  it('canHandle returns true for unequip-appearance actions', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new UnequipAppearanceActionHandler(appearanceService)

    // Act
    const result = handler.canHandle({
      type: 'unequip-appearance',
      categoryId: 'armor',
    })

    // Assert
    expect(result).toBe(true)
  })

  it('canHandle returns false for other action types', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new UnequipAppearanceActionHandler(appearanceService)

    // Act
    const result = handler.canHandle({ type: 'back' })

    // Assert
    expect(result).toBe(false)
  })

  it('handle calls unequipAppearance with correct category', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new UnequipAppearanceActionHandler(appearanceService)

    // Act
    handler.handle({
      type: 'unequip-appearance',
      categoryId: 'armor',
    })

    // Assert
    expect(appearanceService.unequipAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceService.unequipAppearance).toHaveBeenCalledWith('armor')
  })

  it('handle does nothing for non-unequip-appearance actions', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new UnequipAppearanceActionHandler(appearanceService)

    // Act
    handler.handle({ type: 'back' })

    // Assert
    expect(appearanceService.unequipAppearance).not.toHaveBeenCalled()
  })

  it('handle unequips from multiple categories', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new UnequipAppearanceActionHandler(appearanceService)

    // Act
    handler.handle({
      type: 'unequip-appearance',
      categoryId: 'armor',
    })
    handler.handle({
      type: 'unequip-appearance',
      categoryId: 'tattoos',
    })

    // Assert
    expect(appearanceService.unequipAppearance).toHaveBeenCalledTimes(2)
    expect(appearanceService.unequipAppearance).toHaveBeenNthCalledWith(
      1,
      'armor'
    )
    expect(appearanceService.unequipAppearance).toHaveBeenNthCalledWith(
      2,
      'tattoos'
    )
  })

  it('handle unequipping from empty category does not error', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new UnequipAppearanceActionHandler(appearanceService)

    // Act & Assert - should not throw
    expect(() =>
      handler.handle({
        type: 'unequip-appearance',
        categoryId: 'armor',
      })
    ).not.toThrow()
    expect(appearanceService.unequipAppearance).toHaveBeenCalledWith('armor')
  })
})
