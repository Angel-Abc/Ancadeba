import { Token, token } from '@ancadeba/utils'
import { gameStateStorageToken, IGameStateStorage } from './storage'

export interface IGameStateProvider {
  get activeSceneId(): string
  get activeMapId(): string | null
  get gameTitle(): string
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

  getFlag(flagName: string): boolean | undefined {
    return this.gameStateStorage.getFlag(flagName)
  }

  setFlag(flagName: string, value: boolean): void {
    this.gameStateStorage.setFlag(flagName, value)
  }

  get activeSceneId(): string {
    return this.gameStateStorage.activeSceneId
  }

  get activeMapId(): string | null {
    return this.gameStateStorage.activeMapId
  }

  get gameTitle(): string {
    return this.gameStateStorage.state.title
  }
}
