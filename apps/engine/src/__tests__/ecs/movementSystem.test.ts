import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IConditionResolver } from '../../core/conditionResolver'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import { UI_MESSAGES } from '../../messages/ui'
import {
  COMPONENT_KEYS,
  createPlayerTag,
  PositionComponent,
} from '../../ecs/components'
import { MovementSystem } from '../../ecs/systems/movementSystem'
import { World, WorldEventBus } from '../../ecs/world'

const createLogger = (): ILogger => ({
  debug: vi.fn().mockReturnValue(''),
  info: vi.fn().mockReturnValue(''),
  warn: vi.fn().mockReturnValue(''),
  error: vi.fn().mockReturnValue(''),
  fatal: vi.fn(() => {
    throw new Error('fatal')
  }),
})

describe('ecs/systems/movementSystem', () => {
  it('start subscribes to VIRTUAL_INPUT_PRESSED', () => {
    // Arrange
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(() => () => undefined),
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const system = new MovementSystem(
      createLogger(),
      messageBus,
      conditionResolver,
      world
    )

    // Act
    system.start()

    // Assert
    expect(messageBus.subscribe).toHaveBeenCalledWith(
      UI_MESSAGES.VIRTUAL_INPUT_PRESSED,
      expect.any(Function)
    )
  })

  it('updates player position when movement is allowed', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((_message, callback) => {
        handler = callback
        return () => undefined
      }),
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const world = new World(new WorldEventBus())
    const entityId = world.createEntity()
    world.setComponent(entityId, COMPONENT_KEYS.player, createPlayerTag())
    world.setComponent<PositionComponent>(entityId, COMPONENT_KEYS.position, {
      x: 2,
      y: 3,
    })
    const system = new MovementSystem(
      createLogger(),
      messageBus,
      conditionResolver,
      world
    )

    // Act
    system.start()
    handler?.({ virtualInput: 'VI_RIGHT', label: 'Right' })

    // Assert
    const position = world.getComponent<PositionComponent>(
      entityId,
      COMPONENT_KEYS.position
    )
    expect(position).toEqual({ x: 3, y: 3 })
  })

  it('does not update when movement is blocked', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((_message, callback) => {
        handler = callback
        return () => undefined
      }),
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(false),
    }
    const world = new World(new WorldEventBus())
    const entityId = world.createEntity()
    world.setComponent(entityId, COMPONENT_KEYS.player, createPlayerTag())
    world.setComponent<PositionComponent>(entityId, COMPONENT_KEYS.position, {
      x: 2,
      y: 3,
    })
    const system = new MovementSystem(
      createLogger(),
      messageBus,
      conditionResolver,
      world
    )

    // Act
    system.start()
    handler?.({ virtualInput: 'VI_LEFT', label: 'Left' })

    // Assert
    const position = world.getComponent<PositionComponent>(
      entityId,
      COMPONENT_KEYS.position
    )
    expect(position).toEqual({ x: 2, y: 3 })
  })

  it('skips unknown virtual inputs', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((_message, callback) => {
        handler = callback
        return () => undefined
      }),
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const system = new MovementSystem(
      createLogger(),
      messageBus,
      conditionResolver,
      world
    )

    // Act
    system.start()
    handler?.({ virtualInput: 'VI_UNKNOWN', label: 'Unknown' })

    // Assert
    expect(conditionResolver.evaluateCondition).not.toHaveBeenCalled()
  })

  it('logs when player entity is missing', () => {
    // Arrange
    let handler:
      | ((payload: { virtualInput: string; label: string }) => void)
      | undefined
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn((_message, callback) => {
        handler = callback
        return () => undefined
      }),
      subscribeRaw: vi.fn(),
    }
    const conditionResolver: IConditionResolver = {
      evaluateCondition: vi.fn().mockReturnValue(true),
    }
    const logger = createLogger()
    const world = new World(new WorldEventBus())
    const system = new MovementSystem(logger, messageBus, conditionResolver, world)

    // Act
    system.start()
    handler?.({ virtualInput: 'VI_UP', label: 'Up' })

    // Assert
    expect(logger.warn).toHaveBeenCalledWith(
      'engine/ecs/systems/MovementSystem',
      'Player entity not found'
    )
  })

})
