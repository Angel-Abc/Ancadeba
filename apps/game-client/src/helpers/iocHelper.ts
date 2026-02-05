import { Container } from '@ancadeba/utils'
import { UIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'
import {
  BootLoader,
  bootLoaderDependencies,
  bootLoaderToken,
} from '../services/bootLoader'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: bootLoaderToken,
      useClass: BootLoader,
      deps: bootLoaderDependencies,
      scope: 'singleton',
    },
    {
      token: uiReadySignalToken,
      useClass: UIReadySignal,
      deps: [],
      scope: 'singleton',
    },
  ])
}
