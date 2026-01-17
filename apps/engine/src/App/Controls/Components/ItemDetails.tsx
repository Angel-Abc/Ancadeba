import { ItemDetailsComponent as ItemDetailsComponentData } from '@ancadeba/schemas'
import { useService } from '@ancadeba/ui'
import {
  IGameStateProvider,
  gameStateProviderToken,
} from '../../../gameState.ts/provider'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../../resourceData/provider'
import {
  ILanguageProvider,
  languageProviderToken,
} from '../../../language/provider'

interface ItemDetailsComponentProps {
  component: ItemDetailsComponentData
}

export function ItemDetailsComponent({ component }: ItemDetailsComponentProps) {
  const gameStateProvider = useService<IGameStateProvider>(
    gameStateProviderToken
  )
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const languageProvider = useService<ILanguageProvider>(languageProviderToken)

  // Get the item ID from the game state field specified in the component
  const itemIdField = component['itemId-field']
  const itemId = gameStateProvider.getValue(itemIdField)

  // If no item is selected, show empty state
  if (!itemId) {
    return (
      <div className="item-details-component item-details-component--empty">
        <h3>Item Details</h3>
        <p className="item-details-empty-message">No item selected</p>
      </div>
    )
  }

  // Get the item data from the resource data provider
  const item = resourceDataProvider.getItemData(itemId)

  if (!item) {
    return (
      <div className="item-details-component item-details-component--error">
        <h3>Item Details</h3>
        <p className="item-details-error-message">Item not found: {itemId}</p>
      </div>
    )
  }

  // Get translated name and description
  const itemName = languageProvider.getTranslation(item.name)
  const itemDescription = languageProvider.getTranslation(item.description)

  // Build image URL if available
  const imageUrl = item.image
    ? `${resourceDataProvider.assetsUrl}${item.image}`
    : undefined

  return (
    <div className="item-details-component">
      <h3>Item Details</h3>
      <div className="item-details-content">
        {imageUrl && (
          <div className="item-image">
            <img src={imageUrl} alt={itemName} />
          </div>
        )}
        <div className="item-info">
          <h4 className="item-name">{itemName}</h4>
          <p className="item-description">{itemDescription}</p>
          <div className="item-properties">
            <p className="item-type">
              <strong>Type:</strong> {item.type}
            </p>
            <p className="item-weight">
              <strong>Weight:</strong> {item.weight}
            </p>
            {item.stackable && (
              <p className="item-stackable">
                <strong>Stackable:</strong> Yes (max:{' '}
                {item.maxStack || 'unlimited'})
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
