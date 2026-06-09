import { describe, expect, it, vi } from 'vitest'
import type { INewGameLoader, NewGame } from '@ancadeba/content'
import type { ILogger } from '@ancadeba/utils'
import type { IGameDefinitionProvider } from '../src/providers/definition/types'
import { NewGameDefinitionProvider } from '../src/providers/definition/newGameDefinitionProvider'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

function createNewGame(): NewGame {
  return {
    id: 'default',
    startSurfaceId: 'game',
    mapId: 'start-beach',
    player: {
      position: {
        row: 19,
        column: 2,
      },
    },
  }
}

describe('new game definition provider', () => {
  it('loads new games by ID and caches the result', async () => {
    // Arrange
    const gameDefinitionProvider: IGameDefinitionProvider = {
      getGameDefinition: vi.fn(async () => ({
        title: 'GAME.TITLE',
        version: '1.0.0',
        bootSurfaceId: 'boot-loader',
        language: 'en',
        languages: { en: ['languages/en/engine.json'] },
        surfaces: { 'boot-loader': 'surfaces/boot-loader.json' },
        widgets: { 'boot-progress': 'widgets/boot-progress.json' },
        newGames: { default: 'newGames/default.json' },
      })),
    }
    const newGame = createNewGame()
    const newGameLoader: INewGameLoader = {
      loadNewGame: vi.fn(async () => newGame),
    }
    const provider = new NewGameDefinitionProvider(
      createLogger(),
      gameDefinitionProvider,
      newGameLoader,
    )

    // Act
    const firstResult = await provider.getNewGameDefinition('default')
    const secondResult = await provider.getNewGameDefinition('default')

    // Assert
    expect(firstResult).toBe(newGame)
    expect(secondResult).toBe(newGame)
    expect(newGameLoader.loadNewGame).toHaveBeenCalledTimes(1)
    expect(newGameLoader.loadNewGame).toHaveBeenCalledWith(
      'newGames/default.json',
    )
  })

  it('throws when the new game ID is missing from the game definition', async () => {
    // Arrange
    const logger = createLogger()
    const gameDefinitionProvider: IGameDefinitionProvider = {
      getGameDefinition: vi.fn(async () => ({
        title: 'GAME.TITLE',
        version: '1.0.0',
        bootSurfaceId: 'boot-loader',
        language: 'en',
        languages: { en: ['languages/en/engine.json'] },
        surfaces: { 'boot-loader': 'surfaces/boot-loader.json' },
        widgets: { 'boot-progress': 'widgets/boot-progress.json' },
      })),
    }
    const newGameLoader: INewGameLoader = {
      loadNewGame: vi.fn(async () => createNewGame()),
    }
    const provider = new NewGameDefinitionProvider(
      logger,
      gameDefinitionProvider,
      newGameLoader,
    )

    // Act
    const resultPromise = provider.getNewGameDefinition('missing')

    // Assert
    await expect(resultPromise).rejects.toThrow(
      'New game with ID {0} not found in game definition.',
    )
    expect(newGameLoader.loadNewGame).not.toHaveBeenCalled()
  })
})
