import { describe, expect, it, vi } from 'vitest'
import { Container, loggerToken, type ILogger } from '@ancadeba/utils'
import { registerServices } from '../src/helpers/iocHelper'
import { LayoutRegistry } from '../src/registries/layoutRegistry'
import { layoutRegistryToken } from '../src/registries/tokens'
import type { LayoutComponent } from '../src/registries/types'

function createLogger(): ILogger {
  return {
    debug: vi.fn((_category, message) => message),
    info: vi.fn((_category, message) => message),
    warn: vi.fn((_category, message) => message),
    error: vi.fn((_category, message) => message),
  }
}

describe('engine-ui layout registry', () => {
  it('registers and resolves components by layout type', () => {
    // Arrange
    const registry = new LayoutRegistry()
    const component: LayoutComponent = () => null

    // Act
    registry.register('grid', component)
    const resolved = registry.get('grid')

    // Assert
    expect(resolved).toBe(component)
    expect(registry.has('grid')).toBe(true)
  })

  it('resets registered layouts to support lifecycle boundaries', () => {
    // Arrange
    const registry = new LayoutRegistry()
    const component: LayoutComponent = () => null
    registry.register('grid', component)

    // Act
    registry.reset()

    // Assert
    expect(registry.get('grid')).toBeUndefined()
    expect(registry.has('grid')).toBe(false)
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
    const first = container.resolve(layoutRegistryToken)
    const second = container.resolve(layoutRegistryToken)

    // Assert
    expect(first).toBeInstanceOf(LayoutRegistry)
    expect(first).toBe(second)
  })
})
