import { Condition } from '@ancadeba/schemas'
import { ILogger, loggerToken, token } from '@ancadeba/utils'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../gameState.ts/provider'

export interface IConditionResolver {
  evaluateCondition(condition: Condition): boolean
}

const logName = 'engine/core/ConditionResolver'
export const conditionResolverToken = token<IConditionResolver>(logName)
export const conditionResolverDependencies = [
  loggerToken,
  gameStateProviderToken,
]
export class ConditionResolver implements IConditionResolver {
  constructor(
    private readonly logger: ILogger,
    private readonly gameStateProvider: IGameStateProvider
  ) {}
  evaluateCondition(condition: Condition): boolean {
    switch (condition.type) {
      case 'flag': {
        const flagValue = this.gameStateProvider.getFlag(condition.name)
        if (flagValue === undefined) {
          this.logger.warn(logName, 'Flag "{0}" is not defined', condition.name)
          return false
        }
        return flagValue === condition.value
      }
      default:
        this.logger.warn(logName, 'Unknown condition type: {0}', condition.type)
        return false
    }
  }
}
