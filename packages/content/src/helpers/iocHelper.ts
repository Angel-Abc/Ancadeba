import { Container } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../configuration/tokens'
import { ResourceConfiguration } from '../configuration/resourceConfiguration'
import { gameLoaderToken } from '../loaders/tokens'
import { GameLoader, gameLoaderDependencies } from '../loaders/gameLoader'

export function registerServices(
  container: Container,
  resourcesDataPath: string,
): void {
  container.registerAll([
    {
      token: resourceConfigurationToken,
      useFactory: () => new ResourceConfiguration(resourcesDataPath),
      deps: [],
      scope: 'singleton',
    },
    {
      token: gameLoaderToken,
      useClass: GameLoader,
      deps: gameLoaderDependencies,
      scope: 'singleton',
    },
  ])
}
