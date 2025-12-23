import { Token, token } from '@ancadeba/utils'

export interface IGameStateStorage {
  update(value: Record<string, unknown>): void

  set state(value: Record<string, unknown>)
  get state(): Record<string, unknown>
}

const logName = 'engine/gameState/storage'
export const gameStateStorageToken = token<IGameStateStorage>(logName)
export const gameStateStorageDependencies: Token<unknown>[] = []
export class GameStateStorage implements IGameStateStorage {
  private gameState: Record<string, unknown> = {}
  constructor() {}
  public update(value: Record<string, unknown>): void {
    this.gameState = {
      ...this.gameState,
      ...value,
    }
  }
  set state(value: Record<string, unknown>) {
    this.gameState = value
  }

  get state(): Record<string, unknown> {
    return this.gameState
  }
}
