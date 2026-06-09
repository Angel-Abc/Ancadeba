import type { IRegistrar } from '@ancadeba/utils'
import {
  gameDefinitionProviderToken,
  languageDefinitionProviderToken,
  mapDefinitionProviderToken,
  newGameDefinitionProviderToken,
  surfaceDefinitionProviderToken,
  tileSetDefinitionProviderToken,
  translationProviderToken,
  widgetDefinitionProviderToken,
} from '../providers/definition/tokens'
import {
  GameDefinitionProvider,
  gameDefinitionProviderDependencies,
} from '../providers/definition/gameDefinitionProvider'
import {
  gameSessionStorageToken,
  surfaceDataStorageToken,
} from '../storage/data/tokens'
import {
  SurfaceDataStorage,
  surfaceDataStorageDependencies,
} from '../storage/data/surfaceDataStorage'
import {
  gameSessionProviderToken,
  surfaceDataProviderToken,
} from '../providers/data/tokens'
import {
  SurfaceDataProvider,
  surfaceDataProviderDependencies,
} from '../providers/data/surfaceDataProvider'
import {
  GameSessionStorage,
  gameSessionStorageDependencies,
} from '../storage/data/gameSessionStorage'
import {
  GameSessionProvider,
  gameSessionProviderDependencies,
} from '../providers/data/gameSessionProvider'
import {
  SurfaceDefinitionProvider,
  surfaceDefinitionProviderDependencies,
} from '../providers/definition/surfaceDefinitionProvider'
import {
  WidgetDefinitionProvider,
  widgetDefinitionProviderDependencies,
} from '../providers/definition/widgetDefinitionProvider'
import {
  NewGameDefinitionProvider,
  newGameDefinitionProviderDependencies,
} from '../providers/definition/newGameDefinitionProvider'
import {
  MapDefinitionProvider,
  mapDefinitionProviderDependencies,
} from '../providers/definition/mapDefinitionProvider'
import {
  TileSetDefinitionProvider,
  tileSetDefinitionProviderDependencies,
} from '../providers/definition/tileSetDefinitionProvider'
import {
  LanguageDefinitionProvider,
  languageDefinitionProviderDependencies,
} from '../providers/definition/languageDefinitionProvider'
import {
  TranslationProvider,
  translationProviderDependencies,
} from '../providers/definition/translationProvider'
import {
  bootstrapEngineToken,
  bootstrapFinalizerToken,
  bootstrapGameDataToken,
} from '../bootstrap/tokens'
import {
  BootstrapEngine,
  bootstrapEngineDependencies,
} from '../bootstrap/bootstrapEngine'
import {
  bootstrapBootSurfaceToken,
  bootstrapGameDefinitionToken,
} from '../bootstrap/tokens'
import {
  BootstrapBootSurface,
  bootstrapBootSurfaceDependencies,
} from '../bootstrap/bootstrapBootSurface'
import {
  BootstrapGameDefinition,
  bootstrapGameDefinitionDependencies,
} from '../bootstrap/bootstrapGameDefinition'
import { uiReadySignalToken, UIReadySignal } from '../signals/UIReadySignal'
import {
  GameStyleLoader,
  gameStyleLoaderDependencies,
} from '../styling/gameStyleLoader'
import { gameStyleLoaderToken } from '../styling/tokens'
import {
  BootstrapGameData,
  bootstrapGameDataDependencies,
} from '../bootstrap/bootstrapGameData'
import {
  BootstrapFinalizer,
  bootstrapFinalizerDependencies,
} from '../bootstrap/bootstrapFinalizer'
import {
  gameActionExecutorToken,
  gameActionEnvironmentToken,
} from '../actions/tokens'
import {
  GameActionExecutor,
  gameActionExecutorDependencies,
} from '../actions/gameActionExecutor'
import { BrowserGameActionEnvironment } from '../actions/browserGameActionEnvironment'

export function registerServices(container: IRegistrar): void {
  container.registerAll([
    {
      token: gameDefinitionProviderToken,
      useClass: GameDefinitionProvider,
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
      useClass: SurfaceDataStorage,
      deps: surfaceDataStorageDependencies,
      scope: 'singleton',
    },
    {
      token: gameSessionStorageToken,
      useClass: GameSessionStorage,
      deps: gameSessionStorageDependencies,
      scope: 'singleton',
    },
    {
      token: surfaceDataProviderToken,
      useClass: SurfaceDataProvider,
      deps: surfaceDataProviderDependencies,
      scope: 'transient',
    },
    {
      token: gameSessionProviderToken,
      useClass: GameSessionProvider,
      deps: gameSessionProviderDependencies,
      scope: 'transient',
    },
    {
      token: widgetDefinitionProviderToken,
      useClass: WidgetDefinitionProvider,
      deps: widgetDefinitionProviderDependencies,
      scope: 'singleton',
    },
    {
      token: newGameDefinitionProviderToken,
      useClass: NewGameDefinitionProvider,
      deps: newGameDefinitionProviderDependencies,
      scope: 'singleton',
    },
    {
      token: mapDefinitionProviderToken,
      useClass: MapDefinitionProvider,
      deps: mapDefinitionProviderDependencies,
      scope: 'singleton',
    },
    {
      token: tileSetDefinitionProviderToken,
      useClass: TileSetDefinitionProvider,
      deps: tileSetDefinitionProviderDependencies,
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
    {
      token: gameStyleLoaderToken,
      useClass: GameStyleLoader,
      deps: gameStyleLoaderDependencies,
      scope: 'singleton',
    },
    {
      token: uiReadySignalToken,
      useClass: UIReadySignal,
      deps: [],
      scope: 'singleton',
    },
    {
      token: gameActionEnvironmentToken,
      useClass: BrowserGameActionEnvironment,
      deps: [],
      scope: 'singleton',
    },
    {
      token: gameActionExecutorToken,
      useClass: GameActionExecutor,
      deps: gameActionExecutorDependencies,
      scope: 'singleton',
    },
    {
      token: bootstrapGameDefinitionToken,
      useClass: BootstrapGameDefinition,
      deps: bootstrapGameDefinitionDependencies,
      scope: 'singleton',
    },
    {
      token: bootstrapBootSurfaceToken,
      useClass: BootstrapBootSurface,
      deps: bootstrapBootSurfaceDependencies,
      scope: 'singleton',
    },
    {
      token: bootstrapEngineToken,
      useClass: BootstrapEngine,
      deps: bootstrapEngineDependencies,
      scope: 'singleton',
    },
    {
      token: bootstrapGameDataToken,
      useClass: BootstrapGameData,
      deps: bootstrapGameDataDependencies,
      scope: 'singleton',
    },
    {
      token: bootstrapFinalizerToken,
      useClass: BootstrapFinalizer,
      deps: bootstrapFinalizerDependencies,
      scope: 'singleton',
    },
  ])
}
