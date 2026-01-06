import { Container, loggerToken } from '@ancadeba/utils'
import {
  GameEngine,
  gameEngineDependencies,
  gameEngineToken,
} from '../core/gameEngine'
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
} from '../gameState.ts/storage'
import {
  ResourceDataProvider,
  resourceDataProviderDependencies,
  resourceDataProviderToken,
} from '../resourceData/provider'
import {
  ResourceDataStorage,
  resourceDataStorageDependencies,
  resourceDataStorageToken,
} from '../resourceData/storage'
import {
  ConditionResolver,
  conditionResolverDependencies,
  conditionResolverToken,
} from '../core/conditionResolver'
import {
  BrowserAdapter,
  browserAdapterDependencies,
  browserAdapterToken,
} from '../system/browserAdapter'
import {
  ComponentRegistry,
  componentRegistryToken,
} from '../App/Controls/componentRegistry'
import { registerComponents } from '../App/Controls/registerComponents'
import { SwitchSceneActionHandler } from '../core/actionHandlers/SwitchSceneActionHandler'
import { ExitGameActionHandler } from '../core/actionHandlers/ExitGameActionHandler'
import { SetFlagActionHandler } from '../core/actionHandlers/SetFlagActionHandler'
import { BackActionHandler } from '../core/actionHandlers/BackActionHandler'
import { VolumeActionHandler } from '../core/actionHandlers/VolumeActionHandler'
import { IActionHandler } from '../core/actionHandlers/types'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: gameEngineToken,
      useClass: GameEngine,
      deps: gameEngineDependencies,
    },
    {
      token: gameDataInitializerToken,
      useClass: GameDataInitializer,
      deps: gameDataInitializerDependencies,
    },
    {
      token: actionExecutorToken,
      useFactory: (container) => {
        const logger = container.resolve(loggerToken)
        const messageBus = container.resolve(engineMessageBusToken)
        const gameStateManager = container.resolve(gameStateManagerToken)
        const browserAdapter = container.resolve(browserAdapterToken)

        const handlers: IActionHandler[] = [
          new SwitchSceneActionHandler(gameStateManager),
          new ExitGameActionHandler(browserAdapter),
          new SetFlagActionHandler(gameStateManager),
          new BackActionHandler(gameStateManager),
          new VolumeActionHandler(),
        ]

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
      token: resourceDataProviderToken,
      useClass: ResourceDataProvider,
      deps: resourceDataProviderDependencies,
    },
    {
      token: resourceDataStorageToken,
      useClass: ResourceDataStorage,
      deps: resourceDataStorageDependencies,
      scope: 'singleton',
    },
    {
      token: conditionResolverToken,
      useClass: ConditionResolver,
      deps: conditionResolverDependencies,
    },
    {
      token: browserAdapterToken,
      useClass: BrowserAdapter,
      deps: browserAdapterDependencies,
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
  ])
}
