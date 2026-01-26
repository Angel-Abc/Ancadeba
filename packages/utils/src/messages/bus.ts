import { type Token } from '../ioc/token'
import { type ILogger, loggerToken } from '../logger/types'
import type { EventPayload, IMessageBus } from './types'

export const messageBusDependencies: Token<unknown>[] = [loggerToken]
export class MessageBus implements IMessageBus {
  public static readonly logName: string = 'utils/messages/Bus'

  private readonly subscribers: Map<
    string,
    Set<(payload: EventPayload) => void>
  > = new Map()

  constructor(private readonly logger: ILogger) {}

  publish<Event extends string>(event: Event, payload?: EventPayload): void {
    const eventSubscribers = this.subscribers.get(event)
    this.logger.debug(
      MessageBus.logName,
      'Publishing event: {0} to {1} subscribers: {2}',
      event,
      eventSubscribers?.size ?? 0,
      payload,
    )
    if (eventSubscribers) {
      const callbacks = Array.from(eventSubscribers)
      for (const callback of callbacks) {
        try {
          callback(payload)
        } catch (error) {
          this.logger.error(
            MessageBus.logName,
            'Error in subscriber for event {0}: {1}',
            event,
            error,
          )
        }
      }
    }
  }

  subscribe<Event extends string>(
    event: Event,
    callback: (payload: EventPayload) => void,
  ): () => void {
    let eventSubscribers = this.subscribers.get(event)
    if (!eventSubscribers) {
      eventSubscribers = new Set()
      this.subscribers.set(event, eventSubscribers)
    }
    eventSubscribers.add(callback)
    return () => {
      eventSubscribers?.delete(callback)
      if (
        eventSubscribers?.size === 0 &&
        this.subscribers.get(event) === eventSubscribers
      ) {
        this.subscribers.delete(event)
      }
    }
  }
}
