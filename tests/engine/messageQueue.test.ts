import { describe, it, expect, vi } from 'vitest'
import { MessageQueue } from '@utils/messageQueue'
import type { Message } from '@utils/types'

describe('MessageQueue', () => {
  it('processes messages and calls handler', async () => {
    const onEmpty = vi.fn()
    const queue = new MessageQueue(onEmpty)
    const handled: Message[] = []
    queue.setHandler(m => {
      handled.push(m)
    })

    queue.postMessage({ message: 'a', payload: null })
    queue.postMessage({ message: 'b', payload: 1 })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(handled.map(m => m.message)).toEqual(['a', 'b'])
    expect(onEmpty).toHaveBeenCalledTimes(2)
  })

  it('processes queued messages after handler is set', async () => {
    const onEmpty = vi.fn()
    const queue = new MessageQueue(onEmpty)
    const handled: Message[] = []

    queue.postMessage({ message: 'a', payload: null })
    queue.postMessage({ message: 'b', payload: 1 })

    queue.setHandler(m => {
      handled.push(m)
    })

    await new Promise(resolve => setTimeout(resolve, 0))

    expect(handled.map(m => m.message)).toEqual(['a', 'b'])
    expect(onEmpty).toHaveBeenCalledTimes(1)
  })

  it('queues messages when auto-drain disabled and drains when enabled', async () => {
    const onEmpty = vi.fn()
    const queue = new MessageQueue(onEmpty)
    const handled: string[] = []
    queue.setHandler(m => {
      handled.push(m.message)
    })

    queue.disableEmptyQueueAfterPost()
    queue.postMessage({ message: 'a', payload: null })
    queue.postMessage({ message: 'b', payload: null })
    expect(handled).toEqual([])

    queue.enableEmptyQueueAfterPost()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(handled).toEqual(['a', 'b'])
    expect(onEmpty).toHaveBeenCalledTimes(1)
  })

  it('drains queue manually and waits for async handlers', async () => {
    const onEmpty = vi.fn()
    const queue = new MessageQueue(onEmpty)
    const order: string[] = []
    queue.setHandler(async m => {
      order.push(m.message)
      await new Promise(res => setTimeout(res, 1))
    })

    queue.disableEmptyQueueAfterPost()
    queue.postMessage({ message: 'a', payload: null })
    queue.postMessage({ message: 'b', payload: null })
    await queue.emptyQueue()

    expect(order).toEqual(['a', 'b'])
    expect(onEmpty).toHaveBeenCalledTimes(1)
  })

  it('awaits thenable results', async () => {
    const onEmpty = vi.fn()
    const queue = new MessageQueue(onEmpty)
    const order: string[] = []
    queue.setHandler(m => ({
      then: (resolve: () => void) => {
        setTimeout(() => {
          order.push(m.message)
          resolve()
        }, 1)
      },
    }) as unknown as Promise<void>)

    queue.disableEmptyQueueAfterPost()
    queue.postMessage({ message: 'a', payload: null })
    queue.postMessage({ message: 'b', payload: null })

    await queue.emptyQueue()

    expect(order).toEqual(['a', 'b'])
    expect(onEmpty).toHaveBeenCalledTimes(1)
  })

  it('reprocesses messages posted during draining before calling onQueueEmpty', async () => {
    const onEmpty = vi.fn()
    const queue = new MessageQueue(onEmpty)
    const handled: string[] = []
    queue.setHandler(m => {
      handled.push(m.message)
      if (m.message === 'a') {
        queue.postMessage({ message: 'b', payload: null })
      }
    })

    queue.postMessage({ message: 'a', payload: null })
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(handled).toEqual(['a', 'b'])
    expect(onEmpty).toHaveBeenCalledTimes(1)
  })
})

