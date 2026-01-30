import { type Container } from '@ancadeba/utils'
import { resourcesConfigurationToken } from '../configuration/tokens'
import { gameLoaderToken, surfaceLoaderToken } from '../loaders/tokens'
import { GameLoader, gameLoaderDependencies } from '../loaders/GameLoader'
import {
  SurfaceLoader,
  surfaceLoaderDependencies,
} from '../loaders/SurfaceLoader'
import { ResourcesConfiguration } from '../configuration/ResourcesConfiguration'

export function registerServices(
  container: Container,
  resourcesDataPath: string,
): void {
  container.registerAll([
    {
      token: resourcesConfigurationToken,
      useValue: new ResourcesConfiguration(resourcesDataPath),
      scope: 'singleton',
    },
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
