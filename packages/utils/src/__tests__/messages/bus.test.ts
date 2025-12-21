import { describe, expect, it } from 'vitest'
import {
  Container,
  loggerToken,
  messageBusDependencies,
  messageBusToken,
  MessageBus,
} from '../../index'
import { createLogger } from '../testUtils'

describe('messages/bus', () => {
  it('resolves MessageBus with its dependencies', () => {
    const logger = createLogger()
    const container = new Container(logger)

    container.register({ token: loggerToken, useValue: logger })
    container.register({
      token: messageBusToken,
      useClass: MessageBus,
      deps: messageBusDependencies,
    })

    const resolved = container.resolve(messageBusToken)

    expect(resolved).toBeInstanceOf(MessageBus)
  })

  it('publishes payloads to subscribers', () => {
    const logger = createLogger()
    const bus = new MessageBus(logger)

    const received: unknown[] = []
    const unsubscribe = bus.subscribe('test:event', (payload) => {
      received.push(payload)
    })

    bus.publish('test:event', { id: 1 })
    unsubscribe()
    bus.publish('test:event', { id: 2 })

    expect(received).toEqual([{ id: 1 }])
  })

  it('delivers payloads to multiple subscribers', () => {
    const logger = createLogger()
    const bus = new MessageBus(logger)

    const first: unknown[] = []
    const second: unknown[] = []

    bus.subscribe('test:multi', (payload) => {
      first.push(payload)
    })
    bus.subscribe('test:multi', (payload) => {
      second.push(payload)
    })

    bus.publish('test:multi', { id: 1 })

    expect(first).toEqual([{ id: 1 }])
    expect(second).toEqual([{ id: 1 }])
  })

  it('isolates payloads by event name', () => {
    const logger = createLogger()
    const bus = new MessageBus(logger)

    const first: unknown[] = []
    const second: unknown[] = []

    bus.subscribe('test:one', (payload) => {
      first.push(payload)
    })
    bus.subscribe('test:two', (payload) => {
      second.push(payload)
    })

    bus.publish('test:one', { id: 1 })

    expect(first).toEqual([{ id: 1 }])
    expect(second).toEqual([])
  })
})
