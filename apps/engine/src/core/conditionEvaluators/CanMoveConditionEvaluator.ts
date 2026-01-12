import { Condition } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  gameStateReaderToken,
  IGameStateReader,
} from '../../gameState.ts/storage'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../resourceData/provider'
import type { MapData } from '../../resourceData/types'
import { IConditionEvaluator } from './types'

const logName = 'engine/core/conditionEvaluators/CanMoveConditionEvaluator'
export const canMoveConditionEvaluatorToken = token<IConditionEvaluator>(logName)
export const canMoveConditionEvaluatorDependencies: Token<unknown>[] = [
  loggerToken,
  gameStateReaderToken,
  resourceDataProviderToken,
]

type MoveConditionType =
  | 'can-move-up'
  | 'can-move-down'
  | 'can-move-left'
  | 'can-move-right'

export class CanMoveConditionEvaluator implements IConditionEvaluator {
  constructor(
    private readonly logger: ILogger,
    private readonly gameStateReader: IGameStateReader,
    private readonly resourceDataProvider: IResourceDataProvider
  ) {}

  canEvaluate(condition: Condition): boolean {
    return (
      condition.type === 'can-move-up' ||
      condition.type === 'can-move-down' ||
      condition.type === 'can-move-left' ||
      condition.type === 'can-move-right'
    )
  }

  evaluate(condition: Condition): boolean {
    if (
      condition.type !== 'can-move-up' &&
      condition.type !== 'can-move-down' &&
      condition.type !== 'can-move-left' &&
      condition.type !== 'can-move-right'
    ) {
      return false
    }

    const state = this.gameStateReader.state
    const mapPosition = state.mapPosition
    if (!mapPosition) {
      this.logger.warn(logName, 'Map position is not defined')
      return false
    }
    if (!state.activeMapId) {
      this.logger.warn(logName, 'Active map is not set')
      return false
    }

    let mapData: MapData
    try {
      mapData = this.resourceDataProvider.getMapData(state.activeMapId)
    } catch {
      this.logger.warn(
        logName,
        'Map data not found for id "{0}"',
        state.activeMapId
      )
      return false
    }
    const offset = this.getOffset(condition.type)
    const targetX = mapPosition.x + offset.x
    const targetY = mapPosition.y + offset.y

    if (
      targetX < 0 ||
      targetY < 0 ||
      targetX >= mapData.width ||
      targetY >= mapData.height
    ) {
      return false
    }

    const row = mapData.squares[targetY]
    if (!row) {
      this.logger.warn(logName, 'Map row is missing at y={0}', targetY)
      return false
    }
    const tileKey = row[targetX]
    if (!tileKey) {
      this.logger.warn(
        logName,
        'Map tile is missing at x={0}, y={1}',
        targetX,
        targetY
      )
      return false
    }
    const tile = mapData.tiles.get(tileKey)
    if (!tile) {
      this.logger.warn(logName, 'Tile data not found for key "{0}"', tileKey)
      return false
    }

    return tile.walkable
  }

  private getOffset(conditionType: MoveConditionType): { x: number; y: number } {
    switch (conditionType) {
      case 'can-move-up':
        return { x: 0, y: -1 }
      case 'can-move-down':
        return { x: 0, y: 1 }
      case 'can-move-left':
        return { x: -1, y: 0 }
      case 'can-move-right':
        return { x: 1, y: 0 }
    }
  }
}
