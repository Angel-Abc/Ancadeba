import { Game } from '../schemas/game'
import { Scene } from '../schemas/scene'
import { TileSet } from '../schemas/tileSet'

export interface GameData {
  meta: Game
  scenes: Scene[]
  tileSets: TileSet[]
}
