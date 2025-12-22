import { describe, expect, it, vi } from 'vitest'
import type { IMessageBus } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../../messages/core'
import { EngineMessageBus } from '../../system/engineMessageBus'

describe('system/engineMessageBus', () => {
  it('forwards publish and publishRaw to the underlying bus', () => {
    // Arrange
    const messageBus: IMessageBus = {
      publish: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
    }
    const bus = new EngineMessageBus(messageBus)

    // Act
    bus.publish(CORE_MESSAGES.GAME_ENGINE_STARTED, undefined)
    bus.publishRaw('RAW/EVENT', { id: 1 })

    // Assert
    expect(messageBus.publish).toHaveBeenCalledWith(
      CORE_MESSAGES.GAME_ENGINE_STARTED,
      undefined
    )
    expect(messageBus.publish).toHaveBeenCalledWith('RAW/EVENT', { id: 1 })
  })

  it('wraps typed subscriptions and delivers payloads to handlers', () => {
    // Arrange
    let subscribedMessage: string | undefined
    let subscribedHandler: ((payload: unknown) => void) | undefined
    const messageBus: IMessageBus = {
      publish: vi.fn(),
      subscribe: vi.fn((message, handler) => {
        subscribedMessage = message
        subscribedHandler = handler
        return () => undefined
      }),
    }
    const bus = new EngineMessageBus(messageBus)
    const handler = vi.fn()

    // Act
    bus.subscribe(CORE_MESSAGES.GAME_ENGINE_STARTED, handler)

    // Assert
    expect(messageBus.subscribe).toHaveBeenCalledTimes(1)
    expect(subscribedMessage).toBe(CORE_MESSAGES.GAME_ENGINE_STARTED)
    expect(subscribedHandler).toBeDefined()
    expect(subscribedHandler).not.toBe(handler)

    if (!subscribedHandler) throw new Error('Expected a subscribed handler')

    // Act
    subscribedHandler(undefined)

    // Assert
    expect(handler).toHaveBeenCalledWith(undefined)
  })

  it('forwards raw subscriptions without wrapping the handler', () => {
    // Arrange
    const messageBus: IMessageBus = {
      publish: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
    }
    const bus = new EngineMessageBus(messageBus)
    const handler = vi.fn()

    // Act
    bus.subscribeRaw('RAW/EVENT', handler)

    // Assert
    expect(messageBus.subscribe).toHaveBeenCalledWith('RAW/EVENT', handler)
  })

  it('returns the unsubscribe function from the underlying bus', () => {
    // Arrange
    const unsubscribe = vi.fn()
    const messageBus: IMessageBus = {
      publish: vi.fn(),
      subscribe: vi.fn(() => unsubscribe),
    }
    const bus = new EngineMessageBus(messageBus)

    // Act
    const result = bus.subscribe(CORE_MESSAGES.GAME_ENGINE_STARTED, vi.fn())

    // Assert
    expect(result).toBe(unsubscribe)
  })
})
