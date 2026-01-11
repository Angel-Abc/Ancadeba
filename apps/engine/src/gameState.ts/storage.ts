import { Token, token } from '@ancadeba/utils'
import { GameState } from './types'

export interface IGameStateReader {
  get state(): GameState
  get activeSceneId(): string
  get activeMapId(): string | null
}

export interface IGameStateMutator {
  update(value: Partial<GameState>): void
  set state(value: GameState)
}

export interface IFlagStorage {
  getFlag(flagName: string): boolean | undefined
  setFlag(flagName: string, value: boolean): void
}

// Combined interface for internal implementation only
interface IGameStateStorage
  extends IGameStateReader,
    IGameStateMutator,
    IFlagStorage {}

const logName = 'engine/gameState/storage'
export const gameStateStorageToken = token<IGameStateStorage>(logName)
export const gameStateReaderToken = token<IGameStateReader>(logName + '/reader')
export const gameStateMutatorToken = token<IGameStateMutator>(
  logName + '/mutator'
)
export const flagStorageToken = token<IFlagStorage>(logName + '/flags')
export const gameStateStorageDependencies: Token<unknown>[] = []
export class GameStateStorage implements IGameStateStorage {
  private gameState: GameState = {
    activeSceneId: '',
    activeMapId: null,
    title: '',
    flags: {},
    sceneStack: [],
    inputRanges: undefined,
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

  get activeSceneId(): string {
    return this.gameState.activeSceneId
  }

  get activeMapId(): string | null {
    return this.gameState.activeMapId
  }
}
