import { describe, it, expect, vi } from 'vitest'
import { ActionManager } from '@managers/actionManager'
import type { IActionHandlersLoader } from '@loader/actionHandlersLoader'
import type { IMessageBus } from '@utils/messageBus'
import type { IGameDataProvider, GameData, GameContext } from '@providers/gameDataProvider'
import type { IActionExecuter } from '@actions/actionExecuter'
import type { Message } from '@utils/types'


describe('ActionManager', () => {
  it('loads handlers, registers listeners, executes actions and cleans up', async () => {
    const handlers = [
      { message: 'first', action: { type: 'A1' } },
      { message: 'second', action: { type: 'A2' } }
    ]

    const loadActions = vi.fn().mockResolvedValue(handlers)
    const actionHandlersLoader: IActionHandlersLoader = { loadActions }

    const listeners: Record<string, (m: Message) => void> = {}
    const cleanupSpies: (() => void)[] = []
    const registerMessageListener = vi.fn((message: string, handler: (m: Message) => void) => {
      listeners[message] = handler
      const cleanup = vi.fn(() => { delete listeners[message] })
      cleanupSpies.push(cleanup)
      return cleanup
    })
    const messageBus: IMessageBus = {
      postMessage: (msg: Message) => {
        listeners[msg.message]?.(msg)
      },
      registerMessageListener,
      registerNotificationMessage: vi.fn(),
      unregisterNotificationMessage: vi.fn(),
      disableEmptyQueueAfterPost: vi.fn(),
      enableEmptyQueueAfterPost: vi.fn(),
      shutDown: vi.fn()
    }

    const gameDataProvider: IGameDataProvider = {
      get Game(): GameData {
        return { game: { actions: ['path1'] } } as unknown as GameData
      },
      get Context(): GameContext {
        return {} as unknown as GameContext
      },
      initialize: vi.fn()
    }

    const execute = vi.fn()
    const actionExecuter: IActionExecuter = { execute }

    const manager = new ActionManager(actionHandlersLoader, messageBus, gameDataProvider, actionExecuter)
    await manager.initialize()

    expect(loadActions).toHaveBeenCalledWith(['path1'])
    expect(registerMessageListener).toHaveBeenCalledTimes(handlers.length)
    handlers.forEach((h, idx) => {
      expect(registerMessageListener).toHaveBeenNthCalledWith(idx + 1, h.message, expect.any(Function))
    })

    const msg: Message = { message: 'first', payload: 123 }
    messageBus.postMessage(msg)
    expect(execute).toHaveBeenCalledWith(handlers[0].action, msg)

    manager.cleanup()
    cleanupSpies.forEach(fn => expect(fn).toHaveBeenCalled())
    expect(Object.keys(listeners)).toHaveLength(0)

    messageBus.postMessage(msg)
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it('does not duplicate listeners on repeated initialize', async () => {
    const handlers = [
      { message: 'first', action: { type: 'A1' } },
      { message: 'second', action: { type: 'A2' } }
    ]

    const loadActions = vi.fn().mockResolvedValue(handlers)
    const actionHandlersLoader: IActionHandlersLoader = { loadActions }

    const listeners: Record<string, (m: Message) => void> = {}
    const cleanupSpies: (() => void)[] = []
    const registerMessageListener = vi.fn((message: string, handler: (m: Message) => void) => {
      listeners[message] = handler
      const cleanup = vi.fn(() => { delete listeners[message] })
      cleanupSpies.push(cleanup)
      return cleanup
    })
    const messageBus: IMessageBus = {
      postMessage: vi.fn(),
      registerMessageListener,
      registerNotificationMessage: vi.fn(),
      unregisterNotificationMessage: vi.fn(),
      disableEmptyQueueAfterPost: vi.fn(),
      enableEmptyQueueAfterPost: vi.fn(),
      shutDown: vi.fn()
    }

    const gameDataProvider: IGameDataProvider = {
      get Game(): GameData {
        return { game: { actions: ['path1'] } } as unknown as GameData
      },
      get Context(): GameContext {
        return {} as unknown as GameContext
      },
      initialize: vi.fn()
    }

    const actionExecuter: IActionExecuter = { execute: vi.fn() }

    const manager = new ActionManager(actionHandlersLoader, messageBus, gameDataProvider, actionExecuter)

    await manager.initialize()
    const firstCleanupSpies = [...cleanupSpies]
    expect(Object.keys(listeners)).toHaveLength(handlers.length)

    await manager.initialize()
    firstCleanupSpies.forEach(fn => expect(fn).toHaveBeenCalled())
    expect(Object.keys(listeners)).toHaveLength(handlers.length)
    expect(registerMessageListener).toHaveBeenCalledTimes(handlers.length * 2)
  })
})

