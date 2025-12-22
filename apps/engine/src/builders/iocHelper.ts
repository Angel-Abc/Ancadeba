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
  ])
}
