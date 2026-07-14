import type { RuntimeGameContent } from '@angelabc/ancadeba-content'
import type { GameState } from '@angelabc/ancadeba-core'
import { getInventoryItems } from '@angelabc/ancadeba-core'

export interface CurrentInventoryProps {
  gameContent: RuntimeGameContent
  state: GameState
}

export function CurrentInventory(props: CurrentInventoryProps) {
  const inventoryItems = getInventoryItems(props.gameContent, props.state)
  return (
    <div>
      <h3>Inventory</h3>
      {inventoryItems.length > 0 ? (
        <ul>
          {inventoryItems.map((item) => (
            <li key={item.id}>{item.name}</li>
          ))}
        </ul>
      ) : (
        <p>Your inventory is empty.</p>
      )}
    </div>
  )
}
