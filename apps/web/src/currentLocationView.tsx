import type { RuntimeGameContent } from '@angelabc/ancadeba-content'
import type { GameState } from '@angelabc/ancadeba-core'
import {
  getAvailableItemPlacements,
  getCurrentLocation,
  getExitAvailability,
  getInteractionAvailability,
  getItem,
  isInteractionCompleted,
} from '@angelabc/ancadeba-core'
import { useState } from 'react'

export interface CurrentLocationViewProps {
  gameContent: RuntimeGameContent
  state: GameState
  onExitSelected: (exitId: string) => void
  onItemTaken: (itemId: string) => void
  onInteractionSelected: (interactionId: string) => void
}

export function CurrentLocationView(props: CurrentLocationViewProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [inspectedItemId, setInspectedItemId] = useState<string | null>(null)

  const currentLocation = getCurrentLocation(props.gameContent, props.state)
  const availableItemPlacements = getAvailableItemPlacements(
    props.gameContent,
    props.state,
  )
  const inspectedItem = inspectedItemId
    ? getItem(props.gameContent, inspectedItemId)
    : null

  const interactions = currentLocation.interactions
    .map((interaction) => ({
      interaction,
      availability: getInteractionAvailability(interaction, props.state),
      completed: isInteractionCompleted(props.state, interaction.id),
    }))

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
                    setMessage(null)
                    setInspectedItemId(itemPlacement.itemId)
                  }}
                >
                  <strong>Inspect</strong>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setMessage(null)
                    setInspectedItemId(null)
                    props.onItemTaken(itemPlacement.itemId)
                  }}
                >
                  <strong>{itemPlacement.takeLabel}</strong>
                </button>
              </li>
            ))}
          </ul>
          {inspectedItem && (
            <div>
              <h4>Inspect: {inspectedItem.name}</h4>
              <p>{inspectedItem.description}</p>
            </div>
          )}
        </>
      )}

      <h3>Exits</h3>
      <ul>
        {currentLocation.exits.map((exit) => {
          const exitAvailability = getExitAvailability(exit, props.state)
          return (
            <li key={exit.id}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setInspectedItemId(null)
                  if (!exitAvailability.available) {
                    setMessage(exitAvailability.failureMessage)
                    return
                  }
                  setMessage(null)
                  props.onExitSelected(exit.id)
                }}
              >
                <strong>{exit.label}</strong>
              </button>
            </li>
          )
        })}
      </ul>

      {interactions.length > 0 && (
        <>
          <h3>Interactions</h3>
          <ul>
            {interactions.map(({ interaction, availability, completed }) => (
              <li key={interaction.id}>
                {completed ? (
                  <p>{interaction.completionMessage}</p>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setInspectedItemId(null)
                      if (!availability.available) {
                        setMessage(availability.failureMessage)
                        return
                      }
                      setMessage(null)
                      props.onInteractionSelected(interaction.id)
                    }}
                  >
                    <strong>{interaction.label}</strong>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  )
}
