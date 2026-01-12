import { describe, expect, it, vi } from 'vitest'
import { ECS_MESSAGES } from '../../messages/ecs'
import type { IEngineMessageBus } from '../../system/engineMessageBus'
import { EcsEventBridgeSystem } from '../../ecs/systems/ecsEventBridgeSystem'
import { World, WorldEventBus } from '../../ecs/world'

describe('ecs/systems/ecsEventBridgeSystem', () => {
  it('forwards world events to the engine message bus', () => {
    // Arrange
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const system = new EcsEventBridgeSystem(messageBus, world)

    // Act
    system.start()
    const entityId = world.createEntity()
    world.setComponent(entityId, 'position', { x: 1, y: 2 })
    world.setComponent(entityId, 'position', { x: 2, y: 2 })
    world.removeComponent(entityId, 'position')
    world.destroyEntity(entityId)

    // Assert
    expect(messageBus.publish).toHaveBeenCalledWith(
      ECS_MESSAGES.ENTITY_CREATED,
      { entityId }
    )
    expect(messageBus.publish).toHaveBeenCalledWith(
      ECS_MESSAGES.COMPONENT_ADDED,
      {
        entityId,
        componentKey: 'position',
        component: { x: 1, y: 2 },
      }
    )
    expect(messageBus.publish).toHaveBeenCalledWith(
      ECS_MESSAGES.COMPONENT_UPDATED,
      {
        entityId,
        componentKey: 'position',
        component: { x: 2, y: 2 },
        previous: { x: 1, y: 2 },
      }
    )
    expect(messageBus.publish).toHaveBeenCalledWith(
      ECS_MESSAGES.COMPONENT_REMOVED,
      {
        entityId,
        componentKey: 'position',
        component: { x: 2, y: 2 },
      }
    )
    expect(messageBus.publish).toHaveBeenCalledWith(
      ECS_MESSAGES.ENTITY_DESTROYED,
      { entityId }
    )
  })

  it('stops forwarding after stop is called', () => {
    // Arrange
    const messageBus: IEngineMessageBus = {
      publish: vi.fn(),
      publishRaw: vi.fn(),
      subscribe: vi.fn(),
      subscribeRaw: vi.fn(),
    }
    const world = new World(new WorldEventBus())
    const system = new EcsEventBridgeSystem(messageBus, world)

    // Act
    system.start()
    system.stop()
    world.createEntity()

    // Assert
    expect(messageBus.publish).not.toHaveBeenCalled()
  })
})
