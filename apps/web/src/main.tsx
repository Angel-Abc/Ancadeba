import {
  parseGameManifest,
  parseLocationsFile,
  type GameManifest,
  type LocationsFile,
} from '@angelabc/ancadeba-content'
import {
  createInitialGameState,
  type GameState,
} from '@angelabc/ancadeba-core'
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Location } from './location'

interface LoadedGame {
  manifest: GameManifest
  locations: LocationsFile
}

async function loadJson(path: string): Promise<unknown> {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(
      `Could not load ${path}: ${response.status} ${response.statusText}`,
    )
  }

  return response.json()
}

async function loadGame(): Promise<LoadedGame> {
  const manifestValue = await loadJson('/game/game.json')
  const manifest = parseGameManifest(manifestValue)

  const locationsValue = await loadJson(`/game/${manifest.content.locations}`)
  const locations = parseLocationsFile(locationsValue)

  return { manifest, locations }
}

function App() {
  const [game, setGame] = useState<LoadedGame | null>(null)
  const [state, setState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadGame()
      .then((loadedGame) => {
        setGame(loadedGame)
        setState(createInitialGameState(loadedGame.locations))
      })
      .catch((caughtError: unknown) => {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : 'An unknown error occurred while loading the game.',
        )
      })
  }, [])

  if (error) {
    return (
      <main>
        <h1>Could not load game</h1>
        <p>{error}</p>
      </main>
    )
  }

  if (!game || !state) {
    return (
      <main>
        <p>Loading game...</p>
      </main>
    )
  }

  return (
    <main>
      <h1>{game.manifest.title}</h1>
      <p>{game.manifest.description}</p>

      <Location
        locations={game.locations}
        state={state}
        updateState={setState}
      />
    </main>
  )
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Could not find the React root element.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)