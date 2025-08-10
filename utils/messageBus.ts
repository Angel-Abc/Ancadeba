import { logDebug, logWarning } from './logMessage'
import type { CleanUp, Message } from './types'
import { IMessageQueue, messageQueueToken } from './messageQueue'
import { Token, token } from '@ioc/token'

type MessageListener = {
    key: number
    message: string
    handler: (message: Message) => void | Promise<void>
}

export interface IMessageBus {
    postMessage(message: Message): void
    registerMessageListener(message: string, handler: (message: Message) => void | Promise<void>): CleanUp
    registerNotificationMessage(message: string): void
    shutDown(): void
}

export const messageBusToken = token<IMessageBus>('MessageBus')
export const messageBusDependencies: Token<unknown>[] = [messageQueueToken]
export class MessageBus implements IMessageBus {
    private key: number = 0
    private listeners: Map<string, MessageListener[]> = new Map<string, MessageListener[]>()
    private silentMessages: Set<string> = new Set<string>()
    private messageQueue: IMessageQueue

    constructor(messageQueue: IMessageQueue) {
        this.messageQueue = messageQueue
        this.messageQueue.setHandler((message: Message) => this.handleMessage(message))
    }

    postMessage(message: Message): void {
        logDebug('MessageBus', 'Push message: {0}', message)
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

    public registerMessageListener(message: string, handler: (message: Message) => void | Promise<void>): CleanUp {
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
            if (this.listeners.has(message)) {
                this.listeners.set(message, this.listeners.get(message)!.filter(l => l.key !== listener.key))
            }
        }
    }

    private handleMessage(message: Message): void | Promise<void> {
        const listeners = this.listeners.get(message.message)
        if (!listeners || listeners.length === 0) {
            const logger = this.silentMessages.has(message.message)
                ? (msg: string, ...args: unknown[]) => logDebug('MessageBus', msg, ...args)
                : (msg: string, ...args: unknown[]) => logWarning('MessageBus', msg, ...args)
            logger('No message listener for message: {0}', message)
            return
        }
        const promises: Promise<void>[] = []
        listeners.forEach(listener => {
            try {
                const result = listener.handler(message)
                if (result && typeof (result as Promise<void>).then === 'function') {
                    promises.push((result as Promise<void>).catch(err => {
                        logWarning('MessageBus', 'Error processing listener for message {0}: {1}', message.message, err)
                    }))
                }
            } catch (err) {
                logWarning('MessageBus', 'Error processing listener for message {0}: {1}', message.message, err)
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
        logDebug('MessageBus', 'MessageBus shut down')
    }
}
