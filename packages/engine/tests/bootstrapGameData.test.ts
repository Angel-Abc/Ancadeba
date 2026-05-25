import { describe, expect, it, vi } from 'vitest'
import type { Game } from '@ancadeba/content'
import type { ILogger, IMessageBus } from '@ancadeba/utils'
import { BootstrapGameData } from '../src/bootstrap/bootstrapGameData'
import type {
  IMapDefinitionProvider,
  ISurfaceDefinitionProvider,
  ITileSetDefinitionProvider,
  IWidgetDefinitionProvider,
} from '../src/providers/definition/types'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

function createMessageBus(): IMessageBus {
  return {
    publish: vi.fn(),
    subscribe: vi.fn(() => () => undefined),
  }
}

function createBaseGame(): Game {
  return {
    title: 'GAME.TITLE',
    version: '1.0.0',
    bootSurfaceId: 'boot-loader',
    language: 'en',
    languages: { en: ['languages/en/engine.json'] },
    surfaces: { 'boot-loader': 'surfaces/boot-loader.json' },
    widgets: { 'boot-progress': 'widgets/boot-progress.json' },
  }
}

describe('bootstrap game data', () => {
  it('preloads maps and tile sets when they are declared', async () => {
    // Arrange
    const surfaceDefinitionProvider: ISurfaceDefinitionProvider = {
      getSurfaceDefinition: vi.fn(async () => ({
        surfaceId: 'boot-loader',
        layout: { type: 'grid', rows: 1, columns: 1, widgets: [] },
      })),
    }
    const widgetDefinitionProvider: IWidgetDefinitionProvider = {
      getWidgetDefinition: vi.fn(async () => ({
        widgetId: 'boot-progress',
        type: 'progress',
        showPercentage: false,
      })),
    }
    const mapDefinitionProvider: IMapDefinitionProvider = {
      getMapDefinition: vi.fn(async () => ({
        id: 'start-beach',
        width: 1,
        height: 1,
        tiles: [{ key: 'g1', tile: 'outdoor.grass' }],
        map: ['g1'],
      })),
    }
    const tileSetDefinitionProvider: ITileSetDefinitionProvider = {
      getTileSetDefinition: vi.fn(async () => ({
        id: 'outdoor',
        tiles: [
          {
            id: 'grass',
            description: 'tile.outdoor.grass',
            color: 'lightgreen',
            walkable: true,
          },
        ],
      })),
    }
    const bootstrapGameData = new BootstrapGameData(
      createLogger(),
      surfaceDefinitionProvider,
      widgetDefinitionProvider,
      mapDefinitionProvider,
      tileSetDefinitionProvider,
      createMessageBus(),
    )
    const game = {
      ...createBaseGame(),
      maps: { 'start-beach': 'maps/start-beach.json' },
      tileSets: { outdoor: 'tileSets/outdoor.json' },
    }

    // Act
    await bootstrapGameData.execute(game)

    // Assert
    expect(mapDefinitionProvider.getMapDefinition).toHaveBeenCalledWith(
      'start-beach',
    )
    expect(tileSetDefinitionProvider.getTileSetDefinition).toHaveBeenCalledWith(
      'outdoor',
    )
  })

  it('skips map and tile set preloading when they are omitted', async () => {
    // Arrange
    const surfaceDefinitionProvider: ISurfaceDefinitionProvider = {
      getSurfaceDefinition: vi.fn(async () => ({
        surfaceId: 'boot-loader',
        layout: { type: 'grid', rows: 1, columns: 1, widgets: [] },
      })),
    }
    const widgetDefinitionProvider: IWidgetDefinitionProvider = {
      getWidgetDefinition: vi.fn(async () => ({
        widgetId: 'boot-progress',
        type: 'progress',
        showPercentage: false,
      })),
    }
    const mapDefinitionProvider: IMapDefinitionProvider = {
      getMapDefinition: vi.fn(),
    }
    const tileSetDefinitionProvider: ITileSetDefinitionProvider = {
      getTileSetDefinition: vi.fn(),
    }
    const bootstrapGameData = new BootstrapGameData(
      createLogger(),
      surfaceDefinitionProvider,
      widgetDefinitionProvider,
      mapDefinitionProvider,
      tileSetDefinitionProvider,
      createMessageBus(),
    )

    // Act
    await bootstrapGameData.execute(createBaseGame())

    // Assert
    expect(mapDefinitionProvider.getMapDefinition).not.toHaveBeenCalled()
    expect(tileSetDefinitionProvider.getTileSetDefinition).not.toHaveBeenCalled()
  })
})
