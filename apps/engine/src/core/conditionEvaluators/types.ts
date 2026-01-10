import { Condition } from '@ancadeba/schemas'
import { token } from '@ancadeba/utils'

export interface IConditionEvaluator {
  canEvaluate(condition: Condition): boolean
  evaluate(condition: Condition): boolean
}

export const conditionEvaluatorToken = token<IConditionEvaluator>(
  'engine/core/conditionEvaluators/IConditionEvaluator'
)
