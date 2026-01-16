import { Condition } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../../gameState.ts/provider'
import { IConditionEvaluator } from './types'

const logName = 'engine/core/conditionEvaluators/ValueConditionEvaluator'
export const valueConditionEvaluatorToken = token<IConditionEvaluator>(logName)
export const valueConditionEvaluatorDependencies: Token<unknown>[] = [
  loggerToken,
  gameStateProviderToken,
]

export class ValueConditionEvaluator implements IConditionEvaluator {
  constructor(
    private readonly logger: ILogger,
    private readonly gameStateProvider: IGameStateProvider
  ) {}

  canEvaluate(condition: Condition): boolean {
    return (
      condition.type === 'value-set' ||
      condition.type === 'value-not-set' ||
      condition.type === 'value-equals'
    )
  }

  evaluate(condition: Condition): boolean {
    if (condition.type === 'value-set') {
      const value = this.gameStateProvider.getValue(condition.name)
      this.logger.debug(
        logName,
        'Checking if value "{0}" is set: {1}',
        condition.name,
        value !== undefined
      )
      return value !== undefined
    }

    if (condition.type === 'value-not-set') {
      const value = this.gameStateProvider.getValue(condition.name)
      this.logger.debug(
        logName,
        'Checking if value "{0}" is not set: {1}',
        condition.name,
        value === undefined
      )
      return value === undefined
    }

    if (condition.type === 'value-equals') {
      const value = this.gameStateProvider.getValue(condition.name)
      if (value === undefined) {
        this.logger.warn(logName, 'Value "{0}" is not defined', condition.name)
        return false
      }
      this.logger.debug(
        logName,
        'Checking if value "{0}" equals "{1}": {2}',
        condition.name,
        condition.value,
        value === condition.value
      )
      return value === condition.value
    }

    return false
  }
}
