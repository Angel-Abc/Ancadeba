import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IGameStateStorage } from '../../gameState.ts/storage'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import type { IBrowserAdapter } from '../../system/browserAdapter'
import { CORE_MESSAGES } from '../../messages/core'
import { ActionExecutor } from '../../core/actionExecutor'

describe('core/actionExecutor', () => {
  it('updates state and publishes scene changes on switch-scene', () => {
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
    const update = vi.fn()
    const gameStateStorage: IGameStateStorage = {
      update,
      set state(_value) {},
      get state() {
        return {
          activeScene: '',
          title: '',
          flags: {},
          sceneStack: [],
        }
      },
      getFlag: vi.fn(),
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
      gameStateStorage,
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
    expect(update).toHaveBeenCalledWith({ activeScene: 'scene-1' })
    expect(update).toHaveBeenCalledWith({ sceneStack: ['scene-1'] })
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.SCENE_CHANGED,
      { sceneId: 'scene-1' }
    )
  })

  it('sets flags on set-flag actions', () => {
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
    const setFlag = vi.fn()
    const gameStateStorage: IGameStateStorage = {
      update: vi.fn(),
      set state(_value) {},
      get state() {
        return {
          activeScene: '',
          title: '',
          flags: {},
          sceneStack: [],
        }
      },
      getFlag: vi.fn(),
      setFlag,
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
      gameStateStorage,
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
    expect(setFlag).toHaveBeenCalledWith('flag-1', true)
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
    const gameStateStorage: IGameStateStorage = {
      update: vi.fn(),
      set state(_value) {},
      get state() {
        return {
          activeScene: '',
          title: '',
          flags: {},
          sceneStack: [],
        }
      },
      getFlag: vi.fn(),
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
      gameStateStorage,
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

  it('logs a warning when back is called with a single scene', () => {
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
    const update = vi.fn()
    const gameStateStorage: IGameStateStorage = {
      update,
      set state(_value) {},
      get state() {
        return {
          activeScene: 'scene-1',
          title: '',
          flags: {},
          sceneStack: ['scene-1'],
        }
      },
      getFlag: vi.fn(),
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
      gameStateStorage,
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
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/ActionExecutor',
      'Cannot go back, scene stack is empty'
    )
    expect(update).not.toHaveBeenCalled()
  })

  it('updates state and publishes a scene change when going back', () => {
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
    const update = vi.fn()
    const gameStateStorage: IGameStateStorage = {
      update,
      set state(_value) {},
      get state() {
        return {
          activeScene: 'scene-3',
          title: '',
          flags: {},
          sceneStack: ['scene-1', 'scene-2', 'scene-3'],
        }
      },
      getFlag: vi.fn(),
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
      gameStateStorage,
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
    expect(update).toHaveBeenCalledWith({
      sceneStack: ['scene-1', 'scene-2'],
    })
    expect(update).toHaveBeenCalledWith({ activeScene: 'scene-2' })
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.SCENE_CHANGED,
      { sceneId: 'scene-2' }
    )
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
    const gameStateStorage: IGameStateStorage = {
      update: vi.fn(),
      set state(_value) {},
      get state() {
        return {
          activeScene: '',
          title: '',
          flags: {},
          sceneStack: [],
        }
      },
      getFlag: vi.fn(),
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
      gameStateStorage,
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
