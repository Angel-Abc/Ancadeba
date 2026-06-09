export interface GameSession {
  newGameId: string
  mapId: string
  player: {
    position: {
      row: number
      column: number
    }
  }
}

export interface ISurfaceDataStorage {
  set surfaceId(value: string)
  get surfaceId(): string
  get currentSurfaceId(): string | null
}

export interface IGameSessionStorage {
  set session(value: GameSession)
  get session(): GameSession
  get currentSession(): GameSession | null
}
