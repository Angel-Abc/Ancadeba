import { useService } from '@app/iocProvider'
import { type SquaresMapComponent as SquaresMapComponentData } from '@loader/data/component'
import { GameMap, Position } from '@loader/data/map'
import { MAP_SWITCHED, POSITION_CHANGED } from '@messages/system'
import { gameDataProviderToken, IGameDataProvider } from '@providers/gameDataProvider'
import { fatalError } from '@utils/logMessage'
import { IMessageBus, messageBusToken } from '@utils/messageBus'
import { useEffect, useState } from 'react'
import { Tile } from './controls/tile'
import { CSSCustomProperties } from '@app/types'

interface SquaresMapComponentProps {
    component: SquaresMapComponentData
}

const logName = 'SquaresMapComponent'
/**
 * Displays the current game map as a grid of tiles and highlights the player's position.
 * Reacts to map and position change messages to keep the view synchronized.
 *
 * @param component - Configuration describing the viewport size.
 */
export const SquaresMapComponent: React.FC<SquaresMapComponentProps> = ({ component }): React.JSX.Element => {
    const messageBus = useService<IMessageBus>(messageBusToken)
    const gameDataProvider = useService<IGameDataProvider>(gameDataProviderToken)
    const [mapId, setMapId] = useState<string | null>(gameDataProvider.Context.currentMapId)
    const [position, setPosition] = useState<Position>(gameDataProvider.Context.player.position)

    useEffect(() => {
        return messageBus.registerMessageListener(MAP_SWITCHED, () => {
            setMapId(gameDataProvider.Context.currentMapId)
        })
    }, [
        messageBus,
        gameDataProvider
    ])

    useEffect(() => {
        return messageBus.registerMessageListener(POSITION_CHANGED, () => {
            setPosition(gameDataProvider.Context.player.position)
        })
    }, [
        messageBus,
        gameDataProvider
    ])

    if (!mapId) return (<></>)
    const gameMap: GameMap = gameDataProvider.Game.loadedMaps[mapId] ?? fatalError(logName, 'Map with id {0} was not loaded!', mapId)

    const deltaX = Math.floor(component.mapSize.columns / 2)
    const deltaY = Math.floor(component.mapSize.rows / 2)

    const style: CSSCustomProperties = {
        '--ge-map-viewport-width': component.mapSize.columns.toString(),
        '--ge-map-viewport-height': component.mapSize.rows.toString(),
        '--ge-map-area-width': gameMap.width.toString(),
        '--ge-map-area-height': gameMap.height.toString(),
        '--ge-map-position-left': (position.x - deltaX).toString(),
        '--ge-map-position-top': (position.y - deltaY).toString()
    }

    return (
        <div style={style} className='squares-map'>
            <div className='viewport'>
                <div className='area'>
                    {gameMap.map.map((row, rowIndex) => {
                        return row.map((tileKey, columnIndex) => {
                            const mapTile = gameMap.tiles[tileKey]
                            const tile = gameDataProvider.Game.loadedTiles.get(mapTile.tile) ?? fatalError(logName, 'Tile with key {0} was not loaded!', mapTile.tile)
                            const key = `${tileKey}-${rowIndex}-${columnIndex}`
                            return (
                                <Tile
                                    key={key}
                                    tile={tile}
                                    isPlayerPosition={position.x === columnIndex && position.y === rowIndex}
                                />
                            )
                        })
                    })}
                </div>
            </div>
        </div>
    )
}
