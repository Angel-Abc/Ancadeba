import { Token, token } from '@ancadeba/utils'
import { ECS_MESSAGES } from '../../messages/ecs'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../../system/engineMessageBus'
import { ISystem, WORLD_EVENTS } from '../types'
import { IWorld, worldToken } from '../world'

export type IEcsEventBridgeSystem = ISystem

const logName = 'engine/ecs/systems/EcsEventBridgeSystem'
export const ecsEventBridgeSystemToken = token<IEcsEventBridgeSystem>(logName)
export const ecsEventBridgeSystemDependencies: Token<unknown>[] = [
  engineMessageBusToken,
  worldToken,
]

export class EcsEventBridgeSystem implements IEcsEventBridgeSystem {
  private unsubscribers: Array<() => void> = []

  constructor(
    private readonly messageBus: IEngineMessageBus,
    private readonly world: IWorld
  ) {}

  start(): void {
    this.stop()
    this.unsubscribers = [
      this.world.subscribe(WORLD_EVENTS.ENTITY_CREATED, (payload) => {
        this.messageBus.publish(ECS_MESSAGES.ENTITY_CREATED, payload)
      }),
      this.world.subscribe(WORLD_EVENTS.ENTITY_DESTROYED, (payload) => {
        this.messageBus.publish(ECS_MESSAGES.ENTITY_DESTROYED, payload)
      }),
      this.world.subscribe(WORLD_EVENTS.COMPONENT_ADDED, (payload) => {
        this.messageBus.publish(ECS_MESSAGES.COMPONENT_ADDED, payload)
      }),
      this.world.subscribe(WORLD_EVENTS.COMPONENT_REMOVED, (payload) => {
        this.messageBus.publish(ECS_MESSAGES.COMPONENT_REMOVED, payload)
      }),
      this.world.subscribe(WORLD_EVENTS.COMPONENT_UPDATED, (payload) => {
        this.messageBus.publish(ECS_MESSAGES.COMPONENT_UPDATED, payload)
      }),
    ]
  }

  stop(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe())
    this.unsubscribers = []
  }
}
