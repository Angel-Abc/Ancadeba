import { describe, expect, it, vi } from 'vitest'
import {
  type ILogger,
  type IMessageBus,
  Container,
  loggerToken,
  messageBusToken,
} from '@ancadeba/utils'
import {
  type IGameLoader,
  type ISurfaceLoader,
  type IWidgetLoader,
  gameLoaderToken,
  surfaceLoaderToken,
  widgetLoaderToken,
} from '@ancadeba/content'
import {
  type IGameDefinitionProvider,
  type ISurfaceDefinitionProvider,
  type IWidgetDefinitionProvider,
  gameDefinitionProviderToken,
  registerServices,
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
} from '../src'

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

describe('engine smoke', () => {
  it('resolves core definition providers through container wiring', async () => {
    // Arrange
    const logger = createLogger()
    const messageBus = createMessageBus()
    const gameLoader: IGameLoader = {
      loadGame: vi.fn(async () => ({
        title: 'Test Game',
        version: '1.0.0',
        bootSurfaceId: 'boot',
        surfaces: { boot: 'surfaces/boot.json' },
        widgets: { progress: 'widgets/progress.json' },
      })),
    }
    const surfaceLoader: ISurfaceLoader = {
      loadSurface: vi.fn(async () => ({
        surfaceId: 'boot',
        requires: [],
        layout: {
          type: 'grid',
          rows: 1,
          columns: 1,
          widgets: [],
        },
      })),
    }
    const widgetLoader: IWidgetLoader = {
      loadWidget: vi.fn(async () => ({
        widgetId: 'progress',
        requires: [],
        type: 'progress',
      })),
    }
    const container = new Container(logger)
    container.registerAll([
      { token: loggerToken, useValue: logger, scope: 'singleton' },
      { token: messageBusToken, useValue: messageBus, scope: 'singleton' },
      { token: gameLoaderToken, useValue: gameLoader, scope: 'singleton' },
      { token: surfaceLoaderToken, useValue: surfaceLoader, scope: 'singleton' },
      { token: widgetLoaderToken, useValue: widgetLoader, scope: 'singleton' },
    ])
    registerServices(container)

    // Act
    const gameProvider =
      container.resolve<IGameDefinitionProvider>(gameDefinitionProviderToken)
    const surfaceProvider =
      container.resolve<ISurfaceDefinitionProvider>(surfaceDefinitionProviderToken)
    const widgetProvider =
      container.resolve<IWidgetDefinitionProvider>(widgetDefinitionProviderToken)
    const gameA = await gameProvider.getGameDefinition()
    const gameB = await gameProvider.getGameDefinition()
    const surface = await surfaceProvider.getSurfaceDefinition('boot')
    const widget = await widgetProvider.getWidgetDefinition('progress')

    // Assert
    expect(gameProvider).toBe(
      container.resolve<IGameDefinitionProvider>(gameDefinitionProviderToken),
    )
    expect(surfaceProvider).toBe(
      container.resolve<ISurfaceDefinitionProvider>(surfaceDefinitionProviderToken),
    )
    expect(widgetProvider).toBe(
      container.resolve<IWidgetDefinitionProvider>(widgetDefinitionProviderToken),
    )
    expect(gameA).toBe(gameB)
    expect(surface.surfaceId).toBe('boot')
    expect(widget.widgetId).toBe('progress')
    expect(gameLoader.loadGame).toHaveBeenCalledTimes(1)
  })
})
