import {
  knownLayouts,
  knownWidgets,
  registerLayoutsRegistry,
  registerWidgetsRegistry,
} from '@ancadeba/engine-ui'
import type { IRegistrar } from '@ancadeba/utils'

export function registerServices(container: IRegistrar): void {
  container.registerAll([])
  registerWidgetsRegistry(container, knownWidgets)
  registerLayoutsRegistry(container, knownLayouts)
}
