import { logDebug, logWarning } from './logMessage'
import type { CleanUp, Message } from './types'
import { IMessageQueue, messageQueueToken } from './messageQueue'
import { Token, token } from '@ioc/token'

type MessageListener = {
    key: number
    message: string
    handler: (message: Message<unknown>) => void | Promise<void>
}

export interface IMessageBus {
    postMessage(message: Message<unknown>): void
    registerMessageListener(message: string, handler: (message: Message<unknown>) => void | Promise<void>): CleanUp
    registerNotificationMessage(message: string): void
    disableEmptyQueueAfterPost(): void
    enableEmptyQueueAfterPost(): void
    shutDown(): void
}

const logName: string = 'MessageBus'
export const messageBusToken = token<IMessageBus>(logName)
export const messageBusDependencies: Token<unknown>[] = [messageQueueToken]
export class MessageBus implements IMessageBus {
    private key: number = 0
    private listeners: Map<string, MessageListener[]> = new Map<string, MessageListener[]>()
    private silentMessages: Set<string> = new Set<string>()
    private messageQueue: IMessageQueue

    constructor(messageQueue: IMessageQueue) {
        this.messageQueue = messageQueue
        this.messageQueue.setHandler((message: Message<unknown>) => this.handleMessage(message))
    }

    postMessage(message: Message<unknown>): void {
        logDebug(logName, 'Push message: {0}', message)
        this.messageQueue.postMessage(message)
    }

    public disableEmptyQueueAfterPost(): void {
        this.messageQueue.disableEmptyQueueAfterPost()
    }

    public enableEmptyQueueAfterPost(): void {
        this.messageQueue.enableEmptyQueueAfterPost()
    }

    public registerNotificationMessage(message: string): void {
        this.silentMessages.add(message)
    }

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

    private handleMessage(message: Message<unknown>): void | Promise<void> {
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
            return Promise.all(promises).then(() => {})
        }
    }

    public shutDown(): void {
        this.listeners.clear()
        this.silentMessages.clear()
        this.messageQueue.shutDown()
        logDebug(logName, 'MessageBus shut down')
    }
}
