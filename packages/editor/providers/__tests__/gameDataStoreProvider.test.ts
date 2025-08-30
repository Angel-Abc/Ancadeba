import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameDataStoreProvider } from '../gameDataStoreProvider'
import { GAME_DATA_STORE_CHANGED } from '@editor/messages/editor'
import type { ILogger } from '@utils/logger'
import type { IMessageBus } from '@utils/messageBus'

describe('GameDataStoreProvider', () => {
    let logger: ILogger
    let messageBus: IMessageBus
    let provider: GameDataStoreProvider

    beforeEach(() => {
        logger = {
            debug: vi.fn(),
            info: vi.fn(),
            warn: vi.fn(),
            error: vi.fn((category: string, message: string, ...args: unknown[]) =>
                `[${category}] ${message.replace(/\{(\d+)\}/g, (_: string, i: string) => String(args[Number(i)]))}`),
        }

        messageBus = {
            postMessage: vi.fn(),
            registerMessageListener: vi.fn(() => () => { }) as unknown as IMessageBus['registerMessageListener'],
            registerNotificationMessage: vi.fn(),
            unregisterNotificationMessage: vi.fn(),
            disableEmptyQueueAfterPost: vi.fn(),
            enableEmptyQueueAfterPost: vi.fn(),
            shutDown: vi.fn()
        }

        provider = new GameDataStoreProvider(logger, messageBus)
    })

    it('stores items and posts a message', () => {
        const data = { name: 'test' }
        provider.store(1, data, 'path.json')
        expect(messageBus.postMessage).toHaveBeenCalledWith({ message: GAME_DATA_STORE_CHANGED, payload: 1 })
        expect(provider.retrieve(1)).toEqual(data)
    })

    it('updates existing item and marks as changed', () => {
        provider.store(1, { value: 1 }, 'path.json')
        provider.update(1, { value: 2 })
        expect(messageBus.postMessage).toHaveBeenNthCalledWith(2, { message: GAME_DATA_STORE_CHANGED, payload: 1 })
        expect(provider.retrieve(1)).toEqual({ value: 2 })
        expect(provider.IsChanged).toBe(true)
    })

    it('logs a warning when updating a non existent item', () => {
        provider.update(99, { value: 3 })
        expect(logger.warn).toHaveBeenCalled()
    })

    it('retrieves stored data and throws for missing id', () => {
        provider.store(1, { a: 1 }, 'path')
        expect(provider.retrieve(1)).toEqual({ a: 1 })
        expect(() => provider.retrieve(2)).toThrowError('[GameDataStoreProvider] Game item with id 2 not found in store')
    })

    it('returns changed items', () => {
        provider.store(1, { v: 1 }, 'a.json')
        provider.store(2, { v: 2 }, 'b.json')
        provider.update(1, { v: 10 })
        const changes = provider.getChangedItems()
        expect(changes).toEqual([{ path: 'a.json', data: { v: 10 } }])
    })

    it('marks items as saved', () => {
        provider.store(1, { v: 1 }, 'a.json')
        provider.update(1, { v: 2 })
        provider.markSaved()
        expect(provider.IsChanged).toBe(false)
        expect(provider.getChangedItems()).toEqual([])
    })
})
