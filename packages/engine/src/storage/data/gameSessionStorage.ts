import {
  ILogger,
  IMessageBus,
  loggerToken,
  messageBusToken,
  Token,
} from '@ancadeba/utils'
import { GameSession, IGameSessionStorage } from './types'
import { gameSessionStorageToken } from './tokens'
import { MESSAGE_ENGINE_GAME_SESSION_CHANGED } from './messages'

export const gameSessionStorageDependencies: Token<unknown>[] = [
  loggerToken,
  messageBusToken,
]

export class GameSessionStorage implements IGameSessionStorage {
  private _session: GameSession | null = null

  constructor(
    private readonly logger: ILogger,
    private readonly messageBus: IMessageBus,
  ) {}

  set session(value: GameSession) {
    this._session = {
      newGameId: value.newGameId,
      mapId: value.mapId,
      player: {
        position: {
          row: value.player.position.row,
          column: value.player.position.column,
        },
      },
    }
    this.messageBus.publish(MESSAGE_ENGINE_GAME_SESSION_CHANGED, {
      session: this._session,
    })
  }

  get session(): GameSession {
    if (this._session === null) {
      throw new Error(
        this.logger.error(gameSessionStorageToken, 'Game session is not set'),
      )
    }

    return this._session
  }

  get currentSession(): GameSession | null {
    return this._session
  }
}
