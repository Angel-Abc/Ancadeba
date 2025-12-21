import { Container } from '@ancadeba/utils'
import { jsonConfigurationToken } from '../loaders/configuration'
import {
  GameDataLoader,
  gameDataLoaderDependencies,
  gameDataLoaderToken,
} from '../loaders/gameDataLoader'

export function registerServices(container: Container, rootPath: string): void {
  container.register({
    token: jsonConfigurationToken,
    useValue: { rootPath },
  })
  container.register({
    token: gameDataLoaderToken,
    useClass: GameDataLoader,
    deps: gameDataLoaderDependencies,
  })
}
