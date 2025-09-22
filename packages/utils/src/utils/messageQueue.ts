/**
 * Message queue managing asynchronous delivery of messages.
 *
 * The queue buffers messages until a handler is set by the {@link MessageBus}.
 * Messages are processed sequentially and the queue can be paused or resumed
 * after posts.
 */
import type { Message } from './types'
import { loggerToken, type ILogger } from './logger'
import { Token, token } from '../ioc'

type OnQueueEmptyType = (() => void) | null

/**
 * Contract for message queues used by the {@link MessageBus}.
 */
export interface IMessageQueue {
    /**
     * Enqueue a message for later processing.
     * @param message - Message to be queued.
     */
    postMessage(message: Message): void
    /**
     * Register the handler that processes queued messages.
     * @param handler - Function invoked for each message.
     */
    setHandler(handler: (message: Message) => void | Promise<void>): void
    /**
     * Increment a lock preventing automatic queue draining.
     */
    disableEmptyQueueAfterPost(): void
    /**
     * Decrement the lock and attempt to drain the queue.
     */
    enableEmptyQueueAfterPost(): void
    /**
     * Drain all queued messages.
     */
    emptyQueue(): Promise<void>
    /**
     * Reset the queue to its initial state.
     */
    shutDown(): void
    setOnQueueEmpty(onQueueEmpty: OnQueueEmptyType): void
}

const logName = 'MessageQueue'
export const messageQueueToken = token<IMessageQueue>(logName)
export const messageQueueDependencies: Token<unknown>[] = [
    loggerToken
]
/**
 * Default implementation of {@link IMessageQueue} maintaining an in-memory
 * FIFO queue of messages.
 */
export class MessageQueue implements IMessageQueue {
    private queue: Message[] = []
    private emptyingQueue = false
    private emptyQueueAfterPost = 0
    private handler: ((message: Message) => void | Promise<void>) | null = null
    private onQueueEmpty: OnQueueEmptyType = null

    /**
     * Create a new message queue.
     */
    constructor(private logger: ILogger) {
    }

    /**
     * Set the handler responsible for processing messages. This immediately
     * triggers {@link emptyQueue} after assignment so any queued messages are
     * processed right away.
     * @param handler - Function invoked for each message.
     */
    public setHandler(handler: (message: Message) => void | Promise<void>): void {
        this.handler = handler
        void this.emptyQueue()
    }

    /**
     * Add a message to the queue and trigger draining when allowed.
     * @param message - Message to enqueue.
     */
    public postMessage(message: Message): void {
        this.queue.push(message)
        if (this.emptyQueueAfterPost === 0) {
            void this.emptyQueue()
        }
    }

    /**
     * Increase the counter preventing automatic draining.
     */
    public disableEmptyQueueAfterPost(): void {
        this.emptyQueueAfterPost = this.emptyQueueAfterPost + 1
    }

    /**
     * Decrease the counter and attempt to drain the queue.
     */
    public enableEmptyQueueAfterPost(): void {
        if (this.emptyQueueAfterPost === 0) {
            this.logger.warn(logName, 'enableEmptyQueueAfterPost called but counter is already zero')
            void this.emptyQueue()
            return
        }
        this.emptyQueueAfterPost = this.emptyQueueAfterPost - 1
        if (this.emptyQueueAfterPost === 0) {
            void this.emptyQueue()
        }
    }

    /**
     * Drain all queued messages sequentially using the registered handler.
     */
    public async emptyQueue(): Promise<void> {
        if (this.emptyingQueue || this.queue.length === 0 || !this.handler) return
        this.emptyingQueue = true
        try {
            while (this.queue.length > 0) {
                const message = this.queue.shift()
                if (!message) continue
                const result = this.handler(message)
                if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
                    try {
                        await result
                    } catch (err) {
                        this.logger.warn(logName, 'Error processing message {0}: {1}', message.message, err)
                    }
                }
            }
        } finally {
            this.emptyingQueue = false
        }
        if (this.queue.length > 0) {
            return this.emptyQueue()
        }
        if (this.onQueueEmpty) {
            try {
                this.onQueueEmpty()
            } catch (err) {
                this.logger.warn(logName, 'Error handling empty queue: {0}', err)
            }
        }
    }

    /**
     * Clear queued messages and reset internal state.
     */
    public shutDown(): void {
        this.queue = []
        this.emptyingQueue = false
        this.emptyQueueAfterPost = 0
        this.handler = null
        this.onQueueEmpty = null
    }

    public setOnQueueEmpty(onQueueEmpty: OnQueueEmptyType): void {
        this.onQueueEmpty = onQueueEmpty
    }
}

