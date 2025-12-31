import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../../messages/core'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import { GameStateManager } from '../../gameState.ts/manager'
import { GameStateStorage } from '../../gameState.ts/storage'

const createLogger = (): ILogger => ({
  debug: vi.fn(() => ''),
  info: vi.fn(() => ''),
  warn: vi.fn(() => ''),
  error: vi.fn(() => ''),
  fatal: vi.fn(() => {
    throw new Error('fatal')
  }),
})

const createMessageBus = (): IEngineMessageBus => ({
  publish: vi.fn(),
  publishRaw: vi.fn(),
  subscribe: vi.fn(() => () => undefined),
  subscribeRaw: vi.fn(() => () => undefined),
})

describe('gameState/manager', () => {
  it('updates the stack and publishes scene changes on switchScene', () => {
    // Arrange
    const logger = createLogger()
    const messageBus = createMessageBus()
    const storage = new GameStateStorage()
    storage.state = {
      activeScene: 'scene-1',
      title: '',
      flags: {},
      sceneStack: ['scene-1'],
    }
    const manager = new GameStateManager(logger, messageBus, storage)

    // Act
    manager.switchScene('scene-2')

    // Assert
    expect(storage.state).toEqual({
      activeScene: 'scene-2',
      title: '',
      flags: {},
      sceneStack: ['scene-1', 'scene-2'],
    })
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.SCENE_CHANGED,
      { sceneId: 'scene-2' }
    )
  })

  it('logs a warning and avoids updates when goBack is called on the first scene', () => {
    // Arrange
    const logger = createLogger()
    const messageBus = createMessageBus()
    const storage = new GameStateStorage()
    storage.state = {
      activeScene: 'scene-1',
      title: '',
      flags: {},
      sceneStack: ['scene-1'],
    }
    const updateSpy = vi.spyOn(storage, 'update')
    const manager = new GameStateManager(logger, messageBus, storage)

    // Act
    manager.goBack()

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/gameState/manager',
      'Cannot go back, scene stack is empty'
    )
    expect(updateSpy).not.toHaveBeenCalled()
    expect(messageBus.publish).not.toHaveBeenCalled()
  })

  it('updates the stack and publishes scene changes on goBack', () => {
    // Arrange
    const logger = createLogger()
    const messageBus = createMessageBus()
    const storage = new GameStateStorage()
    storage.state = {
      activeScene: 'scene-3',
      title: '',
      flags: {},
      sceneStack: ['scene-1', 'scene-2', 'scene-3'],
    }
    const manager = new GameStateManager(logger, messageBus, storage)

    // Act
    manager.goBack()

    // Assert
    expect(storage.state).toEqual({
      activeScene: 'scene-2',
      title: '',
      flags: {},
      sceneStack: ['scene-1', 'scene-2'],
    })
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.SCENE_CHANGED,
      { sceneId: 'scene-2' }
    )
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('sets flags through storage', () => {
    // Arrange
    const logger = createLogger()
    const messageBus = createMessageBus()
    const storage = new GameStateStorage()
    const manager = new GameStateManager(logger, messageBus, storage)

    // Act
    manager.setFlag('flag-1', true)

    // Assert
    expect(storage.state.flags).toEqual({
      'flag-1': true,
    })
  })
})
