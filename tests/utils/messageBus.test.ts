import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MessageBus } from '../../utils/messageBus'
import type { IMessageQueue } from '../../utils/messageQueue'
import type { Message } from '../../utils/types'
import * as log from '../../utils/logMessage'

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
    beforeEach(() => {
        const queue = new TestQueue()
        bus = new MessageBus(queue)
        vi.restoreAllMocks()
    })

    it('unregisterNotificationMessage re-enables warnings', () => {
        const debugSpy = vi.spyOn(log, 'logDebug')
        const warningSpy = vi.spyOn(log, 'logWarning')

        bus.registerNotificationMessage('silent')
        bus.postMessage({ message: 'silent' })

        expect(debugSpy).toHaveBeenCalledWith('MessageBus', 'No message listener for message: {0}', 'silent')
        expect(warningSpy).not.toHaveBeenCalled()

        debugSpy.mockClear()
        warningSpy.mockClear()

        bus.unregisterNotificationMessage('silent')
        bus.postMessage({ message: 'silent' })

        expect(warningSpy).toHaveBeenCalledWith('MessageBus', 'No message listener for message: {0}', 'silent')
    })
})
