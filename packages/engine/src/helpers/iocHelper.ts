import { Container } from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  languageDefinitionProviderToken,
  surfaceDefinitionProviderToken,
  translationProviderToken,
  widgetDefinitionProviderToken,
} from '../providers/definition/tokens'
import {
  gameDefinitionProvider,
  gameDefinitionProviderDependencies,
} from '../providers/definition/gameDefinitionProvider'
import { surfaceDataStorageToken } from '../storage/data/tokens'
import {
  surfaceDataStorage,
  surfaceDataStorageDependencies,
} from '../storage/data/surfaceDataStorage'
import { surfaceDataProviderToken } from '../providers/data/tokens'
import {
  SurfaceDataProvider,
  surfaceDataProviderDependencies,
} from '../providers/data/surfaceDataProvider'
import {
  SurfaceDefinitionProvider,
  surfaceDefinitionProviderDependencies,
} from '../providers/definition/surfaceDefinitionProvider'
import {
  WidgetDefinitionProvider,
  widgetDefinitionProviderDependencies,
} from '../providers/definition/widgetDefinitionProvider'
import {
  LanguageDefinitionProvider,
  languageDefinitionProviderDependencies,
} from '../providers/definition/languageDefinitionProvider'
import {
  TranslationProvider,
  translationProviderDependencies,
} from '../providers/definition/translationProvider'

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
    {
      token: languageDefinitionProviderToken,
      useClass: LanguageDefinitionProvider,
      deps: languageDefinitionProviderDependencies,
      scope: 'singleton',
    },
    {
      token: translationProviderToken,
      useClass: TranslationProvider,
      deps: translationProviderDependencies,
      scope: 'transient',
    },
  ])
}
