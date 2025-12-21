import { Container } from '@ancadeba/utils'
import {
  GameEngine,
  gameEngineDependencies,
  gameEngineToken,
} from '../core/gameEngine'

export function registerServices(container: Container): void {
  container.register({
    token: gameEngineToken,
    useClass: GameEngine,
    deps: gameEngineDependencies,
  })
}
