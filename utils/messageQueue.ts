import { token } from '@ioc/token'
import type { Message } from './types'

export interface IMessageQueue {
    postMessage(message: Message): void
    setHandler(handler: (message: Message) => void | Promise<void>): void
    disableEmptyQueueAfterPost(): void
    enableEmptyQueueAfterPost(): void
    emptyQueue(): Promise<void>
    shutDown(): void
}

export const messageQueueToken = token<IMessageQueue>('MessageQueue')
export class MessageQueue implements IMessageQueue {
    private queue: Message[] = []
    private emptyingQueue = false
    private emptyQueueAfterPost = 0
    private handler: ((message: Message) => void | Promise<void>) | null = null
    private readonly onQueueEmpty: () => void

    constructor(onQueueEmpty: () => void) {
        this.onQueueEmpty = onQueueEmpty
    }

    public setHandler(handler: (message: Message) => void | Promise<void>): void {
        this.handler = handler
    }

    public postMessage(message: Message): void {
        this.queue.push(message)
        if (this.emptyQueueAfterPost === 0) {
            void this.emptyQueue()
        }
    }

    public disableEmptyQueueAfterPost(): void {
        this.emptyQueueAfterPost = this.emptyQueueAfterPost + 1
    }

    public enableEmptyQueueAfterPost(): void {
        this.emptyQueueAfterPost = Math.max(0, this.emptyQueueAfterPost - 1)
        void this.emptyQueue()
    }

    public async emptyQueue(): Promise<void> {
        if (this.emptyingQueue || this.queue.length === 0 || !this.handler) return
        this.emptyingQueue = true
        try {
            while (this.queue.length > 0) {
                const message = this.queue.shift()
                if (!message) continue
                const result = this.handler(message)
                if (result instanceof Promise) {
                    await result
                }
            }
        } finally {
            this.emptyingQueue = false
        }
        this.onQueueEmpty()
    }

    public shutDown(): void {
        this.queue = []
        this.emptyingQueue = false
        this.emptyQueueAfterPost = 0
    }
}

