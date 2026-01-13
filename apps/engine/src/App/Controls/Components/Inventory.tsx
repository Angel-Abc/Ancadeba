import { InventoryComponent as InventoryComponentData } from '@ancadeba/schemas'
import { useService } from '@ancadeba/ui'
import {
  IInventoryService,
  inventoryServiceToken,
} from '../../../inventory/inventoryService'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../../resourceData/provider'
import {
  ILanguageProvider,
  languageProviderToken,
} from '../../../language/provider'

interface InventoryComponentProps {
  component: InventoryComponentData
}

export function InventoryComponent(_props: InventoryComponentProps) {
  const inventoryService = useService<IInventoryService>(inventoryServiceToken)
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const languageProvider = useService<ILanguageProvider>(languageProviderToken)

  const inventory = inventoryService.getPlayerInventory()

  if (!inventory || inventory.items.length === 0) {
    return (
      <div className="inventory-component inventory-component--empty">
        <h3>Inventory</h3>
        <p className="inventory-empty-message">No items</p>
      </div>
    )
  }

  return (
    <div className="inventory-component">
      <h3>Inventory</h3>
      <ul className="inventory-list">
        {inventory.items.map((item) => {
          const itemData = resourceDataProvider.getItemData(item.itemId)
          const itemName = languageProvider.getTranslation(itemData.name)
          const itemDescription = languageProvider.getTranslation(
            itemData.description
          )

          return (
            <li key={item.itemId} className="inventory-item">
              <div className="inventory-item-header">
                <span className="inventory-item-name">{itemName}</span>
                <span className="inventory-item-quantity">
                  x{item.quantity}
                </span>
              </div>
              <p className="inventory-item-description">{itemDescription}</p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
