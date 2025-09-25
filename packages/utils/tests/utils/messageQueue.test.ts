import { describe, expect, it } from 'vitest'

import type { ILogger } from '../../src/utils/logger'
import type { Message } from '../../src/utils/types'
import { MessageQueue } from '../../src/utils/messageQueue'

class TestLogger implements ILogger {
    public warnings: Array<{ category: string, message: string, args: unknown[] }> = []

    public debug(_category: string, message: string, ..._args: unknown[]): string {
        return message
    }

    public info(_category: string, message: string, ..._args: unknown[]): string {
        return message
    }

    public warn(category: string, message: string, ...args: unknown[]): string {
        this.warnings.push({ category, message, args })
        return message
    }

    public error(_category: string, message: string, ..._args: unknown[]): string {
        return message
    }
}

const flushQueue = async (): Promise<void> => {
    await new Promise(resolve => setImmediate(resolve))
}

describe('MessageQueue', () => {
    it('drains queued messages only when all locks are released', async () => {
        const logger = new TestLogger()
        const queue = new MessageQueue(logger)
        const handled: Message[] = []

        queue.setHandler(message => {
            handled.push(message)
        })

        queue.disableEmptyQueueAfterPost()
        queue.disableEmptyQueueAfterPost()
        queue.postMessage({ message: 'locked-message' })
        await flushQueue()

        expect(handled.length).toBe(0)

        queue.enableEmptyQueueAfterPost()
        await flushQueue()
        expect(handled.length).toBe(0)

        queue.enableEmptyQueueAfterPost()
        await flushQueue()
        expect(handled.length).toBe(1)
        expect(handled[0]?.message).toBe('locked-message')
    })

    it('warns when enabling auto-empty while already unlocked', async () => {
        const logger = new TestLogger()
        const queue = new MessageQueue(logger)

        queue.setHandler(() => undefined)

        queue.enableEmptyQueueAfterPost()
        await flushQueue()

        expect(logger.warnings.length).toBe(1)
        expect(logger.warnings[0]?.category).toBe('MessageQueue')
        expect(logger.warnings[0]?.message).toBe('enableEmptyQueueAfterPost called but counter is already zero')
    })

    it('clears handlers when shutting down', () => {
        const logger = new TestLogger()
        const queue = new MessageQueue(logger)

        queue.setHandler(() => undefined)
        queue.setOnQueueEmpty(() => undefined)

        queue.shutDown()

        const internals = queue as unknown as {
            handler: ((message: Message) => void | Promise<void>) | null
            onQueueEmpty: (() => void) | null
            queue: Message[]
        }

        expect(internals.handler).toBeNull()
        expect(internals.onQueueEmpty).toBeNull()
        expect(internals.queue.length).toBe(0)
    })
})


