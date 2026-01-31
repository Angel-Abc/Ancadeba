import { type Container } from '@ancadeba/utils'
import { widgetRegistryToken } from '../registry/tokens'
import {
  WidgetRegistry,
  widgetRegistryDependencies,
} from '../registry/WidgetRegistry'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: widgetRegistryToken,
      useClass: WidgetRegistry,
      deps: widgetRegistryDependencies,
      scope: 'singleton',
    },
  ])
}
