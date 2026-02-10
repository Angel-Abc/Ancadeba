import { Container } from '@ancadeba/utils'
import { WidgetRegistry } from '../registries/widgetRegistry'
import { widgetRegistryToken } from '../registries/tokens'

export function registerServices(container: Container): void {
  container.register({
    token: widgetRegistryToken,
    useClass: WidgetRegistry,
    deps: [],
    scope: 'singleton',
  })
}
