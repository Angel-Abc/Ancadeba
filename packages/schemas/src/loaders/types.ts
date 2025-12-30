import { Game } from '../schemas/game'
import { Map } from '../schemas/map'
import { Scene } from '../schemas/scene'
import { TileSet } from '../schemas/tileSet'

export interface GameData {
  meta: Game
  scenes: Scene[]
  tileSets: TileSet[]
  maps: Map[]
}
