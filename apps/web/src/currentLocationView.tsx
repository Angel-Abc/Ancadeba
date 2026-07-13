import type { RuntimeGameContent } from '@angelabc/ancadeba-content'
import type { GameState } from '@angelabc/ancadeba-core'
import { getCurrentLocation } from '@angelabc/ancadeba-core'

export interface CurrentLocationViewProps {
  gameContent: RuntimeGameContent
  state: GameState
  onExitSelected: (exitId: string) => void
}

export function CurrentLocationView(props: CurrentLocationViewProps) {
  const currentLocation = getCurrentLocation(props.gameContent, props.state)
  return (
    <div>
      <h2>{currentLocation.name}</h2>
      <p>{currentLocation.description}</p>

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
