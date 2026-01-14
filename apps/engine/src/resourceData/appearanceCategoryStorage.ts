import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { AppearanceCategory } from '@ancadeba/schemas'

export interface IAppearanceCategoryStorage {
  /**
   * Add an appearance category to storage
   * @param categoryId The unique identifier for the category
   * @param data The appearance category data
   */
  addAppearanceCategoryData(categoryId: string, data: AppearanceCategory): void

  /**
   * Get an appearance category by ID
   * @param categoryId The unique identifier for the category
   * @returns The appearance category data
   */
  getAppearanceCategoryData(categoryId: string): AppearanceCategory

  /**
   * Get all loaded appearance categories
   * @returns Array of all appearance categories
   */
  getAllAppearanceCategories(): AppearanceCategory[]
}

const logName = 'engine/resourceData/AppearanceCategoryStorage'
export const appearanceCategoryStorageToken =
  token<IAppearanceCategoryStorage>(logName)
export const appearanceCategoryStorageDependencies: Token<unknown>[] = [
  loggerToken,
]

export class AppearanceCategoryStorage implements IAppearanceCategoryStorage {
  private categories: Map<string, AppearanceCategory> = new Map()

  constructor(private readonly logger: ILogger) {}

  addAppearanceCategoryData(
    categoryId: string,
    data: AppearanceCategory
  ): void {
    this.categories.set(categoryId, data)
  }

  getAppearanceCategoryData(categoryId: string): AppearanceCategory {
    const category = this.categories.get(categoryId)
    if (!category) {
      this.logger.fatal(
        logName,
        'No appearance category data for id: {0}',
        categoryId
      )
    }
    return category
  }

  getAllAppearanceCategories(): AppearanceCategory[] {
    return Array.from(this.categories.values())
  }
}
