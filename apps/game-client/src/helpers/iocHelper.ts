import type { IRegistrar } from '@ancadeba/utils'
import { UIReadySignal, uiReadySignalToken } from '../signals/UIReadySignal'
import {
  BootLoader,
  bootLoaderDependencies,
  bootLoaderToken,
} from '../services/bootLoader'
import {
  GameInitializer,
  gameInitializerDependencies,
  gameInitializerToken,
} from '../services/gameInitializer'
import {
  BootSurfacePreloader,
  bootSurfacePreloaderDependencies,
  bootSurfacePreloaderToken,
} from '../services/bootSurfacePreloader'

export function registerServices(container: IRegistrar): void {
  container.registerAll([
    {
      token: uiReadySignalToken,
      useClass: UIReadySignal,
      deps: [],
      scope: 'singleton',
    },
    {
      token: gameInitializerToken,
      useClass: GameInitializer,
      deps: gameInitializerDependencies,
      scope: 'singleton',
    },
    {
      token: bootSurfacePreloaderToken,
      useClass: BootSurfacePreloader,
      deps: bootSurfacePreloaderDependencies,
      scope: 'singleton',
    },
    {
      token: bootLoaderToken,
      useClass: BootLoader,
      deps: bootLoaderDependencies,
      scope: 'singleton',
    },
  ])
}
