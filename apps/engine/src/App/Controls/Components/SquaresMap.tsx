import { SquaresMapComponent as SquaresMapComponentData } from '@ancadeba/schemas'
import { CSSCustomProperties, useService } from '@ancadeba/ui'
import {
  gameStateProviderToken,
  IGameStateProvider,
} from '../../../gameState.ts/provider'
import { useMemo, useState } from 'react'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../../resourceData/provider'

interface SquaresMapComponentProps {
  component: SquaresMapComponentData
}

export function SquaresMapComponent({ component }: SquaresMapComponentProps) {
  const gameStateProvider = useService<IGameStateProvider>(
    gameStateProviderToken
  )
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const [activeMapId, _setActiveMapId] = useState<string | null>(
    gameStateProvider.activeMapId
  )

  const mapData = useMemo(() => {
    if (!activeMapId) return null
    return resourceDataProvider.getMapData(activeMapId)
  }, [activeMapId, resourceDataProvider])

  if (!activeMapId || !mapData) {
    return <div>No active map</div>
  }

  const style: CSSCustomProperties = {
    '--ge-squares-map-viewport-width': `${component.viewport.width}`,
    '--ge-squares-map-viewport-height': `${component.viewport.height}`,
    '--ge-map-width': `${mapData.width}`,
    '--ge-map-height': `${mapData.height}`,
  }

  return (
    <div style={style} className="squares-map-component">
      <div className="viewport">
        <div className="area">
          {mapData.squares.map((row, rowIndex) => {
            return row.map((squareId, colIndex) => {
              const tile = mapData.tiles.get(squareId)
              const key = `${squareId}-${rowIndex}-${colIndex}`
              return <div key={key}>TODO: {tile ? tile.id : 'empty'}</div>
            })
          })}
        </div>
      </div>
    </div>
  )
}
