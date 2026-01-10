import { Condition } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../../gameState.ts/provider'
import { IConditionEvaluator } from './types'

const logName = 'engine/core/conditionEvaluators/FlagConditionEvaluator'
export const flagConditionEvaluatorToken = token<IConditionEvaluator>(logName)
export const flagConditionEvaluatorDependencies: Token<unknown>[] = [
  loggerToken,
  gameStateProviderToken,
]

export class FlagConditionEvaluator implements IConditionEvaluator {
  constructor(
    private readonly logger: ILogger,
    private readonly gameStateProvider: IGameStateProvider
  ) {}

  canEvaluate(condition: Condition): boolean {
    return condition.type === 'flag'
  }

  evaluate(condition: Condition): boolean {
    if (condition.type !== 'flag') {
      return false
    }

    const flagValue = this.gameStateProvider.getFlag(condition.name)
    if (flagValue === undefined) {
      this.logger.warn(logName, 'Flag "{0}" is not defined', condition.name)
      return false
    }
    return flagValue === condition.value
  }
}
