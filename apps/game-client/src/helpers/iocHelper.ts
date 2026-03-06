import {
  registerServices as registerEngineUiServices,
} from '@ancadeba/engine-ui'
import type { IRegistrar } from '@ancadeba/utils'

export function registerServices(container: IRegistrar): void {
  container.registerAll([])
  registerEngineUiServices(container)
}
