import type { Actions } from './action'

/**
 * Tile instance placed on a map grid.
 *
 * @property key     Unique identifier for this tile instance.
 * @property tile    Reference to a {@link Tile} key.
 * @property onEnter Optional action executed when the player enters the tile.
 */
export type MapTile = {
    key: string
    tile: string
    onEnter?: Actions
    onExit?: Actions
}

/**
 * Two-dimensional map composed of square tiles.
 *
 * @property key      Identifier for the map.
 * @property type     Discriminator for the map type, always `'squares-map'`.
 * @property width    Number of columns in the map.
 * @property height   Number of rows in the map.
 * @property tileSets List of tile set identifiers used by the map.
 * @property tiles    Mapping of tile instance ids to {@link MapTile} definitions.
 * @property map      2D array representing layout of tile instance ids.
 */
export interface SquaresMap {
    key: string
    type: 'squares-map'
    width: number
    height: number
    tileSets: string[]
    tiles: Record<string, MapTile>
    map: string[][]
}

/**
 * Coordinate on a map grid.
 *
 * @property x Horizontal position in tiles.
 * @property y Vertical position in tiles.
 */
export interface Position {
    x: number
    y: number
}

/** Union type of all supported map definitions. */
export type GameMap = SquaresMap
