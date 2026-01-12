import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { UI_MESSAGES } from '../messages/ui'
import { CORE_MESSAGES } from '../messages/core'
import {
  conditionResolverToken,
  IConditionResolver,
} from '../core/conditionResolver'
import {
  gameStateMutatorToken,
  gameStateReaderToken,
  IGameStateMutator,
  IGameStateReader,
} from '../gameState.ts/storage'
import { IEngineMessageBus, engineMessageBusToken } from './engineMessageBus'

export interface IMapPositionService {
  start(): void
  stop(): void
}

const logName = 'engine/system/mapPositionService'
export const mapPositionServiceToken = token<IMapPositionService>(logName)

export const mapPositionServiceDependencies: Token<unknown>[] = [
  loggerToken,
  engineMessageBusToken,
  conditionResolverToken,
  gameStateReaderToken,
  gameStateMutatorToken,
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

export class MapPositionService implements IMapPositionService {
  private unsubscribe?: () => void

  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IEngineMessageBus,
    private readonly conditionResolver: IConditionResolver,
    private readonly gameStateReader: IGameStateReader,
    private readonly gameStateMutator: IGameStateMutator
  ) {}

  start(): void {
    this.stop()
    this.unsubscribe = this.messageBus.subscribe(
      UI_MESSAGES.VIRTUAL_INPUT_PRESSED,
      (payload) => {
        const rule = this.getMoveRule(payload.virtualInput)
        if (!rule) {
          return
        }
        const currentPosition = this.gameStateReader.state.mapPosition
        if (!currentPosition) {
          this.logger.warn(logName, 'Map position is not defined')
          return
        }
        if (
          !this.conditionResolver.evaluateCondition({
            type: rule.conditionType,
          })
        ) {
          return
        }
        const nextPosition = {
          x: currentPosition.x + rule.offset.x,
          y: currentPosition.y + rule.offset.y,
        }
        this.gameStateMutator.update({ mapPosition: nextPosition })
        this.messageBus.publish(CORE_MESSAGES.MAP_POSITION_CHANGED, {
          mapPosition: nextPosition,
        })
      }
    )
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = undefined
    }
  }

  private getMoveRule(virtualInput: string): MoveRule | null {
    // TODO: Consider loading move rules from data instead of hard-coded inputs
    // NOTE: This will become a thing when conditions can be more complex than simple checks
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
