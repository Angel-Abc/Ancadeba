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

export function registerServices(container: Container): void {
  container.register({
    token: gameEngineToken,
    useClass: GameEngine,
    deps: gameEngineDependencies,
  })
  container.register({
    token: engineMessageBusToken,
    useClass: EngineMessageBus,
    deps: engineMessageBusDependencies,
  })
}
