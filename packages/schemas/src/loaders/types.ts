import { Game } from '../schemas/game'
import { Map as MapData } from '../schemas/map'
import { Scene } from '../schemas/scene'
import { TileSet } from '../schemas/tileSet'
import { VirtualKeys } from '../schemas/virtualKeys'

export interface GameData {
  meta: Game
  languages: Map<string, { name: string; files: string[] }>
  virtualKeys: VirtualKeys
  scenes: Scene[]
  tileSets: TileSet[]
  maps: MapData[]
}
