import { Token, token } from '@ancadeba/utils'
import { gameStateStorageToken, IGameStateStorage } from './storage'
import { GameState } from './types'

export interface IGameStateProvider {
  get state(): GameState
}

const logName = 'engine/gameState/provider'
export const gameStateProviderToken = token<IGameStateProvider>(logName)
export const gameStateProviderDependencies: Token<unknown>[] = [
  gameStateStorageToken,
]
export class GameStateProvider implements IGameStateProvider {
  constructor(private readonly gameStateStorage: IGameStateStorage) {}

  get state(): GameState {
    // TODO: return a readonly proxy (?)
    return this.gameStateStorage.state
  }
}
