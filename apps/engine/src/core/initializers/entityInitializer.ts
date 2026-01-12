import { Token, token } from '@ancadeba/utils'
import type { GameData } from '@ancadeba/schemas'
import {
  COMPONENT_KEYS,
  createPlayerTag,
  PositionComponent,
} from '../../ecs/components'
import { IWorld, worldToken } from '../../ecs/world'

export interface IEntityInitializer {
  initializeEntities(gameData: GameData): void
}

const logName = 'engine/core/initializers/entityInitializer'
export const entityInitializerToken = token<IEntityInitializer>(logName)
export const entityInitializerDependencies: Token<unknown>[] = [worldToken]

export class EntityInitializer implements IEntityInitializer {
  constructor(private readonly world: IWorld) {}

  initializeEntities(gameData: GameData): void {
    const mapPosition = gameData.meta.initialState.mapPosition
    if (!mapPosition) {
      return
    }

    const position: PositionComponent = {
      x: mapPosition.x,
      y: mapPosition.y,
    }

    const [playerEntityId] = this.world.getEntitiesWith(COMPONENT_KEYS.player)
    if (playerEntityId) {
      this.world.setComponent(
        playerEntityId,
        COMPONENT_KEYS.position,
        position
      )
      return
    }

    const entityId = this.world.createEntity()
    this.world.setComponent(entityId, COMPONENT_KEYS.player, createPlayerTag())
    this.world.setComponent(entityId, COMPONENT_KEYS.position, position)
  }
}
