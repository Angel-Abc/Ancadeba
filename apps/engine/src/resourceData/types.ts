import { Tile } from '@ancadeba/schemas'

export interface MapData {
  id: string
  width: number
  height: number
  tiles: Map<string, Tile>
  squares: string[][]
}
