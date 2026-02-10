import { Container } from '@ancadeba/utils'
import { WidgetRegistry } from '../registries/widgetRegistry'
import { SurfaceRegistry } from '../registries/surfaceRegistry'
import {
  widgetRegistryToken,
  surfaceRegistryToken,
} from '../registries/tokens'

export function registerServices(container: Container): void {
  container.register({
    token: widgetRegistryToken,
    useClass: WidgetRegistry,
    deps: [],
    scope: 'singleton',
  })

  container.register({
    token: surfaceRegistryToken,
    useClass: SurfaceRegistry,
    deps: [],
    scope: 'singleton',
  })
}
