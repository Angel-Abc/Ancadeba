import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { MessageBus } from '@utils/messageBus'
import type { IMessageQueue } from '@utils/messageQueue'
import type { Message } from '@utils/types'
import type { ILogger } from '@utils/logger'

class TestQueue implements IMessageQueue {
    private handler: ((message: Message) => void | Promise<void>) | null = null
    postMessage(message: Message): void {
        this.handler?.(message)
    }
    setHandler(handler: (message: Message) => void | Promise<void>): void {
        this.handler = handler
    }
    disableEmptyQueueAfterPost(): void {}
    enableEmptyQueueAfterPost(): void {}
    emptyQueue(): Promise<void> { return Promise.resolve() }
    shutDown(): void {}
}

describe('MessageBus notification messages', () => {
    let bus: MessageBus
    let logger: ILogger
    beforeEach(() => {
        const queue = new TestQueue()
        logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
        bus = new MessageBus(queue, logger)
        vi.restoreAllMocks()
    })

    it('unregisterNotificationMessage re-enables warnings', () => {
        bus.registerNotificationMessage('silent')
        bus.postMessage({ message: 'silent' })
        expect(logger.debug).toHaveBeenCalledWith('MessageBus', 'No message listener for message: {0}', 'silent')
        expect(logger.warn).not.toHaveBeenCalled()

        ;(logger.debug as Mock).mockClear()
        ;(logger.warn as Mock).mockClear()

        bus.unregisterNotificationMessage('silent')
        bus.postMessage({ message: 'silent' })
        expect(logger.warn).toHaveBeenCalledWith('MessageBus', 'No message listener for message: {0}', 'silent')
    })
})
