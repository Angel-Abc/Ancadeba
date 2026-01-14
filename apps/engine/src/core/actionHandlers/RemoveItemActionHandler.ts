import { Action } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { IWorld, worldToken } from '../../ecs/world'
import { COMPONENT_KEYS, InventoryComponent } from '../../ecs/components'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/RemoveItemActionHandler'
export const removeItemActionHandlerToken = token<IActionHandler>(logName)
export const removeItemActionHandlerDependencies: Token<unknown>[] = [
  loggerToken,
  worldToken,
]

export class RemoveItemActionHandler implements IActionHandler {
  constructor(
    private readonly logger: ILogger,
    private readonly world: IWorld
  ) {}

  canHandle(action: Action): boolean {
    return action.type === 'remove-item'
  }

  handle(action: Action): void {
    if (action.type !== 'remove-item') {
      return
    }

    const [playerEntityId] = this.world.getEntitiesWith(COMPONENT_KEYS.player)
    if (!playerEntityId) {
      this.logger.warn(logName, 'No player entity found')
      return
    }

    const inventory = this.world.getComponent<InventoryComponent>(
      playerEntityId,
      COMPONENT_KEYS.inventory
    )
    if (!inventory) {
      this.logger.warn(logName, 'Player has no inventory component')
      return
    }

    const existingItemIndex = inventory.items.findIndex(
      (item) => item.itemId === action.itemId
    )

    if (existingItemIndex === -1) {
      this.logger.warn(
        logName,
        'Cannot remove {0}: item not found in inventory',
        action.itemId
      )
      return
    }

    const existingItem = inventory.items[existingItemIndex]
    if (!existingItem) {
      this.logger.warn(
        logName,
        'Cannot remove {0}: item not found in inventory',
        action.itemId
      )
      return
    }

    if (existingItem.quantity < action.quantity) {
      this.logger.warn(
        logName,
        'Cannot remove {0} {1}: only {2} available',
        action.quantity,
        action.itemId,
        existingItem.quantity
      )
      return
    }

    if (existingItem.quantity === action.quantity) {
      // Remove the item entirely
      inventory.items.splice(existingItemIndex, 1)
    } else {
      // Decrease quantity
      existingItem.quantity -= action.quantity
    }

    // Update the component to trigger any listeners
    this.world.setComponent(playerEntityId, COMPONENT_KEYS.inventory, inventory)

    this.logger.debug(
      logName,
      'Removed {0} {1} from inventory',
      action.quantity,
      action.itemId
    )
  }
}
