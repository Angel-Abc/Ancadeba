import { describe, expect, it, vi } from 'vitest'
import { SwitchSceneActionHandler } from '../../../core/actionHandlers/SwitchSceneActionHandler'
import { ExitGameActionHandler } from '../../../core/actionHandlers/ExitGameActionHandler'
import { SetFlagActionHandler } from '../../../core/actionHandlers/SetFlagActionHandler'
import { BackActionHandler } from '../../../core/actionHandlers/BackActionHandler'
import { VolumeActionHandler } from '../../../core/actionHandlers/VolumeActionHandler'
import type { IGameStateManager } from '../../../gameState.ts/manager'
import type { IEngineMessageBus } from '../../../system/engineMessageBus'
import { CORE_MESSAGES } from '../../../messages/core'
import type { ISettingsStorage } from '../../../settings/storage'

describe('core/actionHandlers', () => {
  describe('SwitchSceneActionHandler', () => {
    it('handles switch-scene actions', () => {
      // Arrange
      const gameStateManager: IGameStateManager = {
        switchScene: vi.fn(),
        goBack: vi.fn(),
        setFlag: vi.fn(),
        setValue: vi.fn(),
        unsetValue: vi.fn(),
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
        setValue: vi.fn(),
        unsetValue: vi.fn(),
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
      const messageBus: IEngineMessageBus = {
        publish: vi.fn(),
        publishRaw: vi.fn(),
        subscribe: vi.fn(() => () => undefined),
        subscribeRaw: vi.fn(() => () => undefined),
      }
      const handler = new ExitGameActionHandler(messageBus)

      // Act
      const canHandle = handler.canHandle({ type: 'exit-game' })
      handler.handle({ type: 'exit-game' })

      // Assert
      expect(canHandle).toBe(true)
      expect(messageBus.publish).toHaveBeenCalledTimes(1)
      expect(messageBus.publish).toHaveBeenCalledWith(
        CORE_MESSAGES.GAME_ENGINE_STOPPED,
        undefined
      )
    })
  })

  describe('SetFlagActionHandler', () => {
    it('handles set-flag actions', () => {
      // Arrange
      const gameStateManager: IGameStateManager = {
        switchScene: vi.fn(),
        goBack: vi.fn(),
        setFlag: vi.fn(),
        setValue: vi.fn(),
        unsetValue: vi.fn(),
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
        setValue: vi.fn(),
        unsetValue: vi.fn(),
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
      const settingsStorage = {
        volume: 0.5,
      }
      const handler = new VolumeActionHandler(
        settingsStorage as ISettingsStorage
      )

      // Act & Assert
      expect(handler.canHandle({ type: 'volume-up' })).toBe(true)
      expect(handler.canHandle({ type: 'volume-down' })).toBe(true)
      expect(handler.canHandle({ type: 'back' })).toBe(false)
    })

    it('increases volume by 0.1 when handling volume-up', () => {
      // Arrange
      const settingsStorage = {
        volume: 0.5,
      }
      const handler = new VolumeActionHandler(
        settingsStorage as ISettingsStorage
      )

      // Act
      handler.handle({ type: 'volume-up' })

      // Assert
      expect(settingsStorage.volume).toBe(0.6)
    })

    it('decreases volume by 0.1 when handling volume-down', () => {
      // Arrange
      const settingsStorage = {
        volume: 0.5,
      }
      const handler = new VolumeActionHandler(
        settingsStorage as ISettingsStorage
      )

      // Act
      handler.handle({ type: 'volume-down' })

      // Assert
      expect(settingsStorage.volume).toBe(0.4)
    })

    it('caps volume at 1.0 when handling volume-up', () => {
      // Arrange
      const settingsStorage = {
        volume: 0.95,
      }
      const handler = new VolumeActionHandler(
        settingsStorage as ISettingsStorage
      )

      // Act
      handler.handle({ type: 'volume-up' })

      // Assert
      expect(settingsStorage.volume).toBe(1.0)
    })

    it('caps volume at 0.0 when handling volume-down', () => {
      // Arrange
      const settingsStorage = {
        volume: 0.05,
      }
      const handler = new VolumeActionHandler(
        settingsStorage as ISettingsStorage
      )

      // Act
      handler.handle({ type: 'volume-down' })

      // Assert
      expect(settingsStorage.volume).toBe(0.0)
    })
  })
})
