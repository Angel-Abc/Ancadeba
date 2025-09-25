import { describe, expect, it, vi } from 'vitest'
import type { IMessageBus, CleanUp, Message } from '@angelabc/utils/utils'
import { GameStateProvider } from '../../src/providers/gameStateProvider'
import { MESSAGE_ENGINE_LOADING, MESSAGE_ENGINE_START } from '../../src/core/messages'

interface TestBusContext {
    messageBus: IMessageBus
    registerCalls: string[]
    cleanUps: ReturnType<typeof vi.fn>[]
}

const createMessageBus = (): TestBusContext => {
    const registerCalls: string[] = []
    const cleanUps: ReturnType<typeof vi.fn>[] = []

    const messageBus: IMessageBus = {
        postMessage: () => {},
        registerMessageListener: (_message: string, _handler: (message: Message<unknown>) => void | Promise<void>): CleanUp => {
            registerCalls.push(_message)
            const cleanUp = vi.fn()
            cleanUps.push(cleanUp)
            return cleanUp
        },
        registerNotificationMessage: () => {},
        unregisterNotificationMessage: () => {},
        disableEmptyQueueAfterPost: () => {},
        enableEmptyQueueAfterPost: () => {},
        shutDown: () => {}
    }

    return { messageBus, registerCalls, cleanUps }
}

describe('GameStateProvider', () => {
    it('cleans up listeners when reinitialized', () => {
        const { messageBus, registerCalls, cleanUps } = createMessageBus()
        const provider = new GameStateProvider(messageBus)

        provider.initialize()

        expect(registerCalls).toEqual([
            MESSAGE_ENGINE_LOADING,
            MESSAGE_ENGINE_START
        ])
        expect(cleanUps).toHaveLength(2)
        expect(cleanUps[0]).not.toHaveBeenCalled()
        expect(cleanUps[1]).not.toHaveBeenCalled()

        provider.initialize()

        expect(cleanUps[0]).toHaveBeenCalledTimes(1)
        expect(cleanUps[1]).toHaveBeenCalledTimes(1)
        expect(registerCalls).toEqual([
            MESSAGE_ENGINE_LOADING,
            MESSAGE_ENGINE_START,
            MESSAGE_ENGINE_LOADING,
            MESSAGE_ENGINE_START
        ])
        expect(cleanUps).toHaveLength(4)
        expect(cleanUps[2]).not.toHaveBeenCalled()
        expect(cleanUps[3]).not.toHaveBeenCalled()
    })

    it('cleans up listeners on dispose', () => {
        const { messageBus, cleanUps } = createMessageBus()
        const provider = new GameStateProvider(messageBus)

        provider.initialize()
        provider.dispose()

        expect(cleanUps[0]).toHaveBeenCalledTimes(1)
        expect(cleanUps[1]).toHaveBeenCalledTimes(1)

        provider.dispose()

        expect(cleanUps[0]).toHaveBeenCalledTimes(1)
        expect(cleanUps[1]).toHaveBeenCalledTimes(1)
    })
})

