import {
  parseGameManifest,
  parseLocationsFile,
  type GameManifest,
  type LocationsFile,
} from '@angelabc/ancadeba-content'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

interface LoadedGame {
  manifest: GameManifest
  locations: LocationsFile
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Could not find the React root element.')
}

const root = createRoot(rootElement)

root.render(
  <StrictMode>
    <main>
      <p>Loading game…</p>
    </main>
  </StrictMode>,
)

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

  return {
    manifest,
    locations,
  }
}

async function start(): Promise<void> {
  try {
    const game = await loadGame()

    root.render(
      <StrictMode>
        <main>
          <h1>{game.manifest.title}</h1>
          <p>{game.manifest.description}</p>

          <h2>Locations</h2>

          {game.locations.locations.map((location) => (
            <section key={location.id}>
              <h3>{location.name}</h3>
              <p>{location.description}</p>
            </section>
          ))}
        </main>
      </StrictMode>,
    )
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while loading the game.'

    root.render(
      <StrictMode>
        <main>
          <h1>Could not load game</h1>
          <p>{message}</p>
        </main>
      </StrictMode>,
    )
  }
}

void start()
