import type {
  IMessageBus,
  MessageDeliveryPredicate,
  MessageHandler,
  MessageTopic,
  Unsubscribe,
} from '@ancadeba/utilities'
import type { EngineMessages } from './messages.js'

/** Associates queued payloads with their originating playthrough without changing public events. */
export class GameMessageScopes {
  private readonly owners = new WeakMap<object, GameMessageScope>()

  create(
    messages: IMessageBus<EngineMessages>,
    isCurrent: () => boolean,
    acceptsInput: () => boolean,
  ): GameMessageScope {
    return new GameMessageScope(messages, this.owners, isCurrent, acceptsInput)
  }

  shouldDeliver<Topic extends MessageTopic<EngineMessages>>(
    topic: Topic,
    payload: EngineMessages[Topic],
  ): boolean {
    if (typeof payload !== 'object' || payload === null) return true

    return this.owners.get(payload)?.shouldDeliver(topic, payload) ?? true
  }
}

export class GameMessageScope implements IMessageBus<EngineMessages> {
  private disposed = false
  private paused = false
  private readonly deferred: (() => void)[] = []

  setPaused(paused: boolean): void {
    this.paused = paused

    if (!paused) for (const deliver of this.deferred.splice(0)) deliver()
  }

  shouldDeliver<Topic extends MessageTopic<EngineMessages>>(
    topic: Topic,
    payload: EngineMessages[Topic],
  ): boolean {
    if (!this.active) return false

    if (!this.paused) return true
    this.deferred.push(() => this.messages.publish(topic, payload))

    return false
  }

  constructor(
    private readonly messages: IMessageBus<EngineMessages>,
    private readonly owners: WeakMap<object, GameMessageScope>,
    private readonly isCurrent: () => boolean,
    private readonly acceptsInput: () => boolean,
  ) {}

  get active(): boolean {
    return !this.disposed && this.isCurrent()
  }

  publish<Topic extends MessageTopic<EngineMessages>>(
    topic: Topic,
    payload: EngineMessages[Topic],
  ): void {
    if (this.disposed) return

    if (typeof payload !== 'object' || payload === null)
      throw new TypeError('Game messages require object payloads')
    const owner = this.owners.get(payload)

    if (owner && owner !== this) throw new Error('A message already belongs to another game')
    this.owners.set(payload, this)
    this.messages.publish(topic, payload)
  }

  subscribe<Topic extends MessageTopic<EngineMessages>>(
    topic: Topic,
    handler: MessageHandler<EngineMessages[Topic]>,
  ): Unsubscribe {
    return this.messages.subscribe(topic, (payload) => {
      if (
        this.active &&
        (topic !== 'input.virtual' || this.acceptsInput()) &&
        typeof payload === 'object' &&
        payload !== null &&
        this.owners.get(payload) === this
      )
        handler(payload)
    })
  }

  flush(predicate?: MessageDeliveryPredicate<EngineMessages>): void {
    this.messages.flush(predicate)
  }

  dispose(): void {
    this.disposed = true
    this.deferred.length = 0
  }
}
