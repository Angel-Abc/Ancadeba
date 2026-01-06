import { describe, expect, it, vi } from 'vitest'
import { SwitchSceneActionHandler } from '../../../core/actionHandlers/SwitchSceneActionHandler'
import { ExitGameActionHandler } from '../../../core/actionHandlers/ExitGameActionHandler'
import { SetFlagActionHandler } from '../../../core/actionHandlers/SetFlagActionHandler'
import { BackActionHandler } from '../../../core/actionHandlers/BackActionHandler'
import { VolumeActionHandler } from '../../../core/actionHandlers/VolumeActionHandler'
import type { IGameStateManager } from '../../../gameState.ts/manager'
import type { IBrowserAdapter } from '../../../system/browserAdapter'

describe('core/actionHandlers', () => {
  describe('SwitchSceneActionHandler', () => {
    it('handles switch-scene actions', () => {
      // Arrange
      const gameStateManager: IGameStateManager = {
        switchScene: vi.fn(),
        goBack: vi.fn(),
        setFlag: vi.fn(),
      }
      const handler = new SwitchSceneActionHandler(gameStateManager)

      // Act
      const canHandle = handler.canHandle({
        type: 'switch-scene',
        targetSceneId: 'scene-1',
      })
      handler.handle({ type: 'switch-scene', targetSceneId: 'scene-1' })

      // Assert
      expect(canHandle).toBe(true)
      expect(gameStateManager.switchScene).toHaveBeenCalledWith('scene-1')
    })

    it('does not handle other action types', () => {
      // Arrange
      const gameStateManager: IGameStateManager = {
        switchScene: vi.fn(),
        goBack: vi.fn(),
        setFlag: vi.fn(),
      }
      const handler = new SwitchSceneActionHandler(gameStateManager)

      // Act
      const canHandle = handler.canHandle({ type: 'back' })

      // Assert
      expect(canHandle).toBe(false)
    })
  })

  describe('ExitGameActionHandler', () => {
    it('handles exit-game actions', () => {
      // Arrange
      const browserAdapter: IBrowserAdapter = {
        reload: vi.fn(),
      }
      const handler = new ExitGameActionHandler(browserAdapter)

      // Act
      const canHandle = handler.canHandle({ type: 'exit-game' })
      handler.handle({ type: 'exit-game' })

      // Assert
      expect(canHandle).toBe(true)
      expect(browserAdapter.reload).toHaveBeenCalledTimes(1)
    })
  })

  describe('SetFlagActionHandler', () => {
    it('handles set-flag actions', () => {
      // Arrange
      const gameStateManager: IGameStateManager = {
        switchScene: vi.fn(),
        goBack: vi.fn(),
        setFlag: vi.fn(),
      }
      const handler = new SetFlagActionHandler(gameStateManager)

      // Act
      const canHandle = handler.canHandle({
        type: 'set-flag',
        name: 'flag-1',
        value: true,
      })
      handler.handle({ type: 'set-flag', name: 'flag-1', value: true })

      // Assert
      expect(canHandle).toBe(true)
      expect(gameStateManager.setFlag).toHaveBeenCalledWith('flag-1', true)
    })
  })

  describe('BackActionHandler', () => {
    it('handles back actions', () => {
      // Arrange
      const gameStateManager: IGameStateManager = {
        switchScene: vi.fn(),
        goBack: vi.fn(),
        setFlag: vi.fn(),
      }
      const handler = new BackActionHandler(gameStateManager)

      // Act
      const canHandle = handler.canHandle({ type: 'back' })
      handler.handle({ type: 'back' })

      // Assert
      expect(canHandle).toBe(true)
      expect(gameStateManager.goBack).toHaveBeenCalledTimes(1)
    })
  })

  describe('VolumeActionHandler', () => {
    it('handles volume-up and volume-down actions', () => {
      // Arrange
      const handler = new VolumeActionHandler()

      // Act & Assert
      expect(handler.canHandle({ type: 'volume-up' })).toBe(true)
      expect(handler.canHandle({ type: 'volume-down' })).toBe(true)
      expect(handler.canHandle({ type: 'back' })).toBe(false)

      // Act - should not throw
      handler.handle({ type: 'volume-up' })
      handler.handle({ type: 'volume-down' })
    })
  })
})
