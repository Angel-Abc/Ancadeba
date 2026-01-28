import { describe, it, expect, vi } from 'vitest'
import { MessageBus } from '../../messages/bus'
import type { ILogger } from '../../logger/types'
import type { EventPayload } from '../../messages/types'

describe('MessageBus', () => {
  const createLogger = (): ILogger => ({
    debug: vi.fn(() => ''),
    info: vi.fn(() => ''),
    warn: vi.fn(() => ''),
    error: vi.fn(() => ''),
  })

  it('publishes payloads to subscribers', () => {
    // Arrange
    const logger = createLogger()
    const bus = new MessageBus(logger)
    const payload = { id: 'payload' }
    const callback = vi.fn()
    bus.subscribe('test:event', callback)

    // Act
    bus.publish('test:event', payload)

    // Assert
    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith(payload)
  })

  it('unsubscribes and removes empty subscriber sets', () => {
    // Arrange
    const logger = createLogger()
    const bus = new MessageBus(logger)
    const callback = vi.fn()
    const unsubscribe = bus.subscribe('test:event', callback)

    // Act
    unsubscribe()
    bus.publish('test:event', { id: 'payload' })

    // Assert
    expect(callback).not.toHaveBeenCalled()
    const subscribers = (bus as unknown as {
      subscribers: Map<string, Set<(payload: EventPayload) => void>>
    }).subscribers
    expect(subscribers.has('test:event')).toBe(false)
  })

  it('does not throw when publishing with no subscribers', () => {
    // Arrange
    const logger = createLogger()
    const bus = new MessageBus(logger)

    // Act
    const publish = (): void => bus.publish('test:event')

    // Assert
    expect(publish).not.toThrow()
  })

  it('continues publishing when a subscriber throws', () => {
    // Arrange
    const logger = createLogger()
    const bus = new MessageBus(logger)
    const erroring = vi.fn((): void => {
      throw new Error('subscriber failed')
    })
    const callback = vi.fn()
    bus.subscribe('test:event', erroring)
    bus.subscribe('test:event', callback)

    // Act
    bus.publish('test:event', { ok: true })

    // Assert
    expect(callback).toHaveBeenCalledTimes(1)
    expect(logger.error).toHaveBeenCalledTimes(1)
  })
})
