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
import { MapTile } from './Controls/MapTile'
import { COMPONENT_KEYS, PositionComponent } from '../../../ecs/components'
import type { EntityId, IWorld } from '../../../ecs/types'
import { WORLD_EVENTS } from '../../../ecs/types'
import { worldToken } from '../../../ecs/world'

interface SquaresMapComponentProps {
  component: SquaresMapComponentData
}

type EntityPosition = {
  id: EntityId
  position: PositionComponent
}

const entityOffsets = [
  { x: 0, y: 0 },
  { x: -30, y: -30 },
  { x: 30, y: -30 },
  { x: -30, y: 30 },
  { x: 30, y: 30 },
]

const getEntityPositions = (world: IWorld): EntityPosition[] => {
  const entities: EntityPosition[] = []
  const entityIds = world.getEntitiesWith(COMPONENT_KEYS.position)
  entityIds.forEach((entityId) => {
    const position = world.getComponent<PositionComponent>(
      entityId,
      COMPONENT_KEYS.position
    )
    if (!position) {
      return
    }
    entities.push({ id: entityId, position })
  })
  return entities
}

export function SquaresMapComponent({ component }: SquaresMapComponentProps) {
  const gameStateProvider = useService<IGameStateProvider>(
    gameStateProviderToken
  )
  const engineMessageBus = useService<IEngineMessageBus>(engineMessageBusToken)
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const world = useService<IWorld>(worldToken)
  const [activeMapId, setActiveMapId] = useState<string | null>(
    gameStateProvider.activeMapId
  )
  const [mapPosition, setMapPosition] = useState(gameStateProvider.mapPosition)
  const [entityPositions, setEntityPositions] = useState<EntityPosition[]>(() =>
    getEntityPositions(world)
  )

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

  useEffect(() => {
    const updateEntities = () => {
      setEntityPositions(getEntityPositions(world))
    }
    updateEntities()

    const unsubscribeAdded = world.subscribe(
      WORLD_EVENTS.COMPONENT_ADDED,
      (payload) => {
        if (payload.componentKey !== COMPONENT_KEYS.position) {
          return
        }
        updateEntities()
      }
    )
    const unsubscribeUpdated = world.subscribe(
      WORLD_EVENTS.COMPONENT_UPDATED,
      (payload) => {
        if (payload.componentKey !== COMPONENT_KEYS.position) {
          return
        }
        updateEntities()
      }
    )
    const unsubscribeRemoved = world.subscribe(
      WORLD_EVENTS.COMPONENT_REMOVED,
      (payload) => {
        if (payload.componentKey !== COMPONENT_KEYS.position) {
          return
        }
        updateEntities()
      }
    )
    const unsubscribeDestroyed = world.subscribe(
      WORLD_EVENTS.ENTITY_DESTROYED,
      () => {
        updateEntities()
      }
    )

    return () => {
      unsubscribeAdded()
      unsubscribeUpdated()
      unsubscribeRemoved()
      unsubscribeDestroyed()
    }
  }, [world])

  const mapData = useMemo(() => {
    if (!activeMapId) return null
    return resourceDataProvider.getMapData(activeMapId)
  }, [activeMapId, resourceDataProvider])

  const entitiesByPosition = useMemo(() => {
    const map = new Map<string, EntityPosition[]>()
    entityPositions.forEach((entity) => {
      const key = `${entity.position.x},${entity.position.y}`
      const existing = map.get(key)
      if (existing) {
        existing.push(entity)
        return
      }
      map.set(key, [entity])
    })
    return map
  }, [entityPositions])

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
              const entities = entitiesByPosition.get(`${colIndex},${rowIndex}`)
              return (
                <MapTile
                  key={key}
                  tile={tile}
                  assetsUrl={resourceDataProvider.assetsUrl}
                >
                  {entities?.map((entity, index) => {
                    const offset =
                      entityOffsets[index % entityOffsets.length] ??
                      entityOffsets[0]
                    if (!offset) {
                      return null
                    }
                    return (
                      <div
                        key={`${key}-entity-${entity.id}`}
                        className="entity-marker"
                        data-entity-id={entity.id}
                        style={{
                          transform: `translate(${offset.x}%, ${offset.y}%)`,
                        }}
                      />
                    )
                  })}
                </MapTile>
              )
            })
          })}
        </div>
      </div>
    </div>
  )
}
