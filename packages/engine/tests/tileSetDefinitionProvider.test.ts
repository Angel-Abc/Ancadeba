import { describe, expect, it, vi } from 'vitest'
import type { ITileSetLoader, TileSet } from '@ancadeba/content'
import type { ILogger } from '@ancadeba/utils'
import type { IGameDefinitionProvider } from '../src/providers/definition/types'
import { TileSetDefinitionProvider } from '../src/providers/definition/tileSetDefinitionProvider'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

function createTileSet(): TileSet {
  return {
    id: 'outdoor',
    tiles: [
      {
        id: 'grass',
        description: 'tile.outdoor.grass',
        color: 'lightgreen',
        walkable: true,
      },
    ],
  }
}

describe('tile set definition provider', () => {
  it('loads tile sets by ID and caches the result', async () => {
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
        tileSets: { outdoor: 'tileSets/outdoor.json' },
      })),
    }
    const tileSet = createTileSet()
    const tileSetLoader: ITileSetLoader = {
      loadTileSet: vi.fn(async () => tileSet),
    }
    const provider = new TileSetDefinitionProvider(
      createLogger(),
      gameDefinitionProvider,
      tileSetLoader,
    )

    // Act
    const firstResult = await provider.getTileSetDefinition('outdoor')
    const secondResult = await provider.getTileSetDefinition('outdoor')

    // Assert
    expect(firstResult).toBe(tileSet)
    expect(secondResult).toBe(tileSet)
    expect(tileSetLoader.loadTileSet).toHaveBeenCalledTimes(1)
    expect(tileSetLoader.loadTileSet).toHaveBeenCalledWith(
      'tileSets/outdoor.json',
    )
  })

  it('throws when the tile set ID is missing from the game definition', async () => {
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
    const tileSetLoader: ITileSetLoader = {
      loadTileSet: vi.fn(async () => createTileSet()),
    }
    const provider = new TileSetDefinitionProvider(
      logger,
      gameDefinitionProvider,
      tileSetLoader,
    )

    // Act
    const resultPromise = provider.getTileSetDefinition('missing')

    // Assert
    await expect(resultPromise).rejects.toThrow(
      'Tile set with ID {0} not found in game definition.',
    )
    expect(tileSetLoader.loadTileSet).not.toHaveBeenCalled()
  })
})
