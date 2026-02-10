import { describe, expect, it, vi } from 'vitest'
import { Container, loggerToken, type ILogger } from '@ancadeba/utils'
import { registerServices } from '../src/helpers/iocHelper'
import { GridLayoutWidgetRegistry } from '../src/registries/gridLayoutWidgetRegistry'
import { gridLayoutWidgetRegistryToken } from '../src/registries/tokens'
import type { GridLayoutWidgetComponent } from '../src/registries/types'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

describe('engine-ui grid layout widget registry', () => {
  it('registers and resolves components by widget ID', () => {
    // Arrange
    const registry = new GridLayoutWidgetRegistry()
    const component: GridLayoutWidgetComponent = () => null

    // Act
    registry.register('progress', component)
    const resolved = registry.get('progress')

    // Assert
    expect(resolved).toBe(component)
    expect(registry.has('progress')).toBe(true)
  })

  it('resets registered widgets to support lifecycle boundaries', () => {
    // Arrange
    const registry = new GridLayoutWidgetRegistry()
    const component: GridLayoutWidgetComponent = () => null
    registry.register('progress', component)

    // Act
    registry.reset()

    // Assert
    expect(registry.get('progress')).toBeUndefined()
    expect(registry.has('progress')).toBe(false)
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
    const first = container.resolve(gridLayoutWidgetRegistryToken)
    const second = container.resolve(gridLayoutWidgetRegistryToken)

    // Assert
    expect(first).toBeInstanceOf(GridLayoutWidgetRegistry)
    expect(first).toBe(second)
  })
})
