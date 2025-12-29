import { Token, token } from '@ancadeba/utils'
import { GameState } from './types'

export interface IGameStateStorage {
  update(value: Partial<GameState>): void

  set state(value: GameState)
  get state(): GameState

  getFlag(flagName: string): boolean | undefined
  setFlag(flagName: string, value: boolean): void
}

const logName = 'engine/gameState/storage'
export const gameStateStorageToken = token<IGameStateStorage>(logName)
export const gameStateStorageDependencies: Token<unknown>[] = []
export class GameStateStorage implements IGameStateStorage {
  private gameState: GameState = {
    activeScene: '',
    title: '',
    flags: {},
  }
  constructor() {}
  public update(value: Partial<GameState>): void {
    this.gameState = {
      ...this.gameState,
      ...value,
    }
  }
  set state(value: GameState) {
    this.gameState = value
  }

  get state(): GameState {
    return this.gameState
  }

  getFlag(flagName: string): boolean | undefined {
    return this.gameState.flags[flagName]
  }

  setFlag(flagName: string, value: boolean): void {
    this.update({
      flags: {
        ...this.gameState.flags,
        [flagName]: value,
      },
    })
  }
}
