import type { Tile as TileData, TileSet as TileSetData } from '@loader/data/tile'
import { type Tile as SchemaTile, type TileSet as tileSetSchema } from '@loader/schema/tile'

export function mapTile(prefix: string, tile: SchemaTile): TileData {
    return {
        key: tile.key,
        description: tile.description,
        color: tile.color,
        image: tile.image ? `${prefix}/${tile.image}` : undefined
    }
}

export function mapTileSet(prefix: string, tileSet: tileSetSchema): TileSetData {
    return {
        id: tileSet.id,
        tiles: tileSet.tiles.map(tile => mapTile(prefix, tile))
    }
}
