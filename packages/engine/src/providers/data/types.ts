import { GameSession } from '../../storage/data/types'

export interface ISurfaceDataProvider {
  get surfaceId(): string
}

export interface IGameSessionProvider {
  get session(): GameSession
}
