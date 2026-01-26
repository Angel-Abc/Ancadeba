import { token } from '../ioc/token'
import { MessageBus } from './bus'

export const messageBusToken = token<IMessageBus>(MessageBus.logName)

export type EventPayload = unknown

export interface IMessageBus {
  publish<Event extends string>(event: Event, payload?: EventPayload): void
  subscribe<Event extends string>(
    event: Event,
    callback: (payload: EventPayload) => void,
  ): () => void
}
