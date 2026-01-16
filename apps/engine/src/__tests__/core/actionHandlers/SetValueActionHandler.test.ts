import { describe, expect, it, vi } from 'vitest'
import { SetValueActionHandler } from '../../../core/actionHandlers/SetValueActionHandler'
import type { IGameStateManager } from '../../../gameState.ts/manager'

describe('core/actionHandlers/SetValueActionHandler', () => {
  const createMockGameStateManager = (): IGameStateManager => ({
    switchScene: vi.fn(),
    goBack: vi.fn(),
    setFlag: vi.fn(),
    setValue: vi.fn(),
    unsetValue: vi.fn(),
  })

  describe('canHandle', () => {
    it('returns true for set-value actions', () => {
      // Arrange
      const gameStateManager = createMockGameStateManager()
      const handler = new SetValueActionHandler(gameStateManager)

      // Act
      const result = handler.canHandle({
        type: 'set-value',
        name: 'player-choice',
        value: 'helped-merchant',
      })

      // Assert
      expect(result).toBe(true)
    })

    it('returns true for unset-value actions', () => {
      // Arrange
      const gameStateManager = createMockGameStateManager()
      const handler = new SetValueActionHandler(gameStateManager)

      // Act
      const result = handler.canHandle({
        type: 'unset-value',
        name: 'temporary-value',
      })

      // Assert
      expect(result).toBe(true)
    })

    it('returns false for other action types', () => {
      // Arrange
      const gameStateManager = createMockGameStateManager()
      const handler = new SetValueActionHandler(gameStateManager)

      // Act
      const result = handler.canHandle({ type: 'back' })

      // Assert
      expect(result).toBe(false)
    })
  })

  describe('handle', () => {
    it('calls setValue with correct arguments for set-value actions', () => {
      // Arrange
      const gameStateManager = createMockGameStateManager()
      const handler = new SetValueActionHandler(gameStateManager)

      // Act
      handler.handle({
        type: 'set-value',
        name: 'player-choice',
        value: 'helped-merchant',
      })

      // Assert
      expect(gameStateManager.setValue).toHaveBeenCalledTimes(1)
      expect(gameStateManager.setValue).toHaveBeenCalledWith(
        'player-choice',
        'helped-merchant'
      )
    })

    it('calls unsetValue with correct arguments for unset-value actions', () => {
      // Arrange
      const gameStateManager = createMockGameStateManager()
      const handler = new SetValueActionHandler(gameStateManager)

      // Act
      handler.handle({
        type: 'unset-value',
        name: 'temporary-value',
      })

      // Assert
      expect(gameStateManager.unsetValue).toHaveBeenCalledTimes(1)
      expect(gameStateManager.unsetValue).toHaveBeenCalledWith(
        'temporary-value'
      )
    })

    it('does nothing for non-matching action types', () => {
      // Arrange
      const gameStateManager = createMockGameStateManager()
      const handler = new SetValueActionHandler(gameStateManager)

      // Act
      handler.handle({ type: 'back' })

      // Assert
      expect(gameStateManager.setValue).not.toHaveBeenCalled()
      expect(gameStateManager.unsetValue).not.toHaveBeenCalled()
    })
  })
})
