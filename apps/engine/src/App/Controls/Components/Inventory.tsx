import { InventoryComponent as InventoryComponentData } from '@ancadeba/schemas'
import { CSSCustomProperties, useService } from '@ancadeba/ui'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'
import { CORE_MESSAGES } from '../../../messages/core'
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

export function InventoryComponent({ component }: InventoryComponentProps) {
  const inventoryService = useService<IInventoryService>(inventoryServiceToken)
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const languageProvider = useService<ILanguageProvider>(languageProviderToken)
  const messageBus = useService<IMessageBus>(messageBusToken)

  const inventory = inventoryService.getPlayerInventory()

  function handleEquipItem(itemId: string) {
    const itemData = resourceDataProvider.getItemData(itemId)
    if (!itemData.appearanceId) {
      return
    }

    const appearance = resourceDataProvider.getAppearanceData(
      itemData.appearanceId
    )
    messageBus.publish(CORE_MESSAGES.EXECUTE_ACTION, {
      action: {
        type: 'equip-appearance',
        categoryId: appearance.categoryId,
        appearanceId: itemData.appearanceId,
      },
    })
  }

  if (!inventory || inventory.items.length === 0) {
    return (
      <div className="inventory-component inventory-component--empty">
        <h3>Inventory</h3>
        <p className="inventory-empty-message">No items</p>
      </div>
    )
  }

  const totalSlots = component.slotsPerRow * component.rows
  const style: CSSCustomProperties = {
    '--ge-inventory-columns': component.slotsPerRow.toString(),
  }

  return (
    <div className="inventory-component" style={style}>
      <h3>Inventory</h3>
      <div className="container">
        <div className="slots">
          {Array.from({ length: totalSlots }).map((_, index) => {
            if (!inventory.items[index]) {
              return <div key={index} className="slot"></div>
            }
            const item = inventory.items[index]
            const itemData = resourceDataProvider.getItemData(item.itemId)
            const itemName = languageProvider.getTranslation(itemData.name)
            // const itemDescription = languageProvider.getTranslation(
            //   itemData.description
            // )
            return (
              <div key={index} className="slot slot-filled">
                <img
                  src={`${resourceDataProvider.assetsUrl}/images/${itemData.image}`}
                  alt={itemName}
                />
                {/* <div className="item-name">{itemName}</div>
                <div className="item-quantity">x{item.quantity}</div>
                <div className="item-description">{itemDescription}</div>
                {itemData.type === 'equipment' && itemData.appearanceId && (
                  <button
                    className="item-use-button"
                    onClick={() => handleEquipItem(item.itemId)}
                  >
                    Equip
                  </button>
                )} */}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
