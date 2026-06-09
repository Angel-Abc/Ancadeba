export const MESSAGE_ENGINE_SURFACE_DATA_CHANGED = 'engine/surfaceDataChanged'
export const MESSAGE_ENGINE_GAME_SESSION_CHANGED = 'engine/gameSessionChanged'

export interface IEngineSurfaceDataChangedPayload {
  surfaceId: string
}

export interface IEngineGameSessionChangedPayload {
  session: {
    newGameId: string
    mapId: string
    player: {
      position: {
        row: number
        column: number
      }
    }
  }
}
