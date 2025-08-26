import { describe, it, expect, vi } from 'vitest'
import { GameDataStoreProvider } from '../../packages/editor/providers/gameDataStoreProvider'
import { GAME_DATA_STORE_CHANGED } from '../../packages/editor/messages/editor'
import type { ILogger } from '@utils/logger'
import type { IMessageBus } from '@utils/messageBus'

const createDeps = () => {
  const logger: ILogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn((c, m, ...a) => `[${c}] ${m.replace('{0}', String(a[0]))}`)
  }
  const messageBus: IMessageBus = {
    postMessage: vi.fn(),
    registerMessageListener: vi.fn(),
    registerNotificationMessage: vi.fn(),
    unregisterNotificationMessage: vi.fn(),
    disableEmptyQueueAfterPost: vi.fn(),
    enableEmptyQueueAfterPost: vi.fn(),
    shutDown: vi.fn()
  }
  return { logger, messageBus }
}

describe('editor GameDataStoreProvider', () => {
  it('stores, updates and retrieves data while dispatching messages', () => {
    const { logger, messageBus } = createDeps()
    const provider = new GameDataStoreProvider(logger, messageBus)

    provider.store(1, { value: 1 }, 'path1')

    expect(messageBus.postMessage).toHaveBeenCalledWith({
      message: GAME_DATA_STORE_CHANGED,
      payload: 1
    })
    expect(provider.hasData(1)).toBe(true)
    expect(provider.retrieve(1)).toEqual({ value: 1 })

    provider.update(1, { value: 2 })
    expect(messageBus.postMessage).toHaveBeenNthCalledWith(2, {
      message: GAME_DATA_STORE_CHANGED,
      payload: 1
    })
    expect(provider.retrieve(1)).toEqual({ value: 2 })
    expect(provider.IsChanged).toBe(true)
    expect(provider.getChangedItems()).toEqual([
      { path: 'path1', data: { value: 2 } }
    ])

    provider.markSaved()
    expect(provider.IsChanged).toBe(false)
    expect(provider.getChangedItems()).toEqual([])
  })

  it('throws when retrieving unknown id', () => {
    const { logger, messageBus } = createDeps()
    const provider = new GameDataStoreProvider(logger, messageBus)

    expect(() => provider.retrieve(99)).toThrow('[GameDataStoreProvider] Game item with id 99 not found in store')
    expect(logger.error).toHaveBeenCalledWith('GameDataStoreProvider', 'Game item with id {0} not found in store', 99)
  })
})

