import { Game } from '../schemas/game'
import { Scene } from '../schemas/scene'

export interface GameData {
  meta: Game
  scenes: Scene[]
}
