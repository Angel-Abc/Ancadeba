import { Game } from '../schemas/game'

export interface IGameLoader {
  loadGame(): Promise<Game>
}
