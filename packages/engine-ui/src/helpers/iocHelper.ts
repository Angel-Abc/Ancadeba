import type { IRegistrar } from '@ancadeba/utils'
import { WidgetRegistry } from '../registries/widgetRegistry'
import { LayoutRegistry } from '../registries/layoutRegistry'
import { widgetRegistryToken, layoutRegistryToken } from '../registries/tokens'
import type {
  LayoutRegistryEntries,
  WidgetRegistryEntries,
} from '../registries/types'
import { knownWidgets } from './registerWidgetHelper'
import { knownLayouts } from './registerLayoutHelper'

export function registerServices(container: IRegistrar): void {
  registerWidgetsRegistry(container, knownWidgets)
  registerLayoutsRegistry(container, knownLayouts)
}

export function registerWidgetsRegistry(
  container: IRegistrar,
  widgets: WidgetRegistryEntries,
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
  layouts: LayoutRegistryEntries,
): void {
  console.log('Registering layouts:', Object.keys(layouts))
  container.register({
    token: layoutRegistryToken,
    useFactory: () => {
      const registry = new LayoutRegistry(layouts)
      return registry
    },
    scope: 'singleton',
  })
}
