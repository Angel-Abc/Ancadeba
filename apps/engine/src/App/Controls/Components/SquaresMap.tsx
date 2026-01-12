import { SquaresMapComponent as SquaresMapComponentData } from '@ancadeba/schemas'
import { CSSCustomProperties, useService } from '@ancadeba/ui'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../../../gameState.ts/provider'
import { useEffect, useMemo, useState } from 'react'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../../resourceData/provider'
import {
  engineMessageBusToken,
  IEngineMessageBus,
} from '../../../system/engineMessageBus'
import { CORE_MESSAGES } from '../../../messages/core'
import { MapTile } from './MapTile'

interface SquaresMapComponentProps {
  component: SquaresMapComponentData
}

export function SquaresMapComponent({ component }: SquaresMapComponentProps) {
  const gameStateProvider = useService<IGameStateProvider>(
    gameStateProviderToken
  )
  const engineMessageBus = useService<IEngineMessageBus>(engineMessageBusToken)
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const [activeMapId, setActiveMapId] = useState<string | null>(
    gameStateProvider.activeMapId
  )
  const [mapPosition, setMapPosition] = useState(gameStateProvider.mapPosition)

  useEffect(() => {
    return engineMessageBus.subscribe(CORE_MESSAGES.SCENE_CHANGED, () => {
      setActiveMapId(gameStateProvider.activeMapId)
      setMapPosition(gameStateProvider.mapPosition)
    })
  }, [engineMessageBus, gameStateProvider])

  useEffect(() => {
    return engineMessageBus.subscribe(
      CORE_MESSAGES.MAP_POSITION_CHANGED,
      (payload) => {
        setMapPosition(payload.mapPosition)
      }
    )
  }, [engineMessageBus])

  const mapData = useMemo(() => {
    if (!activeMapId) return null
    return resourceDataProvider.getMapData(activeMapId)
  }, [activeMapId, resourceDataProvider])

  if (!activeMapId || !mapData) {
    return <div>No active map</div>
  }
  if (!mapPosition) {
    return <div>No map position</div>
  }

  const deltaX = Math.floor(component.viewport.width / 2)
  const deltaY = Math.floor(component.viewport.height / 2)

  const style: CSSCustomProperties = {
    '--ge-squares-map-viewport-width': `${component.viewport.width}`,
    '--ge-squares-map-viewport-height': `${component.viewport.height}`,
    '--ge-map-width': `${mapData.width}`,
    '--ge-map-height': `${mapData.height}`,
    '--ge-map-position-x': (mapPosition.x - deltaX).toString(),
    '--ge-map-position-y': (mapPosition.y - deltaY).toString(),
  }

  return (
    <div style={style} className="squares-map-component">
      <div className="viewport">
        <div className="area">
          {mapData.squares.map((row, rowIndex) => {
            return row.map((squareId, colIndex) => {
              const tile = mapData.tiles.get(squareId)
              const key = `${squareId}-${rowIndex}-${colIndex}`
              if (tile === undefined) {
                return <div key={key} className="empty-tile" />
              }
              // TODO: render entities on top of tiles
              return (
                <MapTile
                  key={key}
                  tile={tile}
                  assetsUrl={resourceDataProvider.assetsUrl}
                />
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}
