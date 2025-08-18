import type { GameMap as GameMapData, MapTile as MapTileData, Position as PositionData } from '@loader/data/map'
import { type GameMap, type MapTile, type Position } from '@loader/schema/map'
import type { Action as ActionData } from '@loader/data/action'
import { fatalError } from '@utils/logMessage'
import { mapAction } from './action'
import { Action } from '@loader/schema/action'

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

function mapTileAction(action: Action | Action[]): ActionData | ActionData[] {
    if (Array.isArray(action)) return action.map(mapAction)
    return mapAction(action)
}

export function mapMapTile(mapTile: MapTile): MapTileData {
    return {
        key: mapTile.key,
        tile: mapTile.tile,
        onEnter: mapTile.onEnter ? mapTileAction(mapTile.onEnter) : undefined
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

/**
 * Converts a schema `Position` into its loader data representation.
 *
 * @param position - Position defined in the schema.
 * @returns The mapped position for the data layer.
 */
export function mapPosition(position: Position): PositionData {
    return {
        x: position.x,
        y: position.y
    }
}
