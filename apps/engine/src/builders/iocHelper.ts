import { Container } from '@ancadeba/utils'
import {
  GameEngine,
  gameEngineDependencies,
  gameEngineToken,
} from '../core/gameEngine'
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
  GameStateStorage,
  gameStateStorageDependencies,
  gameStateStorageToken,
} from '../gameState.ts/storage'
import {
  ResourceDataProvider,
  resourceDataProviderDependencies,
  resourceDataProviderToken,
} from '../resourceData/provider'

export function registerServices(container: Container): void {
  container.registerAll([
    {
      token: gameEngineToken,
      useClass: GameEngine,
      deps: gameEngineDependencies,
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
      token: gameStateStorageToken,
      useClass: GameStateStorage,
      deps: gameStateStorageDependencies,
      scope: 'singleton',
    },
    {
      token: resourceDataProviderToken,
      useClass: ResourceDataProvider,
      deps: resourceDataProviderDependencies,
      scope: 'singleton',
    },
  ])
}
