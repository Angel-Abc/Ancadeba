import type { RuntimeGameContent } from '@angelabc/ancadeba-content'
import type { GameState } from '@angelabc/ancadeba-core'
import { getInventoryItems } from '@angelabc/ancadeba-core'
import { useState } from 'react'

export interface CurrentInventoryProps {
  gameContent: RuntimeGameContent
  state: GameState
}

export function CurrentInventory(props: CurrentInventoryProps) {
  const inventoryItems = getInventoryItems(props.gameContent, props.state)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  const selectedItem = inventoryItems.find((item) => item.id === selectedItemId)
  return (
    <div>
      <h3>Inventory</h3>
      {inventoryItems.length > 0 ? (
        <>
          <ul>
            {inventoryItems.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedItemId((currentId) => (currentId === item.id ? null : item.id))}
                >
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
          {selectedItem && (
            <div>
              <h4>Selected Item</h4>
              <p>{selectedItem.name}</p>
              <p>{selectedItem.description}</p>
            </div>
          )}
        </>
      ) : (
        <p>Your inventory is empty.</p>
      )}
    </div>
  )
}
