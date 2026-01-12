import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../../messages/core'
import {
  gameStateMutatorToken,
  gameStateReaderToken,
  IGameStateMutator,
  IGameStateReader,
} from '../../gameState.ts/storage'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../../system/engineMessageBus'
import {
  COMPONENT_KEYS,
  createPlayerTag,
  PositionComponent,
} from '../components'
import { EntityId, ISystem, WORLD_EVENTS } from '../types'
import { IWorld, worldToken } from '../world'

export type IMapPositionBridgeSystem = ISystem

const logName = 'engine/ecs/systems/MapPositionBridgeSystem'
export const mapPositionBridgeSystemToken = token<IMapPositionBridgeSystem>(
  logName
)
export const mapPositionBridgeSystemDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  gameStateReaderToken,
  gameStateMutatorToken,
  worldToken,
]

export class MapPositionBridgeSystem implements IMapPositionBridgeSystem {
  private unsubscribeAdded?: () => void
  private unsubscribeUpdated?: () => void

  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly gameStateReader: IGameStateReader,
    private readonly gameStateMutator: IGameStateMutator,
    private readonly world: IWorld
  ) {}

  start(): void {
    this.stop()
    this.unsubscribeAdded = this.world.subscribe(
      WORLD_EVENTS.COMPONENT_ADDED,
      (payload) => {
        if (payload.componentKey !== COMPONENT_KEYS.position) {
          return
        }
        this.handlePositionChange(payload.entityId, payload.component)
      }
    )
    this.unsubscribeUpdated = this.world.subscribe(
      WORLD_EVENTS.COMPONENT_UPDATED,
      (payload) => {
        if (payload.componentKey !== COMPONENT_KEYS.position) {
          return
        }
        this.handlePositionChange(payload.entityId, payload.component)
      }
    )
    this.ensurePlayerEntity()
  }

  stop(): void {
    if (this.unsubscribeAdded) {
      this.unsubscribeAdded()
      this.unsubscribeAdded = undefined
    }
    if (this.unsubscribeUpdated) {
      this.unsubscribeUpdated()
      this.unsubscribeUpdated = undefined
    }
  }

  private ensurePlayerEntity(): void {
    const [playerEntityId] = this.world.getEntitiesWith(COMPONENT_KEYS.player)
    if (playerEntityId) {
      const existingPosition = this.world.getComponent<PositionComponent>(
        playerEntityId,
        COMPONENT_KEYS.position
      )
      if (existingPosition) {
        return
      }
    }

    const mapPosition = this.gameStateReader.state.mapPosition
    if (!mapPosition) {
      this.logger.warn(logName, 'Map position is not defined')
      return
    }

    if (playerEntityId) {
      this.world.setComponent(playerEntityId, COMPONENT_KEYS.position, {
        x: mapPosition.x,
        y: mapPosition.y,
      })
      return
    }

    const entityId = this.world.createEntity()
    this.world.setComponent(entityId, COMPONENT_KEYS.player, createPlayerTag())
    this.world.setComponent(entityId, COMPONENT_KEYS.position, {
      x: mapPosition.x,
      y: mapPosition.y,
    })
  }

  private handlePositionChange(entityId: EntityId, component: unknown): void {
    if (!this.isPlayerEntity(entityId)) {
      return
    }
    const position = component as PositionComponent
    if (!position) {
      this.logger.warn(logName, 'Player position component is missing')
      return
    }
    this.gameStateMutator.update({
      mapPosition: {
        x: position.x,
        y: position.y,
      },
    })
    this.messageBus.publish(CORE_MESSAGES.MAP_POSITION_CHANGED, {
      mapPosition: {
        x: position.x,
        y: position.y,
      },
    })
  }

  private isPlayerEntity(entityId: EntityId): boolean {
    const playerTag = this.world.getComponent(
      entityId,
      COMPONENT_KEYS.player
    )
    return Boolean(playerTag)
  }
}
