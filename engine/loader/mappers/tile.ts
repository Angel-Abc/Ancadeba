import type { Tile as TileData } from '@loader/data/tile'
import { type Tile as SchemaTile } from '@loader/schema/tile'

export function mapTile(prefix: string, tile: SchemaTile): TileData {
    return {
        key: tile.key,
        description: tile.description,
        color: tile.color,
        image: tile.image ? `${prefix}/${tile.image}` : undefined
    }
}
