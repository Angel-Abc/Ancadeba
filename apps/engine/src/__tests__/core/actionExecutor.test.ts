import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import { CORE_MESSAGES } from '../../messages/core'
import { ActionExecutor } from '../../core/actionExecutor'
import { IActionHandler } from '../../core/actionHandlers/types'
import { Action } from '@ancadeba/schemas'

describe('core/actionExecutor', () => {
  it('delegates action to the correct handler', () => {
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
    let subscribedHandler: ((payload: { action: Action }) => void) | undefined
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
    const mockHandler: IActionHandler = {
      canHandle: vi.fn((action: Action) => action.type === 'switch-scene'),
      handle: vi.fn(),
    }
    const executor = new ActionExecutor(
      logger,
      messageBus,
      mockHandler,
      mockHandler,
      mockHandler,
      mockHandler,
      mockHandler
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
    expect(mockHandler.canHandle).toHaveBeenCalled()
    expect(mockHandler.handle).toHaveBeenCalledWith({
      type: 'switch-scene',
      targetSceneId: 'scene-1',
    })
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
    let subscribedHandler: ((payload: { action: Action }) => void) | undefined
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
    const mockHandler: IActionHandler = {
      canHandle: vi.fn(() => false),
      handle: vi.fn(),
    }
    const executor = new ActionExecutor(
      logger,
      messageBus,
      mockHandler,
      mockHandler,
      mockHandler,
      mockHandler,
      mockHandler
    )

    // Act
    executor.start()

    if (!subscribedHandler) throw new Error('Expected a subscribed handler')

    subscribedHandler({
      action: { type: 'switch-scene', targetSceneId: 'scene-1' },
    })

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/core/ActionExecutor',
      'No handler found for action type: {0}',
      'switch-scene'
    )
  })
})
