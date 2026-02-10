import { describe, expect, it, vi } from 'vitest'
import { Container, loggerToken, type ILogger } from '@ancadeba/utils'
import { registerServices } from '../src/helpers/iocHelper'
import { SurfaceRegistry } from '../src/registries/surfaceRegistry'
import { surfaceRegistryToken } from '../src/registries/tokens'
import type { SurfaceComponent } from '../src/registries/types'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

describe('engine-ui surface registry', () => {
  it('registers and resolves components by surface ID', () => {
    // Arrange
    const registry = new SurfaceRegistry()
    const component: SurfaceComponent = () => null

    // Act
    registry.register('home', component)
    const resolved = registry.get('home')

    // Assert
    expect(resolved).toBe(component)
    expect(registry.has('home')).toBe(true)
  })

  it('resets registered surfaces to support lifecycle boundaries', () => {
    // Arrange
    const registry = new SurfaceRegistry()
    const component: SurfaceComponent = () => null
    registry.register('home', component)

    // Act
    registry.reset()

    // Assert
    expect(registry.get('home')).toBeUndefined()
    expect(registry.has('home')).toBe(false)
  })

  it('registers the registry service as a singleton in IoC wiring', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)
    container.register({
      token: loggerToken,
      useValue: logger,
      scope: 'singleton',
    })
    registerServices(container)

    // Act
    const first = container.resolve(surfaceRegistryToken)
    const second = container.resolve(surfaceRegistryToken)

    // Assert
    expect(first).toBeInstanceOf(SurfaceRegistry)
    expect(first).toBe(second)
  })
})
