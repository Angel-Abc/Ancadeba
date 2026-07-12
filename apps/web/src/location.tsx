import type { LocationsFile } from '@angelabc/ancadeba-content'
import type { GameState } from '@angelabc/ancadeba-core'
import {
  getCurrentLocation,
  moveToLocationUsingExit,
} from '@angelabc/ancadeba-core'

export interface LocationProps {
  locations: LocationsFile
  state: GameState
  updateState: (newState: GameState) => void
}

export function Location(props: LocationProps) {
  const currentLocation = getCurrentLocation(props.state, props.locations)
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
                const newState = moveToLocationUsingExit(props.state, props.locations, exit.id)
                props.updateState(newState)
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
