import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IGameStateManager } from '../../gameState.ts/manager'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import type { IBrowserAdapter } from '../../system/browserAdapter'
import { CORE_MESSAGES } from '../../messages/core'
import { ActionExecutor } from '../../core/actionExecutor'

describe('core/actionExecutor', () => {
  it('delegates switch-scene to the game state manager', () => {
    // Arrange
    const logger: ILogger = {
      debug: vi.fn(() => ''),
      info: vi.fn(() => ''),
      warn: vi.fn(() => ''),
      error: vi.fn(() => ''),
      fatal: vi.fn(() => {
        throw new Error('fatal')
      }),
    }
    const gameStateManager: IGameStateManager = {
      switchScene: vi.fn(),
      goBack: vi.fn(),
      setFlag: vi.fn(),
    }
    let subscribedHandler:
      | ((payload: { action: { type: 'switch-scene'; targetSceneId: string } }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((message, handler) => {
        if (message === CORE_MESSAGES.EXECUTE_ACTION) {
          subscribedHandler = handler
        }
        return () => undefined
      }),
      subscribeRaw: vi.fn(() => () => undefined),
    }
    const browserAdapter: IBrowserAdapter = {
      reload: vi.fn(),
    }
    const executor = new ActionExecutor(
      logger,
      messageBus,
      gameStateManager,
      browserAdapter
    )

    // Act
    executor.start()

    // Assert
    expect(messageBus.subscribe).toHaveBeenCalledWith(
      CORE_MESSAGES.EXECUTE_ACTION,
      expect.any(Function)
    )
    expect(subscribedHandler).toBeDefined()

    if (!subscribedHandler) throw new Error('Expected a subscribed handler')

    // Act
    subscribedHandler({
      action: { type: 'switch-scene', targetSceneId: 'scene-1' },
    })

    // Assert
    expect(gameStateManager.switchScene).toHaveBeenCalledWith('scene-1')
  })

  it('delegates set-flag to the game state manager', () => {
    // Arrange
    const logger: ILogger = {
      debug: vi.fn(() => ''),
      info: vi.fn(() => ''),
      warn: vi.fn(() => ''),
      error: vi.fn(() => ''),
      fatal: vi.fn(() => {
        throw new Error('fatal')
      }),
    }
    const gameStateManager: IGameStateManager = {
      switchScene: vi.fn(),
      goBack: vi.fn(),
      setFlag: vi.fn(),
    }
    let subscribedHandler:
      | ((payload: { action: { type: 'set-flag'; name: string; value: boolean } }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((message, handler) => {
        if (message === CORE_MESSAGES.EXECUTE_ACTION) {
          subscribedHandler = handler
        }
        return () => undefined
      }),
      subscribeRaw: vi.fn(() => () => undefined),
    }
    const browserAdapter: IBrowserAdapter = {
      reload: vi.fn(),
    }
    const executor = new ActionExecutor(
      logger,
      messageBus,
      gameStateManager,
      browserAdapter
    )

    // Act
    executor.start()

    // Assert
    expect(messageBus.subscribe).toHaveBeenCalledWith(
      CORE_MESSAGES.EXECUTE_ACTION,
      expect.any(Function)
    )
    expect(subscribedHandler).toBeDefined()

    if (!subscribedHandler) throw new Error('Expected a subscribed handler')

    // Act
    subscribedHandler({
      action: { type: 'set-flag', name: 'flag-1', value: true },
    })

    // Assert
    expect(gameStateManager.setFlag).toHaveBeenCalledWith('flag-1', true)
  })

  it('reloads the page on exit-game actions', () => {
    // Arrange
    const logger: ILogger = {
      debug: vi.fn(() => ''),
      info: vi.fn(() => ''),
      warn: vi.fn(() => ''),
      error: vi.fn(() => ''),
      fatal: vi.fn(() => {
        throw new Error('fatal')
      }),
    }
    const gameStateManager: IGameStateManager = {
      switchScene: vi.fn(),
      goBack: vi.fn(),
      setFlag: vi.fn(),
    }
    let subscribedHandler:
      | ((payload: { action: { type: 'exit-game' } }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((message, handler) => {
        if (message === CORE_MESSAGES.EXECUTE_ACTION) {
          subscribedHandler = handler
        }
        return () => undefined
      }),
      subscribeRaw: vi.fn(() => () => undefined),
    }
    const reload = vi.fn()
    const browserAdapter: IBrowserAdapter = {
      reload,
    }
    const executor = new ActionExecutor(
      logger,
      messageBus,
      gameStateManager,
      browserAdapter
    )

    // Act
    executor.start()

    // Assert
    expect(messageBus.subscribe).toHaveBeenCalledWith(
      CORE_MESSAGES.EXECUTE_ACTION,
      expect.any(Function)
    )
    expect(subscribedHandler).toBeDefined()

    if (!subscribedHandler) throw new Error('Expected a subscribed handler')

    // Act
    subscribedHandler({ action: { type: 'exit-game' } })

    // Assert
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('delegates back to the game state manager', () => {
    // Arrange
    const logger: ILogger = {
      debug: vi.fn(() => ''),
      info: vi.fn(() => ''),
      warn: vi.fn(() => ''),
      error: vi.fn(() => ''),
      fatal: vi.fn(() => {
        throw new Error('fatal')
      }),
    }
    const gameStateManager: IGameStateManager = {
      switchScene: vi.fn(),
      goBack: vi.fn(),
      setFlag: vi.fn(),
    }
    let subscribedHandler:
      | ((payload: { action: { type: 'back' } }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((message, handler) => {
        if (message === CORE_MESSAGES.EXECUTE_ACTION) {
          subscribedHandler = handler
        }
        return () => undefined
      }),
      subscribeRaw: vi.fn(() => () => undefined),
    }
    const browserAdapter: IBrowserAdapter = {
      reload: vi.fn(),
    }
    const executor = new ActionExecutor(
      logger,
      messageBus,
      gameStateManager,
      browserAdapter
    )

    // Act
    executor.start()

    // Assert
    expect(messageBus.subscribe).toHaveBeenCalledWith(
      CORE_MESSAGES.EXECUTE_ACTION,
      expect.any(Function)
    )
    expect(subscribedHandler).toBeDefined()

    if (!subscribedHandler) throw new Error('Expected a subscribed handler')

    // Act
    subscribedHandler({ action: { type: 'back' } })

    // Assert
    expect(gameStateManager.goBack).toHaveBeenCalledTimes(1)
  })

  it('logs a warning for unknown actions', () => {
    // Arrange
    const logger: ILogger = {
      debug: vi.fn(() => ''),
      info: vi.fn(() => ''),
      warn: vi.fn(() => ''),
      error: vi.fn(() => ''),
      fatal: vi.fn(() => {
        throw new Error('fatal')
      }),
    }
    const gameStateManager: IGameStateManager = {
      switchScene: vi.fn(),
      goBack: vi.fn(),
      setFlag: vi.fn(),
    }
    let subscribedHandler:
      | ((payload: { action: { type: string } }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((message, handler) => {
        if (message === CORE_MESSAGES.EXECUTE_ACTION) {
          subscribedHandler = handler
        }
        return () => undefined
      }),
      subscribeRaw: vi.fn(() => () => undefined),
    }
    const browserAdapter: IBrowserAdapter = {
      reload: vi.fn(),
    }
    const executor = new ActionExecutor(
      logger,
      messageBus,
      gameStateManager,
      browserAdapter
    )
    const actionType = 'unknown-action'

    // Act
    executor.start()

    // Assert
    expect(messageBus.subscribe).toHaveBeenCalledWith(
      CORE_MESSAGES.EXECUTE_ACTION,
      expect.any(Function)
    )
    expect(subscribedHandler).toBeDefined()

    if (!subscribedHandler) throw new Error('Expected a subscribed handler')

    // Act
    const invokeAction = () => {
      subscribedHandler({ action: { type: actionType } })
    }

    // Assert
    expect(invokeAction).toThrowError('Unhandled case')
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/ActionExecutor',
      'Unknown action type: {0}',
      actionType
    )
  })
})
