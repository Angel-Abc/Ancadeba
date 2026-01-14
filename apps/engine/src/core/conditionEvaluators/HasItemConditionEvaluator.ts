import { Condition } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { COMPONENT_KEYS, InventoryComponent } from '../../ecs/components'
import { IWorld, worldToken } from '../../ecs/world'
import { IConditionEvaluator } from './types'

const logName = 'engine/core/conditionEvaluators/HasItemConditionEvaluator'
export const hasItemConditionEvaluatorToken =
  token<IConditionEvaluator>(logName)
export const hasItemConditionEvaluatorDependencies: Token<unknown>[] = [
  loggerToken,
  worldToken,
]

export class HasItemConditionEvaluator implements IConditionEvaluator {
  constructor(
    private readonly logger: ILogger,
    private readonly world: IWorld
  ) {}

  canEvaluate(condition: Condition): boolean {
    return condition.type === 'has-item'
  }

  evaluate(condition: Condition): boolean {
    if (condition.type !== 'has-item') {
      return false
    }

    const playerEntities = this.world.getEntitiesWith(COMPONENT_KEYS.player)
    if (playerEntities.length === 0) {
      this.logger.warn(logName, 'No player entity found')
      return false
    }

    const playerEntity = playerEntities[0]
    if (playerEntity === undefined) {
      this.logger.warn(logName, 'No player entity found')
      return false
    }
    const inventory = this.world.getComponent<InventoryComponent>(
      playerEntity,
      COMPONENT_KEYS.inventory
    )

    if (!inventory) {
      this.logger.warn(logName, 'Player has no inventory component')
      return false
    }

    const itemEntry = inventory.items.find(
      (item) => item.itemId === condition.itemId
    )
    if (!itemEntry) {
      return false
    }

    const requiredQuantity = condition.quantity ?? 1
    return itemEntry.quantity >= requiredQuantity
  }
}
