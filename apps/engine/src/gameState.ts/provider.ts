import { InputRange } from '@ancadeba/schemas'
import { Token, token } from '@ancadeba/utils'
import {
  gameStateReaderToken,
  flagStorageToken,
  IGameStateReader,
  IFlagStorage,
  IValueStorage,
} from './storage'

export interface IGameStateProvider {
  get activeSceneId(): string
  get activeMapId(): string | null
  get mapPosition(): { x: number; y: number } | undefined
  get gameTitle(): string
  get inputRanges(): InputRange | undefined
  getFlag(flagName: string): boolean | undefined
  getValue(name: string): string | undefined
}

const logName = 'engine/gameState/provider'
export const gameStateProviderToken = token<IGameStateProvider>(logName)
export const gameStateProviderDependencies: Token<unknown>[] = [
  gameStateReaderToken,
  flagStorageToken,
]
export class GameStateProvider implements IGameStateProvider {
  constructor(
    private readonly gameStateStorage: IGameStateReader &
      IFlagStorage &
      IValueStorage
  ) {}

  getFlag(flagName: string): boolean | undefined {
    return this.gameStateStorage.getFlag(flagName)
  }

  getValue(name: string): string | undefined {
    return this.gameStateStorage.getValue(name)
  }

  get activeSceneId(): string {
    return this.gameStateStorage.activeSceneId
  }

  get activeMapId(): string | null {
    return this.gameStateStorage.activeMapId
  }

  get mapPosition(): { x: number; y: number } | undefined {
    return this.gameStateStorage.state.mapPosition
  }

  get gameTitle(): string {
    return this.gameStateStorage.state.title
  }

  get inputRanges(): InputRange | undefined {
    return this.gameStateStorage.state.inputRanges
  }
}
