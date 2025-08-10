import type { Action } from './action'

export type MapTile = {
    key: string
    tile: string
    onEnter?: Action
}

export interface SquaresMap {
    key: string
    type: 'squares-map'
    width: number
    height: number
    tileSets: string[]
    tiles: Record<string, MapTile>
    map: string[][]
}

export type GameMap = SquaresMap
