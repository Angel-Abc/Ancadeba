import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IResourceConfiguration } from '../src/configuration/types'
import { GameLoader } from '../src/loaders/gameLoader'
import { MapLoader } from '../src/loaders/mapLoader'
import { NewGameLoader } from '../src/loaders/newGameLoader'
import { SurfaceLoader } from '../src/loaders/surfaceLoader'
import { TileSetLoader } from '../src/loaders/tileSetLoader'
import { WidgetLoader } from '../src/loaders/widgetLoader'

type LoggerMocks = {
  logger: ILogger
  errorMock: ReturnType<typeof vi.fn>
}

function createLoggerMocks(): LoggerMocks {
  const debugMock = vi.fn(() => 'debug')
  const infoMock = vi.fn(() => 'info')
  const warnMock = vi.fn(() => 'warn')
  const errorMock = vi.fn(() => 'error')

  return {
    logger: {
      debug: debugMock,
      info: infoMock,
      warn: warnMock,
      error: errorMock,
    },
    errorMock,
  }
}

const resourceConfiguration: IResourceConfiguration = {
  resourcePath: '/resources',
}

describe('content loaders', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads the game definition from the expected path', async () => {
    // Arrange
    const { logger } = createLoggerMocks()
    const game = {
      title: 'Test Game',
      version: '1.0.0',
      bootSurfaceId: 'boot',
      language: 'en',
      styles: ['styles/theme.css'],
      surfaces: { boot: 'surfaces/boot.json' },
      widgets: { progress: 'widgets/progress.json' },
      maps: { start: 'maps/start.json' },
      tileSets: { outdoor: 'tileSets/outdoor.json' },
      languages: { en: ['languages/en.json'] },
    }
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => game,
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new GameLoader(logger, resourceConfiguration)

    // Act
    const result = await loader.loadGame()

    // Assert
    expect(fetchMock).toHaveBeenCalledWith('/resources/game.json')
    expect(result).toEqual(game)
  })

  it('throws when the game JSON does not match the schema', async () => {
    // Arrange
    const { logger, errorMock } = createLoggerMocks()
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        title: 'Test Game',
        version: '1.0.0',
        bootSurfaceId: 'boot',
        language: 'en',
        styles: 'styles/theme.css',
        surfaces: { boot: 'surfaces/boot.json' },
        widgets: { progress: 'widgets/progress.json' },
        languages: { en: ['languages/en.json'] },
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new GameLoader(logger, resourceConfiguration)

    // Act
    const resultPromise = loader.loadGame()

    // Assert
    await expect(resultPromise).rejects.toThrow('error')
    expect(errorMock).toHaveBeenCalledWith(
      'utils/utils/loadJsonResource',
      'Schema validation failed for resource {0} with error {1}',
      '/resources/game.json',
      expect.any(String),
    )
  })

  it('throws when the surface file cannot be fetched', async () => {
    // Arrange
    const { logger, errorMock } = createLoggerMocks()
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new SurfaceLoader(logger, resourceConfiguration)

    // Act
    const resultPromise = loader.loadSurface('surfaces/missing.json')

    // Assert
    await expect(resultPromise).rejects.toThrow('error')
    expect(errorMock).toHaveBeenCalledWith(
      'utils/utils/loadJsonResource',
      'Failed to fetch resource {0} with response {1}',
      '/resources/surfaces/missing.json',
      expect.any(Object),
    )
  })

  it('throws when the widget JSON does not match the schema', async () => {
    // Arrange
    const { logger, errorMock } = createLoggerMocks()
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        widgetId: 'widget-1',
        requires: [],
        type: 'unknown',
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new WidgetLoader(logger, resourceConfiguration)

    // Act
    const resultPromise = loader.loadWidget('widgets/widget-1.json')

    // Assert
    await expect(resultPromise).rejects.toThrow('error')
    expect(errorMock).toHaveBeenCalledWith(
      'utils/utils/loadJsonResource',
      'Schema validation failed for resource {0} with error {1}',
      '/resources/widgets/widget-1.json',
      expect.any(String),
    )
  })

  it('loads maps from the expected path', async () => {
    // Arrange
    const { logger } = createLoggerMocks()
    const map = {
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
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => map,
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new MapLoader(logger, resourceConfiguration)

    // Act
    const result = await loader.loadMap('maps/start-beach.json')

    // Assert
    expect(fetchMock).toHaveBeenCalledWith('/resources/maps/start-beach.json')
    expect(result).toEqual(map)
  })

  it('loads new games from the expected path', async () => {
    // Arrange
    const { logger } = createLoggerMocks()
    const newGame = {
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
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => newGame,
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new NewGameLoader(logger, resourceConfiguration)

    // Act
    const result = await loader.loadNewGame('newGames/default.json')

    // Assert
    expect(fetchMock).toHaveBeenCalledWith('/resources/newGames/default.json')
    expect(result).toEqual(newGame)
  })

  it('loads tile sets from the expected path', async () => {
    // Arrange
    const { logger } = createLoggerMocks()
    const tileSet = {
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
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => tileSet,
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new TileSetLoader(logger, resourceConfiguration)

    // Act
    const result = await loader.loadTileSet('tileSets/outdoor.json')

    // Assert
    expect(fetchMock).toHaveBeenCalledWith('/resources/tileSets/outdoor.json')
    expect(result).toEqual(tileSet)
  })

  it('throws when the map file cannot be fetched', async () => {
    // Arrange
    const { logger, errorMock } = createLoggerMocks()
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({}),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new MapLoader(logger, resourceConfiguration)

    // Act
    const resultPromise = loader.loadMap('maps/missing.json')

    // Assert
    await expect(resultPromise).rejects.toThrow('error')
    expect(errorMock).toHaveBeenCalledWith(
      'utils/utils/loadJsonResource',
      'Failed to fetch resource {0} with response {1}',
      '/resources/maps/missing.json',
      expect.any(Object),
    )
  })

  it('throws when the tile set JSON does not match the schema', async () => {
    // Arrange
    const { logger, errorMock } = createLoggerMocks()
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        id: 'outdoor',
        tiles: [
          {
            id: 'grass',
            description: 'tile.outdoor.grass',
            color: 'lightgreen',
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const loader = new TileSetLoader(logger, resourceConfiguration)

    // Act
    const resultPromise = loader.loadTileSet('tileSets/outdoor.json')

    // Assert
    await expect(resultPromise).rejects.toThrow('error')
    expect(errorMock).toHaveBeenCalledWith(
      'utils/utils/loadJsonResource',
      'Schema validation failed for resource {0} with error {1}',
      '/resources/tileSets/outdoor.json',
      expect.any(String),
    )
  })
})
