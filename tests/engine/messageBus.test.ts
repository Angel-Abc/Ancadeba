import { describe, it, expect, vi } from 'vitest'
import { MessageBus } from '@utils/messageBus'
import { MessageQueue } from '@utils/messageQueue'
import type { Message } from '@utils/types'
import type { ILogger } from '@utils/logger'

describe('MessageBus', () => {
  it('delivers posted messages to registered listeners', async () => {
    const queueLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const busLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const queue = new MessageQueue(() => {}, queueLogger)
    const bus = new MessageBus(queue, busLogger)
    const handler = vi.fn()
    bus.registerMessageListener('test', handler)

    const msg: Message = { message: 'test', payload: 123 }
    bus.postMessage(msg)
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(handler).toHaveBeenCalledWith(msg)
  })

  it('unregistering listener prevents it from receiving messages', async () => {
    const queueLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const busLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const queue = new MessageQueue(() => {}, queueLogger)
    const bus = new MessageBus(queue, busLogger)
    const handler = vi.fn()
    const cleanup = bus.registerMessageListener('remove', handler)
    cleanup()

    bus.postMessage({ message: 'remove', payload: null })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(handler).not.toHaveBeenCalled()
  })

  it('queues messages when auto-drain is disabled and processes them when enabled', async () => {
    const queueLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const busLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const queue = new MessageQueue(() => {}, queueLogger)
    const bus = new MessageBus(queue, busLogger)
    const handled: Message[] = []
    bus.registerMessageListener('queued', m => {
      handled.push(m)
    })

    bus.disableEmptyQueueAfterPost()
    bus.postMessage({ message: 'queued', payload: 1 })
    bus.postMessage({ message: 'queued', payload: 2 })
    expect(handled.length).toBe(0)

    bus.enableEmptyQueueAfterPost()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(handled.map(m => m.payload)).toEqual([1, 2])
  })

  it('removes map entry once all listeners are unregistered', () => {
    const queueLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const busLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const queue = new MessageQueue(() => {}, queueLogger)
    const bus = new MessageBus(queue, busLogger)
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    const cleanup1 = bus.registerMessageListener('event', handler1)
    const cleanup2 = bus.registerMessageListener('event', handler2)

    const listeners = (bus as unknown as { listeners: Map<string, unknown[]> }).listeners
    expect(listeners.has('event')).toBe(true)

    cleanup1()
    expect(listeners.has('event')).toBe(true)

    cleanup2()
    expect(listeners.has('event')).toBe(false)
  })

  it('handles messages with diverse payload types', async () => {
    const queueLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const busLogger: ILogger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    const queue = new MessageQueue(() => {}, queueLogger)
    const bus = new MessageBus(queue, busLogger)
    const boolHandler = vi.fn()
    const arrayHandler = vi.fn()
    bus.registerMessageListener('bool', boolHandler)
    bus.registerMessageListener('arr', arrayHandler)

    bus.postMessage({ message: 'bool', payload: true })
    bus.postMessage({ message: 'arr', payload: [1, 2, 3] })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(boolHandler).toHaveBeenCalledWith({ message: 'bool', payload: true })
    expect(arrayHandler).toHaveBeenCalledWith({ message: 'arr', payload: [1, 2, 3] })
  })
})

