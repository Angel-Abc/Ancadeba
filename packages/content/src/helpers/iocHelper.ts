import { type Container } from '@ancadeba/utils'
import { gameLoaderToken, surfaceLoaderToken } from '../loaders/types'
import { GameLoader, gameLoaderDependencies } from '../loaders/GameLoader'
import {
  SurfaceLoader,
  surfaceLoaderDependencies,
} from '../loaders/SurfaceLoader'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: gameLoaderToken,
      useClass: GameLoader,
      deps: gameLoaderDependencies,
      scope: 'singleton',
    },
    {
      token: surfaceLoaderToken,
      useClass: SurfaceLoader,
      deps: surfaceLoaderDependencies,
      scope: 'singleton',
    },
  ])
}
