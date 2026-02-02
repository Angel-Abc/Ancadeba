export type EventPayload = unknown

export interface IMessageBus {
  publish<Event extends string>(event: Event, payload?: EventPayload): void
  subscribe<Event extends string>(
    event: Event,
    callback: (payload: EventPayload) => void,
  ): () => void
}
