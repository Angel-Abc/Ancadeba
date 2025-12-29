import { Token, token } from '@ancadeba/utils'
import { gameStateStorageToken, IGameStateStorage } from './storage'
import { GameState } from './types'

export interface IGameStateProvider {
  get state(): GameState
  getFlag(flagName: string): boolean | undefined
  setFlag(flagName: string, value: boolean): void
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

  getFlag(flagName: string): boolean | undefined {
    return this.gameStateStorage.getFlag(flagName)
  }

  setFlag(flagName: string, value: boolean): void {
    this.gameStateStorage.setFlag(flagName, value)
  }
}
