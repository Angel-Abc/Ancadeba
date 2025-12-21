import { Token, token } from '../ioc/token'
import { ILogger, loggerToken } from '../logger/types'

export type EventPayload = unknown

export interface IMessageBus {
  publish<Event extends string>(event: Event, payload?: EventPayload): void
  subscribe<Event extends string>(
    event: Event,
    callback: (payload: EventPayload) => void
  ): () => void
}

const logName = 'utils/messages/Bus'
export const messageBusToken = token<IMessageBus>(logName)
export const messageBusDependencies: Token<unknown>[] = [loggerToken]
export class MessageBus implements IMessageBus {
  private readonly subscribers: Map<
    string,
    Set<(payload: EventPayload) => void>
  > = new Map()

  constructor(private readonly logger: ILogger) {}

  publish<Event extends string>(event: Event, payload?: EventPayload): void {
    const eventSubscribers = this.subscribers.get(event)
    if (eventSubscribers) {
      for (const callback of eventSubscribers) {
        callback(payload)
      }
    }
  }

  subscribe<Event extends string>(
    event: Event,
    callback: (payload: EventPayload) => void
  ): () => void {
    let eventSubscribers = this.subscribers.get(event)
    if (!eventSubscribers) {
      eventSubscribers = new Set()
      this.subscribers.set(event, eventSubscribers)
    }
    eventSubscribers.add(callback)
    return () => {
      eventSubscribers?.delete(callback)
    }
  }
}
