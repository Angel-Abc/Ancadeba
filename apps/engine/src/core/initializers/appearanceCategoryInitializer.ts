import { Token, token } from '@ancadeba/utils'
import type { AppearanceCategory } from '@ancadeba/schemas'
import {
  IAppearanceCategoryStorage,
  appearanceCategoryStorageToken,
} from '../../resourceData/storage'

export interface IAppearanceCategoryInitializer {
  initializeAppearanceCategories(categories: AppearanceCategory[]): void
}

const logName = 'engine/core/initializers/appearanceCategoryInitializer'
export const appearanceCategoryInitializerToken =
  token<IAppearanceCategoryInitializer>(logName)
export const appearanceCategoryInitializerDependencies: Token<unknown>[] = [
  appearanceCategoryStorageToken,
]

export class AppearanceCategoryInitializer
  implements IAppearanceCategoryInitializer
{
  constructor(
    private readonly appearanceCategoryStorage: IAppearanceCategoryStorage
  ) {}

  initializeAppearanceCategories(categories: AppearanceCategory[]): void {
    categories.forEach((category) => {
      this.appearanceCategoryStorage.addAppearanceCategoryData(
        category.id,
        category
      )
    })
  }
}
