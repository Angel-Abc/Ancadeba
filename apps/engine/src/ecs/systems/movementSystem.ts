import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { UI_MESSAGES } from '../../messages/ui'
import {
  conditionResolverToken,
  IConditionResolver,
} from '../../core/conditionResolver'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../../system/engineMessageBus'
import { COMPONENT_KEYS, PositionComponent } from '../components'
import { ISystem } from '../types'
import { IWorld, worldToken } from '../world'

export type IMovementSystem = ISystem

const logName = 'engine/ecs/systems/MovementSystem'
export const movementSystemToken = token<IMovementSystem>(logName)
export const movementSystemDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  conditionResolverToken,
  worldToken,
]

type MoveRule = {
  conditionType:
    | 'can-move-up'
    | 'can-move-down'
    | 'can-move-left'
    | 'can-move-right'
  offset: {
    x: number
    y: number
  }
}

export class MovementSystem implements IMovementSystem {
  private unsubscribe?: () => void

  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly conditionResolver: IConditionResolver,
    private readonly world: IWorld
  ) {}

  start(): void {
    this.stop()
    this.unsubscribe = this.messageBus.subscribe(
      UI_MESSAGES.VIRTUAL_INPUT_PRESSED,
      (payload) => {
        this.handleVirtualInput(payload.virtualInput)
      }
    )
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }

  private handleVirtualInput(virtualInput: string): void {
    const rule = this.getMoveRule(virtualInput)
    if (!rule) {
      return
    }

    if (
      !this.conditionResolver.evaluateCondition({
        type: rule.conditionType,
      })
    ) {
      return
    }

    const [playerEntityId] = this.world.getEntitiesWith(
      COMPONENT_KEYS.player,
      COMPONENT_KEYS.position
    )
    if (!playerEntityId) {
      this.logger.warn(logName, 'Player entity not found')
      return
    }

    const currentPosition = this.world.getComponent<PositionComponent>(
      playerEntityId,
      COMPONENT_KEYS.position
    )
    if (!currentPosition) {
      this.logger.warn(logName, 'Player position component is missing')
      return
    }

    const nextPosition = {
      x: currentPosition.x + rule.offset.x,
      y: currentPosition.y + rule.offset.y,
    }
    this.world.setComponent(
      playerEntityId,
      COMPONENT_KEYS.position,
      nextPosition
    )
  }

  private getMoveRule(virtualInput: string): MoveRule | null {
    switch (virtualInput) {
      case 'VI_UP':
        return { conditionType: 'can-move-up', offset: { x: 0, y: -1 } }
      case 'VI_DOWN':
        return { conditionType: 'can-move-down', offset: { x: 0, y: 1 } }
      case 'VI_LEFT':
        return { conditionType: 'can-move-left', offset: { x: -1, y: 0 } }
      case 'VI_RIGHT':
        return { conditionType: 'can-move-right', offset: { x: 1, y: 0 } }
      default:
        return null
    }
  }
}
