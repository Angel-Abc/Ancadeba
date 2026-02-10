import { describe, expect, it, vi } from 'vitest'
import { Container, loggerToken, type ILogger } from '@ancadeba/utils'
import { registerServices } from '../src/helpers/iocHelper'
import { WidgetRegistry } from '../src/registries/widgetRegistry'
import { widgetRegistryToken } from '../src/registries/tokens'
import type { WidgetComponent } from '../src/registries/types'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

describe('engine-ui widget registry', () => {
  it('registers and resolves components by widget ID', () => {
    // Arrange
    const registry = new WidgetRegistry()
    const component: WidgetComponent = () => null

    // Act
    registry.register('progress', component)
    const resolved = registry.get('progress')

    // Assert
    expect(resolved).toBe(component)
    expect(registry.has('progress')).toBe(true)
  })

  it('resets registered widgets to support lifecycle boundaries', () => {
    // Arrange
    const registry = new WidgetRegistry()
    const component: WidgetComponent = () => null
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
    const first = container.resolve(widgetRegistryToken)
    const second = container.resolve(widgetRegistryToken)

    // Assert
    expect(first).toBeInstanceOf(WidgetRegistry)
    expect(first).toBe(second)
  })
})
