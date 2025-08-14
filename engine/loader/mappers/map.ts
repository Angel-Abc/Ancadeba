import type { GameMap as GameMapData, MapTile as MapTileData } from '@loader/data/map'
import { type GameMap, type MapTile } from '@loader/schema/map'
import { fatalError } from '@utils/logMessage'
import { mapAction } from './action'

const logName = 'mapGameMap'


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
        default:
            // Guard against unrecognized map schema types
            fatalError(logName, 'Unsupported map type: {0}', (gameMap as { type: string }).type)
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
