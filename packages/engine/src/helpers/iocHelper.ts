import { Container } from '@ancadeba/utils'
import { gameDefinitionProviderToken } from '../definitionProviders/tokens'
import {
  gameDefinitionProvider,
  gameDefinitionProviderDependencies,
} from '../definitionProviders/gameDefinitionProvider'
import { surfaceDataStorageToken } from '../dataStorage.ts/tokens'
import {
  surfaceDataStorage,
  surfaceDataStorageDependencies,
} from '../dataStorage.ts/surfaceDataStorage'
import { surfaceDataProviderToken } from '../dataProviders/tokens'
import {
  SurfaceDataProvider,
  surfaceDataProviderDependencies,
} from '../dataProviders/surfaceDataProvider'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: gameDefinitionProviderToken,
      useClass: gameDefinitionProvider,
      deps: gameDefinitionProviderDependencies,
      scope: 'singleton',
    },
    {
      token: surfaceDataStorageToken,
      useClass: surfaceDataStorage,
      deps: surfaceDataStorageDependencies,
      scope: 'singleton',
    },
    {
      token: surfaceDataProviderToken,
      useClass: SurfaceDataProvider,
      deps: surfaceDataProviderDependencies,
      scope: 'transient',
    },
  ])
}
