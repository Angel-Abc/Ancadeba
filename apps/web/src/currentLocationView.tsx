import type { RuntimeGameContent } from '@angelabc/ancadeba-content'
import type { GameState } from '@angelabc/ancadeba-core'
import {
  getAvailableItemPlacements,
  getCurrentLocation,
  getItem,
} from '@angelabc/ancadeba-core'

export interface CurrentLocationViewProps {
  gameContent: RuntimeGameContent
  state: GameState
  onExitSelected: (exitId: string) => void
  onItemTaken: (itemId: string) => void
}

export function CurrentLocationView(props: CurrentLocationViewProps) {
  const currentLocation = getCurrentLocation(props.gameContent, props.state)
  const availableItemPlacements = getAvailableItemPlacements(
    props.gameContent,
    props.state,
  )
  return (
    <div>
      <h2>{currentLocation.name}</h2>
      <p>{currentLocation.description}</p>

      {availableItemPlacements.length > 0 && (
        <>
          <h3>Items</h3>
          <ul>
            {availableItemPlacements.map((itemPlacement) => (
              <li key={itemPlacement.itemId}>
                {getItem(props.gameContent, itemPlacement.itemId).name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    props.onItemTaken(itemPlacement.itemId)
                  }}
                >
                  <strong>{itemPlacement.takeLabel}</strong>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3>Exits</h3>
      <ul>
        {currentLocation.exits.map((exit) => (
          <li key={exit.id}>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                props.onExitSelected(exit.id)
              }}
            >
              <strong>{exit.label}</strong>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
