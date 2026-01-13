import { InventoryComponent } from '../ecs/components'

export interface IInventoryService {
  /**
   * Get the player's inventory component
   * @returns The inventory component or undefined if player or inventory doesn't exist
   */
  getPlayerInventory(): InventoryComponent | undefined

  /**
   * Check if the player has a specific item with at least the specified quantity
   * @param itemId The ID of the item to check
   * @param quantity The minimum quantity required (defaults to 1)
   * @returns True if the player has the item with sufficient quantity
   */
  hasItem(itemId: string, quantity?: number): boolean

  /**
   * Get the quantity of a specific item in the player's inventory
   * @param itemId The ID of the item
   * @returns The quantity of the item, or 0 if not found
   */
  getItemQuantity(itemId: string): number

  /**
   * Get the total number of unique items in the player's inventory
   * @returns The count of unique items
   */
  getTotalItems(): number
}
