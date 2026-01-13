import { Action } from '@ancadeba/schemas'
import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { IWorld, worldToken } from '../../ecs/world'
import {
  COMPONENT_KEYS,
  InventoryComponent,
  InventoryItem,
} from '../../ecs/components'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../resourceData/provider'
import { IActionHandler } from './types'

const logName = 'engine/core/actionHandlers/AddItemActionHandler'
export const addItemActionHandlerToken = token<IActionHandler>(logName)
export const addItemActionHandlerDependencies: Token<unknown>[] = [
  loggerToken,
  worldToken,
  resourceDataProviderToken,
]

export class AddItemActionHandler implements IActionHandler {
  constructor(
    private readonly logger: ILogger,
    private readonly world: IWorld,
    private readonly resourceDataProvider: IResourceDataProvider
  ) {}

  canHandle(action: Action): boolean {
    return action.type === 'add-item'
  }

  handle(action: Action): void {
    if (action.type !== 'add-item') {
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

    const itemData = this.resourceDataProvider.getItemData(action.itemId)
    const existingItemIndex = inventory.items.findIndex(
      (item) => item.itemId === action.itemId
    )

    if (existingItemIndex !== -1 && itemData.stackable) {
      // Item exists and is stackable - increment quantity
      const existingItem = inventory.items[existingItemIndex]
      const newQuantity = existingItem.quantity + action.quantity

      // Check maxStack limit
      if (itemData.maxStack && newQuantity > itemData.maxStack) {
        this.logger.warn(
          logName,
          'Cannot add {0} {1}: would exceed max stack of {2}',
          action.quantity,
          action.itemId,
          itemData.maxStack
        )
        return
      }

      existingItem.quantity = newQuantity
    } else {
      // Add as new item
      const newItem: InventoryItem = {
        itemId: action.itemId,
        quantity: action.quantity,
      }
      inventory.items.push(newItem)
    }

    // Update the component to trigger any listeners
    this.world.setComponent(playerEntityId, COMPONENT_KEYS.inventory, inventory)

    this.logger.debug(
      logName,
      'Added {0} {1} to inventory',
      action.quantity,
      action.itemId
    )
  }
}
