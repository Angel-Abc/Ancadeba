import { Container } from '@ancadeba/utils'
import { WidgetRegistry } from '../registries/widgetRegistry'
import { LayoutRegistry } from '../registries/layoutRegistry'
import {
  widgetRegistryToken,
  layoutRegistryToken,
} from '../registries/tokens'

export function registerServices(container: Container): void {
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
