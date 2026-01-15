import { useService } from '@ancadeba/ui'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../../resourceData/provider'
import {
  ILanguageProvider,
  languageProviderToken,
} from '../../../language/provider'
import { useState } from 'react'

interface InventoryItemComponentProps {
  itemId: string
  quantity: number
  _onEquip: (itemId: string) => void
}

export function InventoryItemComponent({
  itemId,
  quantity,
  _onEquip,
}: InventoryItemComponentProps) {
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const languageProvider = useService<ILanguageProvider>(languageProviderToken)
  const itemData = resourceDataProvider.getItemData(itemId)
  const itemName = languageProvider.getTranslation(itemData.name)
  const [hasImage, setHasImage] = useState<boolean>(
    itemData.image ? true : false
  )

  return (
    <div className="slot slot-filled">
      <div className="quantity">{quantity}</div>
      {hasImage && (
        <img
          src={`${resourceDataProvider.assetsUrl}/images/${itemData.image}`}
          alt={itemName}
          onError={(e) => {
            setHasImage(false)
            e.currentTarget.style.display = 'none'
          }}
        />
      )}
      {!hasImage && <span className="item-name">{itemName}</span>}
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
}
