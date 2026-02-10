import { Container } from '@ancadeba/utils'
import { GridLayoutWidgetRegistry } from '../registries/gridLayoutWidgetRegistry'
import { gridLayoutWidgetRegistryToken } from '../registries/tokens'

export function registerServices(container: Container): void {
  container.register({
    token: gridLayoutWidgetRegistryToken,
    useClass: GridLayoutWidgetRegistry,
    deps: [],
    scope: 'singleton',
  })
}
