import type { IRegistrar } from '@ancadeba/utils'
import { WidgetRegistry } from '../registries/widgetRegistry'
import { LayoutRegistry } from '../registries/layoutRegistry'
import { widgetRegistryToken, layoutRegistryToken } from '../registries/tokens'
import { LayoutComponent, WidgetComponent } from '../registries/types'

export function registerServices(container: IRegistrar): void {
  container.register({
    token: widgetRegistryToken,
    useClass: WidgetRegistry,
    deps: [],
    scope: 'singleton',
  })

  container.register({
    token: layoutRegistryToken,
    useClass: LayoutRegistry,
    deps: [],
    scope: 'singleton',
  })
}

export function registerWidgetsRegistry(
  container: IRegistrar,
  widgets: Record<string, WidgetComponent>,
): void {
  container.register({
    token: widgetRegistryToken,
    useFactory: () => {
      const registry = new WidgetRegistry(widgets)
      return registry
    },
    scope: 'singleton',
  })
}

export function registerLayoutsRegistry(
  container: IRegistrar,
  layouts: Record<string, LayoutComponent>,
): void {
  container.register({
    token: layoutRegistryToken,
    useFactory: () => {
      const registry = new LayoutRegistry(layouts)
      return registry
    },
    scope: 'singleton',
  })
}
