import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import type { IResourceConfiguration } from '../src/configuration/types'
import { GameLoader } from '../src/loaders/gameLoader'
import { SurfaceLoader } from '../src/loaders/surfaceLoader'
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
      surfaces: { boot: 'surfaces/boot.json' },
      widgets: { progress: 'widgets/progress.json' },
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
})
