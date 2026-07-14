import { useEffect, useState } from 'react'
import type { GameState } from '@angelabc/ancadeba-core'
import {
  createInitialGameState,
  followExit,
  takeItem,
} from '@angelabc/ancadeba-core'
import type { RuntimeGameContent } from '@angelabc/ancadeba-content'
import { loadGame } from './loadGame'
import { CurrentLocationView } from './currentLocationView'
import { CurrentInventory } from './currentInventory'

export function App() {
  const [game, setGame] = useState<RuntimeGameContent | null>(null)
  const [state, setState] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadGame()
      .then((loadedGame) => {
        setGame(loadedGame)
        setState(createInitialGameState(loadedGame))
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
      <h1>{game.title}</h1>
      <p>{game.description}</p>

      <CurrentLocationView
        gameContent={game}
        state={state}
        onExitSelected={(exitId) => {
          const newState = followExit(game, state, exitId)
          setState(newState)
        }}
        onItemTaken={(itemId) => {
          const newState = takeItem(game, state, itemId)
          setState(newState)
        }}
      />
      <CurrentInventory gameContent={game} state={state} />
    </main>
  )
}
