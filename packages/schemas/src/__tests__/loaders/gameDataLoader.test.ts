import { describe, expect, it, vi } from 'vitest'
import type { ILogger } from '@ancadeba/utils'
import { loadJsonResource } from '@ancadeba/utils'
import { GameDataLoader } from '../../loaders/gameDataLoader'
import { gameSchema } from '../../schemas/game'
import { sceneSchema } from '../../schemas/scene'
import { tileSetSchema } from '../../schemas/tileSet'

vi.mock('@ancadeba/utils', async () => {
  const actual = await vi.importActual<typeof import('@ancadeba/utils')>(
    '@ancadeba/utils'
  )
  return { ...actual, loadJsonResource: vi.fn() }
})

describe('loaders/gameDataLoader', () => {
  it('loads game.json and scene files and returns combined game data', async () => {
    // Arrange
    const logger: ILogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(() => {
        throw new Error('fatal')
      }),
    }
    const config = { rootPath: '/data' }
    const game = {
      id: 'game-1',
      name: 'Test Game',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      title: 'Test Game',
      description: 'Test Description',
      version: '1.0.0',
      initialState: {
        scene: 'intro',
      },
      scenes: ['intro'],
      tileSets: ['outdoor'],
    }
    const scene = {
      id: 'scene-1',
      name: 'Intro',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      screen: {
        type: 'grid',
        grid: {
          rows: 1,
          columns: 1,
        },
      },
      components: [],
      initialState: {
        settings: {
          volume: 50,
          difficulty: 'normal',
        },
      },
    }
    const tileSet = {
      id: 'tileset-1',
      name: 'Outdoor',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
      tiles: [
        {
          id: 'tile-1',
          walkable: true,
        },
      ],
    }
    const loader = new GameDataLoader(logger, config)
    const mockedLoadJsonResource = vi.mocked(loadJsonResource)
    mockedLoadJsonResource
      .mockResolvedValueOnce(game)
      .mockResolvedValueOnce(scene)
      .mockResolvedValueOnce(tileSet)

    // Act
    const result = await loader.loadGameData()

    // Assert
    expect(mockedLoadJsonResource).toHaveBeenNthCalledWith(
      1,
      '/data/game.json',
      gameSchema,
      logger
    )
    expect(mockedLoadJsonResource).toHaveBeenNthCalledWith(
      2,
      '/data/scenes/intro.json',
      sceneSchema,
      logger
    )
    expect(mockedLoadJsonResource).toHaveBeenNthCalledWith(
      3,
      '/data/tileSets/outdoor.json',
      tileSetSchema,
      logger
    )
    expect(result).toEqual({ meta: game, scenes: [scene], tileSets: [tileSet] })
  })
})
