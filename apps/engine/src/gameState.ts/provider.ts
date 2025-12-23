import { Token, token } from '@ancadeba/utils'
import { gameStateStorageToken, IGameStateStorage } from './storage'

export interface IGameStateProvider {
  get state(): Record<string, unknown>
}

const logName = 'engine/gameState/provider'
export const gameStateProviderToken = token<IGameStateProvider>(logName)
export const gameStateProviderDependencies: Token<unknown>[] = [
  gameStateStorageToken,
]
export class GameStateProvider implements IGameStateProvider {
  constructor(private readonly gameStateStorage: IGameStateStorage) {}

  get state(): Record<string, unknown> {
    // TODO: return a readonly proxy (?)
    return this.gameStateStorage.state
  }
}
