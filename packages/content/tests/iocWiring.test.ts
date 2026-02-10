import { describe, expect, it, vi } from 'vitest'
import { Container, loggerToken, type ILogger } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../src/configuration/tokens'
import { registerServices } from '../src/helpers/iocHelper'
import { gameLoaderToken, surfaceLoaderToken, widgetLoaderToken } from '../src'
import { GameLoader } from '../src/loaders/gameLoader'
import { SurfaceLoader } from '../src/loaders/surfaceLoader'
import { WidgetLoader } from '../src/loaders/widgetLoader'

function createLogger(): ILogger {
  return {
    debug: vi.fn(() => 'debug'),
    info: vi.fn(() => 'info'),
    warn: vi.fn(() => 'warn'),
    error: vi.fn(() => 'error'),
  }
}

describe('content IoC wiring', () => {
  it('registers and resolves configuration and loaders as singletons', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)
    container.register({
      token: loggerToken,
      useValue: logger,
      scope: 'singleton',
    })
    registerServices(container, '/game-data')

    // Act
    const resourceConfiguration = container.resolve(resourceConfigurationToken)
    const gameLoaderA = container.resolve(gameLoaderToken)
    const gameLoaderB = container.resolve(gameLoaderToken)
    const surfaceLoader = container.resolve(surfaceLoaderToken)
    const widgetLoader = container.resolve(widgetLoaderToken)

    // Assert
    expect(resourceConfiguration.resourcePath).toBe('/game-data')
    expect(gameLoaderA).toBeInstanceOf(GameLoader)
    expect(gameLoaderA).toBe(gameLoaderB)
    expect(surfaceLoader).toBeInstanceOf(SurfaceLoader)
    expect(widgetLoader).toBeInstanceOf(WidgetLoader)
  })
})
