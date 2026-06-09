import { describe, expect, it, vi } from 'vitest'
import type { IGameActionEnvironment } from '../src/actions/types'
import { GameActionExecutor } from '../src/actions/gameActionExecutor'
import type { INewGameDefinitionProvider } from '../src/providers/definition/types'
import type {
  GameSession,
  IGameSessionStorage,
  ISurfaceDataStorage,
} from '../src/storage/data/types'

function createSurfaceDataStorage(): ISurfaceDataStorage {
  let currentSurfaceId: string | null = null

  return {
    set surfaceId(value: string) {
      currentSurfaceId = value
    },
    get surfaceId(): string {
      return currentSurfaceId ?? ''
    },
    get currentSurfaceId(): string | null {
      return currentSurfaceId
    },
  }
}

function createEnvironment(): IGameActionEnvironment {
  return {
    close: vi.fn(),
  }
}

function createGameSessionStorage(): IGameSessionStorage {
  let currentSession: GameSession | null = null

  return {
    set session(value: GameSession) {
      currentSession = value
    },
    get session(): GameSession {
      return currentSession!
    },
    get currentSession(): GameSession | null {
      return currentSession
    },
  }
}

function createNewGameDefinitionProvider(): INewGameDefinitionProvider {
  return {
    getNewGameDefinition: vi.fn(async () => ({
      id: 'default',
      startSurfaceId: 'game',
      mapId: 'start-beach',
      player: {
        position: {
          row: 19,
          column: 2,
        },
      },
    })),
  }
}

describe('game action executor', () => {
  it('navigates to the target surface', async () => {
    // Arrange
    const surfaceDataStorage = createSurfaceDataStorage()
    const executor = new GameActionExecutor(
      surfaceDataStorage,
      createGameSessionStorage(),
      createNewGameDefinitionProvider(),
      createEnvironment(),
    )

    // Act
    await executor.execute({
      type: 'navigate',
      targetSurfaceId: 'game-surface',
    })

    // Assert
    expect(surfaceDataStorage.currentSurfaceId).toBe('game-surface')
  })

  it('delegates exit actions to the environment', async () => {
    // Arrange
    const environment = createEnvironment()
    const executor = new GameActionExecutor(
      createSurfaceDataStorage(),
      createGameSessionStorage(),
      createNewGameDefinitionProvider(),
      environment,
    )

    // Act
    await executor.execute({
      type: 'exit',
    })

    // Assert
    expect(environment.close).toHaveBeenCalledOnce()
  })

  it('initializes a session and navigates when starting a new game', async () => {
    // Arrange
    const surfaceDataStorage = createSurfaceDataStorage()
    const gameSessionStorage = createGameSessionStorage()
    const newGameDefinitionProvider = createNewGameDefinitionProvider()
    const executor = new GameActionExecutor(
      surfaceDataStorage,
      gameSessionStorage,
      newGameDefinitionProvider,
      createEnvironment(),
    )

    // Act
    await executor.execute({
      type: 'new-game',
      newGameId: 'default',
    })

    // Assert
    expect(newGameDefinitionProvider.getNewGameDefinition).toHaveBeenCalledWith(
      'default',
    )
    expect(gameSessionStorage.currentSession).toEqual({
      newGameId: 'default',
      mapId: 'start-beach',
      player: {
        position: {
          row: 19,
          column: 2,
        },
      },
    })
    expect(surfaceDataStorage.currentSurfaceId).toBe('game')
  })
})
