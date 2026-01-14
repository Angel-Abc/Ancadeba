import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { Appearance } from '@ancadeba/schemas'

export interface IAppearanceDataStorage {
  /**
   * Add an appearance to storage
   * @param appearanceId The unique identifier for the appearance
   * @param data The appearance data
   */
  addAppearanceData(appearanceId: string, data: Appearance): void

  /**
   * Get an appearance by ID
   * @param appearanceId The unique identifier for the appearance
   * @returns The appearance data
   */
  getAppearanceData(appearanceId: string): Appearance

  /**
   * Get all appearances belonging to a specific category
   * @param categoryId The category ID to filter by
   * @returns Array of appearances in the specified category
   */
  getAppearancesByCategory(categoryId: string): Appearance[]
}

const logName = 'engine/resourceData/AppearanceDataStorage'
export const appearanceDataStorageToken = token<IAppearanceDataStorage>(logName)
export const appearanceDataStorageDependencies: Token<unknown>[] = [loggerToken]

export class AppearanceDataStorage implements IAppearanceDataStorage {
  private appearances: Map<string, Appearance> = new Map()

  constructor(private readonly logger: ILogger) {}

  addAppearanceData(appearanceId: string, data: Appearance): void {
    this.appearances.set(appearanceId, data)
  }

  getAppearanceData(appearanceId: string): Appearance {
    const appearance = this.appearances.get(appearanceId)
    if (!appearance) {
      this.logger.fatal(logName, 'No appearance data for id: {0}', appearanceId)
    }
    return appearance
  }

  getAppearancesByCategory(categoryId: string): Appearance[] {
    return Array.from(this.appearances.values()).filter(
      (appearance) => appearance.categoryId === categoryId
    )
  }
}
