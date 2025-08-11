import { describe, it, expect, vi } from 'vitest'
import { ContainerBuilder } from '@builders/containerBuilder'
import { gameEngineToken } from '@engine/gameEngine'
import { messageBusToken } from '@utils/messageBus'
import { messageQueueToken } from '@utils/messageQueue'
import { GameEngine } from '@engine/gameEngine'
import { MessageBus } from '@utils/messageBus'
import { MessageQueue } from '@utils/messageQueue'
import { TurnScheduler, turnSchedulerToken } from '@engine/turnScheduler'

describe('ContainerBuilder', () => {
  it('registers default dependencies', () => {
    const builder = new ContainerBuilder()
    const container = builder.build()
    const engine = container.resolve(gameEngineToken)
    const bus = container.resolve(messageBusToken)
    const queue = container.resolve(messageQueueToken)
    const scheduler = container.resolve(turnSchedulerToken)
    expect(engine).toBeInstanceOf(GameEngine)
    expect(bus).toBeInstanceOf(MessageBus)
    expect(queue).toBeInstanceOf(MessageQueue)
    expect(scheduler).toBeInstanceOf(TurnScheduler)
  })

  it('uses supplied callback when queue empties', async () => {
    const callback = vi.fn()
    const builder = new ContainerBuilder(() => callback)
    const container = builder.build()
    const queue = container.resolve(messageQueueToken)
    queue.setHandler(() => {})
    queue.postMessage({ message: 'test', payload: null })
    await queue.emptyQueue()
    expect(callback).toHaveBeenCalledTimes(1)
  })
})
