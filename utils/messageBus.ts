/**
 * Message bus module providing publish/subscribe style communication.
 *
 * Messages are enqueued in the {@link MessageQueue} and delivered to registered
 * listeners in FIFO order.  The bus exposes a simple API to post messages,
 * subscribe to them and control queue processing.
 */
import { logDebug, logWarning } from './logMessage'
import type { CleanUp, Message } from './types'
import { IMessageQueue, messageQueueToken } from './messageQueue'
import { Token, token } from '@ioc/token'

type MessageListener = {
    key: number
    message: string
    handler: (message: Message<unknown>) => void | Promise<void>
}

/**
 * Interface describing the capabilities of the message bus. The bus accepts
 * messages, notifies registered listeners and provides control over queue
 * processing.
 */
export interface IMessageBus {
    /**
     * Enqueue a message for delivery to listeners.
     * @param message - Message to dispatch.
     */
    postMessage(message: Message<unknown>): void
    /**
     * Subscribe to messages of a given type.
     * @param message - Message identifier.
     * @param handler - Callback invoked for each received message.
     * @returns Cleanup function removing the listener when invoked.
     */
    registerMessageListener(message: string, handler: (message: Message<unknown>) => void | Promise<void>): CleanUp
    /**
     * Register a message that should not trigger a warning when no listener is attached.
     * @param message - Message identifier.
     */
    registerNotificationMessage(message: string): void
    /**
     * Remove a previously registered notification message so warnings are emitted again.
     * @param message - Message identifier.
     */
    unregisterNotificationMessage(message: string): void
    /**
     * Temporarily prevent automatic queue draining after posting messages.
     */
    disableEmptyQueueAfterPost(): void
    /**
     * Re-enable automatic queue draining after posting messages.
     */
    enableEmptyQueueAfterPost(): void
    /**
     * Shut down the bus and clear all listeners and queued messages.
     */
    shutDown(): void
}

const logName: string = 'MessageBus'
export const messageBusToken = token<IMessageBus>(logName)
export const messageBusDependencies: Token<unknown>[] = [messageQueueToken]
/**
 * Default implementation of {@link IMessageBus} coordinating message dispatch
 * through an injected {@link IMessageQueue}.
 */
export class MessageBus implements IMessageBus {
    private key: number = 0
    private listeners: Map<string, MessageListener[]> = new Map<string, MessageListener[]>()
    private silentMessages: Set<string> = new Set<string>()
    private messageQueue: IMessageQueue

    /**
     * Create a new message bus.
     * @param messageQueue - Queue used to schedule message processing.
     */
    constructor(messageQueue: IMessageQueue) {
        this.messageQueue = messageQueue
        this.messageQueue.setHandler((message: Message<unknown>) => this.handleMessage(message))
    }

    /**
     * Post a message to the bus.
     * @param message - Message to enqueue.
     */
    postMessage(message: Message<unknown>): void {
        logDebug(logName, 'Push message: {0}', message)
        this.messageQueue.postMessage(message)
    }

    /**
     * Prevent the underlying queue from being drained after messages are posted.
     */
    public disableEmptyQueueAfterPost(): void {
        this.messageQueue.disableEmptyQueueAfterPost()
    }

    /**
     * Resume automatic draining of the underlying queue after posts.
     */
    public enableEmptyQueueAfterPost(): void {
        this.messageQueue.enableEmptyQueueAfterPost()
    }

    /**
     * Register a message identifier that should not log warnings when no listener exists.
     * @param message - Message identifier.
     */
    public registerNotificationMessage(message: string): void {
        this.silentMessages.add(message)
    }

    /**
     * Remove a previously silent message identifier, re-enabling warnings.
     * @param message - Message identifier.
     */
    public unregisterNotificationMessage(message: string): void {
        this.silentMessages.delete(message)
    }

    /**
     * Register a listener for a specific message.
     * @param message - Message identifier to listen for.
     * @param handler - Function invoked with the delivered message.
     * @returns Cleanup function to unregister the listener.
     */
    public registerMessageListener(message: string, handler: (message: Message<unknown>) => void | Promise<void>): CleanUp {
        if (!this.listeners.has(message)) {
            this.listeners.set(message, [])
        }
        const listener: MessageListener = {
            key: this.key++,
            message: message,
            handler: handler
        }
        this.listeners.get(message)!.push(listener)

        // return the unregister function
        return () => {
            const arr = this.listeners.get(message)
            if (arr) {
                const filtered = arr.filter(l => l.key !== listener.key)
                if (filtered.length === 0) this.listeners.delete(message)
                else this.listeners.set(message, filtered)
            }
        }
    }

    private async handleMessage(message: Message<unknown>): Promise<void> {
        const listeners = this.listeners.get(message.message)
        if (!listeners || listeners.length === 0) {
            const logger = this.silentMessages.has(message.message)
                ? (msg: string, ...args: unknown[]) => logDebug(logName, msg, ...args)
                : (msg: string, ...args: unknown[]) => logWarning(logName, msg, ...args)
            logger('No message listener for message: {0}', message)
            return
        }
        const promises: Promise<void>[] = []
        listeners.forEach(listener => {
            try {
                const result = listener.handler(message)
                if (result && typeof (result as Promise<void>).then === 'function') {
                    promises.push((result as Promise<void>).catch(err => {
                        logWarning(logName, 'Error processing listener for message {0}: {1}', message.message, err)
                    }))
                }
            } catch (err) {
                logWarning(logName, 'Error processing listener for message {0}: {1}', message.message, err)
            }
        })
        if (promises.length > 0) {
            await Promise.all(promises)
        }
    }

    /**
     * Clear all listeners and shut down the underlying queue.
     */
    public shutDown(): void {
        this.listeners.clear()
        this.silentMessages.clear()
        this.messageQueue.shutDown()
        logDebug(logName, 'MessageBus shut down')
    }
}
