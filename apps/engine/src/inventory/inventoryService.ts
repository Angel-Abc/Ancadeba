import { Token, token } from '@ancadeba/utils'
import { COMPONENT_KEYS, InventoryComponent } from '../ecs/components'
import { IWorld, worldToken } from '../ecs/world'
import { IInventoryService } from './types'

export type { IInventoryService } from './types'

const logName = 'engine/inventory/inventoryService'
export const inventoryServiceToken = token<IInventoryService>(logName)
export const inventoryServiceDependencies: Token<unknown>[] = [worldToken]

export class InventoryService implements IInventoryService {
  constructor(private readonly world: IWorld) {}

  getPlayerInventory(): InventoryComponent | undefined {
    const playerEntities = this.world.getEntitiesWith(COMPONENT_KEYS.player)
    if (playerEntities.length === 0) {
      return undefined
    }

    const playerEntity = playerEntities[0]
    if (playerEntity === undefined) {
      return undefined
    }
    return this.world.getComponent<InventoryComponent>(
      playerEntity,
      COMPONENT_KEYS.inventory
    )
  }

  hasItem(itemId: string, quantity: number = 1): boolean {
    const inventory = this.getPlayerInventory()
    if (!inventory) {
      return false
    }

    const itemEntry = inventory.items.find((item) => item.itemId === itemId)
    if (!itemEntry) {
      return false
    }

    return itemEntry.quantity >= quantity
  }

  getItemQuantity(itemId: string): number {
    const inventory = this.getPlayerInventory()
    if (!inventory) {
      return 0
    }

    const itemEntry = inventory.items.find((item) => item.itemId === itemId)
    return itemEntry?.quantity ?? 0
  }

  getTotalItems(): number {
    const inventory = this.getPlayerInventory()
    if (!inventory) {
      return 0
    }

    return inventory.items.length
  }
}
