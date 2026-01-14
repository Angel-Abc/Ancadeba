import { describe, expect, it, vi } from 'vitest'
import { EquipAppearanceActionHandler } from '../../../core/actionHandlers/EquipAppearanceActionHandler'
import type { IAppearanceService } from '../../../appearance/appearanceService'

describe('core/actionHandlers/EquipAppearanceActionHandler', () => {
  const createMockAppearanceService = (): IAppearanceService => ({
    getPlayerAppearances: vi.fn(),
    hasAppearanceInCategory: vi.fn(() => false),
    getEquippedAppearance: vi.fn(),
    equipAppearance: vi.fn(),
    unequipAppearance: vi.fn(),
    getAllEquippedAppearances: vi.fn(() => []),
  })

  it('canHandle returns true for equip-appearance actions', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new EquipAppearanceActionHandler(appearanceService)

    // Act
    const result = handler.canHandle({
      type: 'equip-appearance',
      categoryId: 'armor',
      appearanceId: 'steel-plate-armor',
    })

    // Assert
    expect(result).toBe(true)
  })

  it('canHandle returns false for other action types', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new EquipAppearanceActionHandler(appearanceService)

    // Act
    const result = handler.canHandle({ type: 'back' })

    // Assert
    expect(result).toBe(false)
  })

  it('handle calls equipAppearance with correct parameters', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new EquipAppearanceActionHandler(appearanceService)

    // Act
    handler.handle({
      type: 'equip-appearance',
      categoryId: 'armor',
      appearanceId: 'steel-plate-armor',
    })

    // Assert
    expect(appearanceService.equipAppearance).toHaveBeenCalledTimes(1)
    expect(appearanceService.equipAppearance).toHaveBeenCalledWith(
      'armor',
      'steel-plate-armor'
    )
  })

  it('handle does nothing for non-equip-appearance actions', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new EquipAppearanceActionHandler(appearanceService)

    // Act
    handler.handle({ type: 'back' })

    // Assert
    expect(appearanceService.equipAppearance).not.toHaveBeenCalled()
  })

  it('handle equips multiple appearances in sequence', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new EquipAppearanceActionHandler(appearanceService)

    // Act
    handler.handle({
      type: 'equip-appearance',
      categoryId: 'armor',
      appearanceId: 'steel-plate-armor',
    })
    handler.handle({
      type: 'equip-appearance',
      categoryId: 'tattoos',
      appearanceId: 'tribal-face-tattoo',
    })

    // Assert
    expect(appearanceService.equipAppearance).toHaveBeenCalledTimes(2)
    expect(appearanceService.equipAppearance).toHaveBeenNthCalledWith(
      1,
      'armor',
      'steel-plate-armor'
    )
    expect(appearanceService.equipAppearance).toHaveBeenNthCalledWith(
      2,
      'tattoos',
      'tribal-face-tattoo'
    )
  })

  it('handle replaces appearance in same category', () => {
    // Arrange
    const appearanceService = createMockAppearanceService()
    const handler = new EquipAppearanceActionHandler(appearanceService)

    // Act
    handler.handle({
      type: 'equip-appearance',
      categoryId: 'armor',
      appearanceId: 'leather-vest',
    })
    handler.handle({
      type: 'equip-appearance',
      categoryId: 'armor',
      appearanceId: 'steel-plate-armor',
    })

    // Assert
    expect(appearanceService.equipAppearance).toHaveBeenCalledTimes(2)
    expect(appearanceService.equipAppearance).toHaveBeenNthCalledWith(
      1,
      'armor',
      'leather-vest'
    )
    expect(appearanceService.equipAppearance).toHaveBeenNthCalledWith(
      2,
      'armor',
      'steel-plate-armor'
    )
  })
})
