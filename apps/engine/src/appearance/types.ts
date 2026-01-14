import { AppearanceComponent, EquippedAppearance } from '../ecs/components'

export interface IAppearanceService {
  /**
   * Get the player's appearance component
   * @returns The appearance component or undefined if player doesn't exist
   */
  getPlayerAppearances(): AppearanceComponent | undefined

  /**
   * Check if player has an appearance equipped in a category
   * @param categoryId The category ID to check
   * @returns True if an appearance is equipped in the category
   */
  hasAppearanceInCategory(categoryId: string): boolean

  /**
   * Get the equipped appearance ID for a specific category
   * @param categoryId The category ID to check
   * @returns The appearance ID or undefined if nothing is equipped
   */
  getEquippedAppearance(categoryId: string): string | undefined

  /**
   * Equip an appearance in a category (replaces existing if present)
   * @param categoryId The category ID
   * @param appearanceId The appearance ID to equip
   */
  equipAppearance(categoryId: string, appearanceId: string): void

  /**
   * Unequip appearance from a category
   * @param categoryId The category ID to unequip from
   */
  unequipAppearance(categoryId: string): void

  /**
   * Get all equipped appearances
   * @returns Array of all equipped appearances
   */
  getAllEquippedAppearances(): EquippedAppearance[]
}
