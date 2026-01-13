import { Game } from '../schemas/game'
import { Map as MapData } from '../schemas/map'
import { Scene } from '../schemas/scene'
import { TileSet } from '../schemas/tileSet'
import { VirtualKeys } from '../schemas/virtualKeys'
import { VirtualInputs } from '../schemas/virtualInputs'
import { Item } from '../schemas/item'

export interface GameData {
  meta: Game
  languages: Map<string, { name: string; files: string[] }>
  virtualKeys: VirtualKeys
  virtualInputs: VirtualInputs
  scenes: Scene[]
  tileSets: TileSet[]
  maps: MapData[]
  items: Item[]
}
