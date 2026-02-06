import { Container } from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  surfaceDefinitionProviderToken,
  widgetDefinitionProviderToken,
} from '../definitionProviders/tokens'
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
import {
  SurfaceDefinitionProvider,
  surfaceDefinitionProviderDependencies,
} from '../definitionProviders/surfaceDefinitionProvider'
import {
  WidgetDefinitionProvider,
  widgetDefinitionProviderDependencies,
} from '../definitionProviders/widgetDefinitionProvider'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: gameDefinitionProviderToken,
      useClass: gameDefinitionProvider,
      deps: gameDefinitionProviderDependencies,
      scope: 'singleton',
    },
    {
      token: surfaceDefinitionProviderToken,
      useClass: SurfaceDefinitionProvider,
      deps: surfaceDefinitionProviderDependencies,
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
    {
      token: widgetDefinitionProviderToken,
      useClass: WidgetDefinitionProvider,
      deps: widgetDefinitionProviderDependencies,
      scope: 'singleton',
    },
  ])
}
