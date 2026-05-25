import { describe, expect, it, vi } from 'vitest'
import type { GameMap, IMapLoader } from '@ancadeba/content'
import type { ILogger } from '@ancadeba/utils'
import type { IGameDefinitionProvider } from '../src/providers/definition/types'
import { MapDefinitionProvider } from '../src/providers/definition/mapDefinitionProvider'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

function createMap(): GameMap {
  return {
    id: 'start-beach',
    width: 1,
    height: 1,
    tiles: [
      {
        key: 'g1',
        tile: 'outdoor.grass',
      },
    ],
    map: ['g1'],
  }
}

describe('map definition provider', () => {
  it('loads maps by ID and caches the result', async () => {
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
        maps: { 'start-beach': 'maps/start-beach.json' },
      })),
    }
    const map = createMap()
    const mapLoader: IMapLoader = {
      loadMap: vi.fn(async () => map),
    }
    const provider = new MapDefinitionProvider(
      createLogger(),
      gameDefinitionProvider,
      mapLoader,
    )

    // Act
    const firstResult = await provider.getMapDefinition('start-beach')
    const secondResult = await provider.getMapDefinition('start-beach')

    // Assert
    expect(firstResult).toBe(map)
    expect(secondResult).toBe(map)
    expect(mapLoader.loadMap).toHaveBeenCalledTimes(1)
    expect(mapLoader.loadMap).toHaveBeenCalledWith('maps/start-beach.json')
  })

  it('throws when the map ID is missing from the game definition', async () => {
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
    const mapLoader: IMapLoader = {
      loadMap: vi.fn(async () => createMap()),
    }
    const provider = new MapDefinitionProvider(
      logger,
      gameDefinitionProvider,
      mapLoader,
    )

    // Act
    const resultPromise = provider.getMapDefinition('missing')

    // Assert
    await expect(resultPromise).rejects.toThrow(
      'Map with ID {0} not found in game definition.',
    )
    expect(mapLoader.loadMap).not.toHaveBeenCalled()
  })
})
