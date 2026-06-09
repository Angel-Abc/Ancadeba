import type { IRegistrar } from '@ancadeba/utils'
import { resourceConfigurationToken } from '../configuration/tokens'
import { ResourceConfiguration } from '../configuration/resourceConfiguration'
import {
  gameLoaderToken,
  languageLoaderToken,
  mapLoaderToken,
  newGameLoaderToken,
  surfaceLoaderToken,
  tileSetLoaderToken,
  widgetLoaderToken,
} from '../loaders/tokens'
import { GameLoader, gameLoaderDependencies } from '../loaders/gameLoader'
import {
  SurfaceLoader,
  surfaceLoaderDependencies,
} from '../loaders/surfaceLoader'
import { WidgetLoader, widgetLoaderDependencies } from '../loaders/widgetLoader'
import {
  NewGameLoader,
  newGameLoaderDependencies,
} from '../loaders/newGameLoader'
import {
  LanguageLoader,
  languageLoaderDependencies,
} from '../loaders/languageLoader'
import { MapLoader, mapLoaderDependencies } from '../loaders/mapLoader'
import {
  TileSetLoader,
  tileSetLoaderDependencies,
} from '../loaders/tileSetLoader'

export function registerServices(
  container: IRegistrar,
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
    {
      token: surfaceLoaderToken,
      useClass: SurfaceLoader,
      deps: surfaceLoaderDependencies,
      scope: 'singleton',
    },
    {
      token: widgetLoaderToken,
      useClass: WidgetLoader,
      deps: widgetLoaderDependencies,
      scope: 'singleton',
    },
    {
      token: newGameLoaderToken,
      useClass: NewGameLoader,
      deps: newGameLoaderDependencies,
      scope: 'singleton',
    },
    {
      token: languageLoaderToken,
      useClass: LanguageLoader,
      deps: languageLoaderDependencies,
      scope: 'singleton',
    },
    {
      token: mapLoaderToken,
      useClass: MapLoader,
      deps: mapLoaderDependencies,
      scope: 'singleton',
    },
    {
      token: tileSetLoaderToken,
      useClass: TileSetLoader,
      deps: tileSetLoaderDependencies,
      scope: 'singleton',
    },
  ])
}
