import { Token, token } from '@ancadeba/utils'
import type { Item } from '@ancadeba/schemas'
import {
  IItemDataStorage,
  itemDataStorageToken,
} from '../../resourceData/storage'

export interface IItemDataInitializer {
  initializeItems(items: Item[]): void
}

const logName = 'engine/core/initializers/itemDataInitializer'
export const itemDataInitializerToken = token<IItemDataInitializer>(logName)
export const itemDataInitializerDependencies: Token<unknown>[] = [
  itemDataStorageToken,
]

export class ItemDataInitializer implements IItemDataInitializer {
  constructor(private readonly itemDataStorage: IItemDataStorage) {}

  initializeItems(items: Item[]): void {
    items.forEach((item) => {
      this.itemDataStorage.addItemData(item.id, item)
    })
  }
}
