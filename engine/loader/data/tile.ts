/**
 * Definition of a single tile that can be placed on a game map.
 *
 * @property key         Unique identifier for the tile.
 * @property description Human readable description of the tile's purpose.
 * @property color       Hex or CSS color used when rendering the tile.
 * @property image       Optional asset path for a tile image.
 */
export type Tile = {
    key: string
    description: string
    color: string
    image?: string
}

/**
 * Collection of {@link Tile} definitions that share a common identifier.
 *
 * @property id    Identifier used to reference this tile set.
 * @property tiles Tiles available within the set.
 */
export type TileSet = {
    id: string
    tiles: Tile[]
}
