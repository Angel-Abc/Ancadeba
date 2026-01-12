import {
  Container,
  KeyboardListener,
  keyboardListenerDependencies,
  keyboardListenerToken,
  loggerToken,
} from '@ancadeba/utils'
import {
  GameEngine,
  gameEngineDependencies,
  gameEngineToken,
} from '../core/gameEngine'
import {
  LifecycleCoordinator,
  lifecycleCoordinatorToken,
} from '../core/lifecycleCoordinator'
import {
  GameDataInitializer,
  gameDataInitializerDependencies,
  gameDataInitializerToken,
} from '../core/gameDataInitializer'
import { ActionExecutor, actionExecutorToken } from '../core/actionExecutor'
import {
  EngineMessageBus,
  engineMessageBusDependencies,
  engineMessageBusToken,
} from '../system/engineMessageBus'
import { UIReadySignal, uiReadySignalToken } from '../system/uiReadySignal'
import {
  GameStateProvider,
  gameStateProviderDependencies,
  gameStateProviderToken,
} from '../gameState.ts/provider'
import {
  GameStateManager,
  gameStateManagerDependencies,
  gameStateManagerToken,
} from '../gameState.ts/manager'
import {
  GameStateStorage,
  gameStateStorageDependencies,
  gameStateStorageToken,
  gameStateReaderToken,
  gameStateMutatorToken,
  flagStorageToken,
} from '../gameState.ts/storage'
import {
  ResourceDataProvider,
  resourceDataProviderDependencies,
  resourceDataProviderToken,
} from '../resourceData/provider'
import {
  SceneDataStorage,
  sceneDataStorageDependencies,
  sceneDataStorageToken,
} from '../resourceData/sceneDataStorage'
import {
  TileDataStorage,
  tileDataStorageDependencies,
  tileDataStorageToken,
} from '../resourceData/tileDataStorage'
import {
  MapDataStorage,
  mapDataStorageDependencies,
  mapDataStorageToken,
} from '../resourceData/mapDataStorage'
import {
  AssetFileStorage,
  assetFileStorageDependencies,
  cssFileStorageToken,
  languageFileStorageToken,
} from '../resourceData/assetFileStorage'
import {
  VirtualInputConfigStorage,
  virtualInputConfigStorageDependencies,
  virtualKeyStorageToken,
  virtualInputStorageToken,
} from '../resourceData/virtualInputConfigStorage'
import {
  ResourceRootPathProvider,
  resourceRootPathProviderDependencies,
  resourceRootPathToken,
} from '../resourceData/resourceRootPathProvider'
import {
  ResourceDataLogger,
  resourceDataLoggerDependencies,
  resourceDataLoggerToken,
} from '../resourceData/resourceDataLogger'
import {
  ConditionResolver,
  conditionResolverToken,
} from '../core/conditionResolver'
import {
  InputConfigProvider,
  inputConfigProviderDependencies,
  inputConfigProviderToken,
} from '../core/inputConfigProvider'
import { conditionEvaluatorToken } from '../core/conditionEvaluators/types'
import {
  FlagConditionEvaluator,
  flagConditionEvaluatorDependencies,
} from '../core/conditionEvaluators/FlagConditionEvaluator'
import {
  CanMoveConditionEvaluator,
  canMoveConditionEvaluatorDependencies,
} from '../core/conditionEvaluators/CanMoveConditionEvaluator'
import {
  BrowserAdapter,
  browserAdapterDependencies,
  browserAdapterToken,
} from '../system/browserAdapter'
import {
  StorageAdapter,
  storageAdapterDependencies,
  storageAdapterToken,
} from '../system/storageAdapter'
import {
  ComponentRegistry,
  componentRegistryToken,
} from '../App/Controls/componentRegistry'
import { registerComponents } from '../App/Controls/registerComponents'
import { actionHandlerToken } from '../core/actionHandlers/types'
import {
  SwitchSceneActionHandler,
  switchSceneActionHandlerDependencies,
} from '../core/actionHandlers/SwitchSceneActionHandler'
import {
  ExitGameActionHandler,
  exitGameActionHandlerDependencies,
} from '../core/actionHandlers/ExitGameActionHandler'
import {
  SetFlagActionHandler,
  setFlagActionHandlerDependencies,
} from '../core/actionHandlers/SetFlagActionHandler'
import {
  BackActionHandler,
  backActionHandlerDependencies,
} from '../core/actionHandlers/BackActionHandler'
import {
  VolumeActionHandler,
  volumeActionHandlerDependencies,
} from '../core/actionHandlers/VolumeActionHandler'
import {
  SettingsStorage,
  settingsStorageDependencies,
  settingsStorageToken,
} from '../settings/storage'
import {
  SettingsProvider,
  settingsProviderDependencies,
  settingsProviderToken,
} from '../settings/provider'
import {
  LanguageLoader,
  languageLoaderDependencies,
  languageLoaderToken,
} from '../language/loader'
import {
  LanguageProvider,
  languageProviderDependencies,
  languageProviderToken,
} from '../language/provider'
import {
  LanguageStorage,
  languageStorageDependencies,
  languageStorageToken,
} from '../language/storage'
import {
  GameStateInitializer,
  gameStateInitializerDependencies,
  gameStateInitializerToken,
} from '../core/initializers/gameStateInitializer'
import {
  SceneDataInitializer,
  sceneDataInitializerDependencies,
  sceneDataInitializerToken,
} from '../core/initializers/sceneDataInitializer'
import {
  TileDataInitializer,
  tileDataInitializerDependencies,
  tileDataInitializerToken,
} from '../core/initializers/tileDataInitializer'
import {
  MapDataInitializer,
  mapDataInitializerDependencies,
  mapDataInitializerToken,
} from '../core/initializers/mapDataInitializer'
import {
  KeyboardInputService,
  keyboardInputServiceDependencies,
  keyboardInputServiceToken,
} from '../system/keyboardInputService'
import {
  VirtualKeyMapper,
  virtualKeyMapperDependencies,
  virtualKeyMapperToken,
} from '../system/virtualKeyMapper'
import {
  VirtualInputService,
  virtualInputServiceDependencies,
  virtualInputServiceToken,
} from '../system/virtualInputService'
import {
  MapPositionService,
  mapPositionServiceDependencies,
  mapPositionServiceToken,
} from '../system/mapPositionService'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: gameEngineToken,
      useClass: GameEngine,
      deps: gameEngineDependencies,
    },
    {
      token: lifecycleCoordinatorToken,
      useFactory: (container) => {
        const startables = [
          container.resolve(actionExecutorToken),
          container.resolve(keyboardListenerToken),
          container.resolve(keyboardInputServiceToken),
          container.resolve(virtualInputServiceToken),
          container.resolve(mapPositionServiceToken),
        ]
        const stoppables = [
          container.resolve(actionExecutorToken),
          container.resolve(keyboardInputServiceToken),
          container.resolve(virtualInputServiceToken),
          container.resolve(mapPositionServiceToken),
        ]
        return new LifecycleCoordinator(startables, stoppables)
      },
    },
    {
      token: gameDataInitializerToken,
      useClass: GameDataInitializer,
      deps: gameDataInitializerDependencies,
    },
    {
      token: gameStateInitializerToken,
      useClass: GameStateInitializer,
      deps: gameStateInitializerDependencies,
    },
    {
      token: sceneDataInitializerToken,
      useClass: SceneDataInitializer,
      deps: sceneDataInitializerDependencies,
    },
    {
      token: tileDataInitializerToken,
      useClass: TileDataInitializer,
      deps: tileDataInitializerDependencies,
    },
    {
      token: mapDataInitializerToken,
      useClass: MapDataInitializer,
      deps: mapDataInitializerDependencies,
    },
    {
      token: actionHandlerToken,
      useClass: SwitchSceneActionHandler,
      deps: switchSceneActionHandlerDependencies,
    },
    {
      token: actionHandlerToken,
      useClass: ExitGameActionHandler,
      deps: exitGameActionHandlerDependencies,
    },
    {
      token: actionHandlerToken,
      useClass: SetFlagActionHandler,
      deps: setFlagActionHandlerDependencies,
    },
    {
      token: actionHandlerToken,
      useClass: BackActionHandler,
      deps: backActionHandlerDependencies,
    },
    {
      token: actionHandlerToken,
      useClass: VolumeActionHandler,
      deps: volumeActionHandlerDependencies,
    },
    {
      token: actionExecutorToken,
      useFactory: (container) => {
        const logger = container.resolve(loggerToken)
        const messageBus = container.resolve(engineMessageBusToken)
        const handlers = container.resolveAll(actionHandlerToken)
        return new ActionExecutor(logger, messageBus, handlers)
      },
    },
    {
      token: engineMessageBusToken,
      useClass: EngineMessageBus,
      deps: engineMessageBusDependencies,
      scope: 'singleton',
    },
    {
      token: uiReadySignalToken,
      useClass: UIReadySignal,
      scope: 'singleton',
    },
    {
      token: gameStateProviderToken,
      useClass: GameStateProvider,
      deps: gameStateProviderDependencies,
    },
    {
      token: gameStateManagerToken,
      useClass: GameStateManager,
      deps: gameStateManagerDependencies,
    },
    {
      token: gameStateStorageToken,
      useClass: GameStateStorage,
      deps: gameStateStorageDependencies,
      scope: 'singleton',
    },
    {
      token: gameStateReaderToken,
      useFactory: (container) => container.resolve(gameStateStorageToken),
      scope: 'singleton',
    },
    {
      token: gameStateMutatorToken,
      useFactory: (container) => container.resolve(gameStateStorageToken),
      scope: 'singleton',
    },
    {
      token: flagStorageToken,
      useFactory: (container) => container.resolve(gameStateStorageToken),
      scope: 'singleton',
    },
    {
      token: resourceDataProviderToken,
      useClass: ResourceDataProvider,
      deps: resourceDataProviderDependencies,
    },
    {
      token: sceneDataStorageToken,
      useClass: SceneDataStorage,
      deps: sceneDataStorageDependencies,
      scope: 'singleton',
    },
    {
      token: tileDataStorageToken,
      useClass: TileDataStorage,
      deps: tileDataStorageDependencies,
      scope: 'singleton',
    },
    {
      token: mapDataStorageToken,
      useClass: MapDataStorage,
      deps: mapDataStorageDependencies,
      scope: 'singleton',
    },
    {
      token: cssFileStorageToken,
      useClass: AssetFileStorage,
      deps: assetFileStorageDependencies,
      scope: 'singleton',
    },
    {
      token: languageFileStorageToken,
      useFactory: (container) => container.resolve(cssFileStorageToken),
      scope: 'singleton',
    },
    {
      token: virtualKeyStorageToken,
      useClass: VirtualInputConfigStorage,
      deps: virtualInputConfigStorageDependencies,
      scope: 'singleton',
    },
    {
      token: virtualInputStorageToken,
      useFactory: (container) => container.resolve(virtualKeyStorageToken),
      scope: 'singleton',
    },
    {
      token: resourceRootPathToken,
      useClass: ResourceRootPathProvider,
      deps: resourceRootPathProviderDependencies,
      scope: 'singleton',
    },
    {
      token: resourceDataLoggerToken,
      useClass: ResourceDataLogger,
      deps: resourceDataLoggerDependencies,
      scope: 'singleton',
    },
    {
      token: conditionEvaluatorToken,
      useClass: FlagConditionEvaluator,
      deps: flagConditionEvaluatorDependencies,
    },
    {
      token: conditionEvaluatorToken,
      useClass: CanMoveConditionEvaluator,
      deps: canMoveConditionEvaluatorDependencies,
    },
    {
      token: conditionResolverToken,
      useFactory: (container) => {
        const logger = container.resolve(loggerToken)
        const evaluators = container.resolveAll(conditionEvaluatorToken)
        return new ConditionResolver(logger, evaluators)
      },
    },
    {
      token: inputConfigProviderToken,
      useClass: InputConfigProvider,
      deps: inputConfigProviderDependencies,
    },
    {
      token: browserAdapterToken,
      useClass: BrowserAdapter,
      deps: browserAdapterDependencies,
    },
    {
      token: storageAdapterToken,
      useClass: StorageAdapter,
      deps: storageAdapterDependencies,
    },
    {
      token: componentRegistryToken,
      useFactory: () => {
        const registry = new ComponentRegistry()
        registerComponents(registry)
        return registry
      },
      scope: 'singleton',
    },
    {
      token: settingsStorageToken,
      useClass: SettingsStorage,
      deps: settingsStorageDependencies,
      scope: 'singleton',
    },
    {
      token: settingsProviderToken,
      useClass: SettingsProvider,
      deps: settingsProviderDependencies,
    },
    {
      token: languageLoaderToken,
      useClass: LanguageLoader,
      deps: languageLoaderDependencies,
    },
    {
      token: languageProviderToken,
      useClass: LanguageProvider,
      deps: languageProviderDependencies,
    },
    {
      token: languageStorageToken,
      useClass: LanguageStorage,
      deps: languageStorageDependencies,
      scope: 'singleton',
    },
    {
      token: keyboardListenerToken,
      useClass: KeyboardListener,
      deps: keyboardListenerDependencies,
      scope: 'singleton',
    },
    {
      token: virtualKeyMapperToken,
      useClass: VirtualKeyMapper,
      deps: virtualKeyMapperDependencies,
    },
    {
      token: keyboardInputServiceToken,
      useClass: KeyboardInputService,
      deps: keyboardInputServiceDependencies,
      scope: 'singleton',
    },
    {
      token: virtualInputServiceToken,
      useClass: VirtualInputService,
      deps: virtualInputServiceDependencies,
      scope: 'singleton',
    },
    {
      token: mapPositionServiceToken,
      useClass: MapPositionService,
      deps: mapPositionServiceDependencies,
      scope: 'singleton',
    },
  ])
}
