import { describe, expect, it, vi } from 'vitest'
import type { Widget } from '@ancadeba/content'
import { Container, loggerToken, type ILogger } from '@ancadeba/utils'
import { createElement } from 'react'
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
  it('registers and resolves components by widget type', () => {
    // Arrange
    const registry = new WidgetRegistry()
    const component: WidgetComponent<'progress'> = () => null

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
    const component: WidgetComponent<'progress'> = () => null
    registry.register('progress', component)

    // Act
    registry.reset()

    // Assert
    expect(registry.get('progress')).toBeUndefined()
    expect(registry.has('progress')).toBe(false)
  })

  it('renders the registered component with the matching widget data', () => {
    // Arrange
    const registry = new WidgetRegistry()
    const component: WidgetComponent<'progress'> = ({ widget }) =>
      createElement('div', null, widget.widgetId)
    const widget: Widget = {
      widgetId: 'boot-progress',
      type: 'progress',
      requires: [],
    }
    registry.register('progress', component)

    // Act
    const rendered = registry.render(widget)

    // Assert
    expect(rendered).not.toBeNull()
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
