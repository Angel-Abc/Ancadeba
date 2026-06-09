import { Token } from '@ancadeba/utils'
import { IGameSessionProvider } from './types'
import { gameSessionStorageToken } from '../../storage/data/tokens'
import { GameSession, IGameSessionStorage } from '../../storage/data/types'

export const gameSessionProviderDependencies: Token<unknown>[] = [
  gameSessionStorageToken,
]

export class GameSessionProvider implements IGameSessionProvider {
  constructor(private readonly gameSessionStorage: IGameSessionStorage) {}

  get session(): GameSession {
    return this.gameSessionStorage.session
  }
}
