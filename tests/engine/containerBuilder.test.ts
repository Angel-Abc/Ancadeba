import { describe, it, expect } from 'vitest'
import { ContainerBuilder } from '@builders/containerBuilder'
import { gameEngineToken } from '@engine/gameEngine'
import { messageBusToken } from '@utils/messageBus'
import { messageQueueToken } from '@utils/messageQueue'
import { GameEngine } from '@engine/gameEngine'
import { MessageBus } from '@utils/messageBus'
import { MessageQueue } from '@utils/messageQueue'

describe('ContainerBuilder', () => {
  it('registers default dependencies', () => {
    const builder = new ContainerBuilder()
    const container = builder.build()
    const engine = container.resolve(gameEngineToken)
    const bus = container.resolve(messageBusToken)
    const queue = container.resolve(messageQueueToken)
    expect(engine).toBeInstanceOf(GameEngine)
    expect(bus).toBeInstanceOf(MessageBus)
    expect(queue).toBeInstanceOf(MessageQueue)
  })
})
