import type { GameMap as GameMapData, MapTile as MapTileData } from '@loader/data/map'
import { type GameMap, type MapTile } from '@loader/schema/map'
import { mapAction } from './action'


export function mapGameMap(gameMap: GameMap): GameMapData {
    switch(gameMap.type){
        case 'squares-map':
            return {
                key: gameMap.key,
                type: 'squares-map',
                width: gameMap.width,
                height: gameMap.height,
                tileSets: gameMap.tileSets,
                tiles: mapMapTiles(gameMap.tiles),
                map: mapMap(gameMap.map)
            }
    }
}

export function mapMapTile(mapTile: MapTile): MapTileData {
    return {
        key: mapTile.key,
        tile: mapTile.tile,
        onEnter: mapTile.onEnter ? mapAction(mapTile.onEnter) : undefined
    }
}

export function mapMapTiles(mapTiles: MapTile[]): Record<string, MapTileData> {
    const result: Record<string, MapTileData> = {}
    mapTiles.forEach(m => {
        const mapTile = mapMapTile(m)
        result[m.key] = mapTile
    })
    return result
}

export function mapMap(map: string[]): string[][] {
    return map.map(row => row.split(','))
}
