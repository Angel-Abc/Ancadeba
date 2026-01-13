import { ILogger, loggerToken, Token, token } from '@ancadeba/utils'
import { Item } from '@ancadeba/schemas'

export interface IItemDataStorage {
  addItemData(itemId: string, data: Item): void
  getItemData(itemId: string): Item
  getLoadedItemIds(): string[]
}

const logName = 'engine/resourceData/ItemDataStorage'
export const itemDataStorageToken = token<IItemDataStorage>(logName)
export const itemDataStorageDependencies: Token<unknown>[] = [loggerToken]

export class ItemDataStorage implements IItemDataStorage {
  private items: Map<string, Item> = new Map()

  constructor(private readonly logger: ILogger) {}

  addItemData(itemId: string, data: Item): void {
    this.items.set(itemId, data)
  }

  getItemData(itemId: string): Item {
    const item = this.items.get(itemId)
    if (!item) {
      this.logger.fatal(logName, 'No item data for id: {0}', itemId)
    }
    return item
  }

  getLoadedItemIds(): string[] {
    return Array.from(this.items.keys())
  }
}
