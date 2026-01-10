import { Game } from '../schemas/game'
import { Map as MapData } from '../schemas/map'
import { Scene } from '../schemas/scene'
import { TileSet } from '../schemas/tileSet'

export interface GameData {
  meta: Game
  languages: Map<string, { name: string; files: string[] }>
  scenes: Scene[]
  tileSets: TileSet[]
  maps: MapData[]
}
