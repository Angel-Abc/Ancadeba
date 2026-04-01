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
    const component: WidgetComponent<'button-bar'> = () => null

    // Act
    registry.register('button-bar', component)
    const resolved = registry.get('button-bar')

    // Assert
    expect(resolved).toBe(component)
    expect(registry.has('button-bar')).toBe(true)
  })

  it('resets registered widgets to support lifecycle boundaries', () => {
    // Arrange
    const registry = new WidgetRegistry()
    const component: WidgetComponent<'button-bar'> = () => null
    registry.register('button-bar', component)

    // Act
    registry.reset()

    // Assert
    expect(registry.get('button-bar')).toBeUndefined()
    expect(registry.has('button-bar')).toBe(false)
  })

  it('renders the registered button-bar component with the matching widget data', () => {
    // Arrange
    const registry = new WidgetRegistry()
    const component: WidgetComponent<'button-bar'> = ({ widget }) =>
      createElement('div', null, widget.widgetId)
    const widget: Widget = {
      widgetId: 'main-button-bar',
      type: 'button-bar',
      buttons: [
        {
          label: 'Start Game',
          action: {
            type: 'navigate',
            targetSurfaceId: 'main-menu',
          },
        },
      ],
    }
    registry.register('button-bar', component)

    // Act
    const rendered = registry.render(widget)

    // Assert
    expect(rendered).not.toBeNull()
  })

  it('renders the registered title component with the matching widget data', () => {
    // Arrange
    const registry = new WidgetRegistry()
    const component: WidgetComponent<'title'> = ({ widget }) =>
      createElement('div', null, widget.widgetId)
    const widget: Widget = {
      widgetId: 'main-title',
      type: 'title',
      title: 'GAME.TITLE',
      'font-size': 20,
    }
    registry.register('title', component)

    // Act
    const rendered = registry.render(widget)

    // Assert
    expect(rendered).not.toBeNull()
  })

  it('renders the registered progress component with the matching widget data', () => {
    // Arrange
    const registry = new WidgetRegistry()
    const component: WidgetComponent<'progress'> = ({ widget }) =>
      createElement('div', null, widget.widgetId)
    const widget: Widget = {
      widgetId: 'boot-progress',
      type: 'progress',
      showPercentage: false,
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
