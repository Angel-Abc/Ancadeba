import { Container } from '@ancadeba/utils'
import { jsonConfigurationToken } from '../loaders/configuration'
import {
  GameDataLoader,
  gameDataLoaderDependencies,
  gameDataLoaderToken,
} from '../loaders/gameDataLoader'

export function registerServices(container: Container, rootPath: string): void {
  container.registerAll([
    {
      token: jsonConfigurationToken,
      useValue: { rootPath },
    },
    {
      token: gameDataLoaderToken,
      useClass: GameDataLoader,
      deps: gameDataLoaderDependencies,
    },
  ])
}
