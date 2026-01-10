import { Condition } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { IConditionEvaluator } from './conditionEvaluators/types'

export interface IConditionResolver {
  evaluateCondition(condition: Condition): boolean
}

const logName = 'engine/core/ConditionResolver'
export const conditionResolverToken = token<IConditionResolver>(logName)
export const conditionResolverDependencies: Token<unknown>[] = [loggerToken]

export class ConditionResolver implements IConditionResolver {
  constructor(
    private readonly logger: ILogger,
    private readonly evaluators: IConditionEvaluator[]
  ) {}

  evaluateCondition(condition: Condition): boolean {
    const evaluator = this.evaluators.find((e) => e.canEvaluate(condition))
    if (!evaluator) {
      this.logger.warn(
        logName,
        'No evaluator for condition type: {0}',
        condition.type
      )
      return false
    }
    return evaluator.evaluate(condition)
  }
}
