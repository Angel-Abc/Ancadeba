import type { GameMap, TileSet, Widget } from '@ancadeba/content'
import {
  gameSessionStorageToken,
  IEngineGameSessionChangedPayload,
  IGameSessionStorage,
  IMapDefinitionProvider,
  ITileSetDefinitionProvider,
  mapDefinitionProviderToken,
  MESSAGE_ENGINE_GAME_SESSION_CHANGED,
  tileSetDefinitionProviderToken,
} from '@ancadeba/engine'
import { CSSCustomProperties, useService } from '@ancadeba/ui'
import { IMessageBus, messageBusToken } from '@ancadeba/utils'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { WidgetProps } from '../../registries/types'
import {
  buildViewportCells,
  calculateTrackedViewportOrigin,
  MapPosition,
  moveViewportOrigin,
  ViewportSize,
} from './squaresMapHelpers'

type SquaresMapWidgetData = Extract<Widget, { type: 'squares-map' }>
type TileColors = Record<string, string>
type ContainerSize = {
  width: number
  height: number
}

export function SquaresMapWidget({
  widget,
}: WidgetProps<SquaresMapWidgetData>): React.JSX.Element | null {
  const gameSessionStorage = useService<IGameSessionStorage>(
    gameSessionStorageToken,
  )
  const mapDefinitionProvider = useService<IMapDefinitionProvider>(
    mapDefinitionProviderToken,
  )
  const tileSetDefinitionProvider = useService<ITileSetDefinitionProvider>(
    tileSetDefinitionProviderToken,
  )
  const messageBus = useService<IMessageBus>(messageBusToken)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [session, setSession] = useState(gameSessionStorage.currentSession)
  const [map, setMap] = useState<GameMap | null>(null)
  const [tileColors, setTileColors] = useState<TileColors>({})
  const [freeOrigin, setFreeOrigin] = useState<MapPosition | null>(null)
  const [containerSize, setContainerSize] = useState<ContainerSize>({
    width: 0,
    height: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const viewportSize: ViewportSize = {
    width: widget.viewportWidth,
    height: widget.viewportHeight,
  }
  const mapId = session?.mapId
  const newGameId = session?.newGameId

  useEffect(() => {
    return messageBus.subscribe(
      MESSAGE_ENGINE_GAME_SESSION_CHANGED,
      (payload) => {
        setSession((payload as IEngineGameSessionChangedPayload).session)
      },
    )
  }, [messageBus])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const updateContainerSize = (): void => {
      setContainerSize({
        width: container.clientWidth,
        height: container.clientHeight,
      })
    }

    updateContainerSize()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const resizeObserver = new ResizeObserver(updateContainerSize)
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    setMap(null)
    setTileColors({})
    setError(null)

    const loadMap = async (): Promise<void> => {
      if (!mapId) {
        return
      }

      try {
        const nextMap = await mapDefinitionProvider.getMapDefinition(mapId)
        const nextTileColors = await loadTileColors(
          nextMap,
          tileSetDefinitionProvider,
        )

        if (!isMounted) {
          return
        }

        setMap(nextMap)
        setTileColors(nextTileColors)
      } catch (nextError) {
        if (!isMounted) {
          return
        }

        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Failed to load squares map',
        )
      }
    }

    void loadMap()

    return () => {
      isMounted = false
    }
  }, [mapDefinitionProvider, mapId, tileSetDefinitionProvider])

  useEffect(() => {
    if (!map || !session || widget.track !== 'free') {
      return
    }

    setFreeOrigin(
      calculateTrackedViewportOrigin(
        session.player.position,
        viewportSize,
        map,
      ),
    )
  }, [
    map,
    mapId,
    newGameId,
    viewportSize.height,
    viewportSize.width,
    widget.track,
  ])

  const origin = useMemo(() => {
    if (!map || !session) {
      return null
    }

    if (widget.track === 'free') {
      return (
        freeOrigin ??
        calculateTrackedViewportOrigin(session.player.position, viewportSize, map)
      )
    }

    return calculateTrackedViewportOrigin(
      session.player.position,
      viewportSize,
      map,
    )
  }, [freeOrigin, map, session, viewportSize.height, viewportSize.width, widget.track])

  const cells = useMemo(() => {
    if (!map || !origin) {
      return []
    }

    return buildViewportCells(map, origin, viewportSize)
  }, [map, origin, viewportSize.height, viewportSize.width])

  const cellSize = Math.floor(
    Math.min(
      containerSize.width / widget.viewportWidth,
      containerSize.height / widget.viewportHeight,
    ),
  )
  const visibleCellSize = Math.max(1, cellSize)
  const mapStyle: CSSCustomProperties = {
    '--ge-squares-map-columns': widget.viewportWidth.toString(),
    '--ge-squares-map-rows': widget.viewportHeight.toString(),
    '--ge-squares-map-cell-size': `${visibleCellSize}px`,
  }

  const handleFreeMove = (delta: MapPosition): void => {
    if (!map || !origin) {
      return
    }

    setFreeOrigin(moveViewportOrigin(origin, delta, viewportSize, map))
  }

  if (error) {
    return <div>{error}</div>
  }

  if (!session) {
    return null
  }

  return (
    <div ref={containerRef} className="squares-map-widget">
      <div className="squares-map-widget-viewport" style={mapStyle}>
        {cells.map((cell) => {
          const isPlayer =
            cell.row === session.player.position.row &&
            cell.column === session.player.position.column
          const cellStyle: CSSCustomProperties = {
            '--ge-squares-map-cell-color': cell.tileReference
              ? (tileColors[cell.tileReference] ?? 'transparent')
              : 'transparent',
          }

          return (
            <div
              key={`${cell.row}:${cell.column}`}
              className={
                cell.tileReference
                  ? 'squares-map-widget-cell'
                  : 'squares-map-widget-cell squares-map-widget-cell-empty'
              }
              style={cellStyle}
            >
              {isPlayer && <span className="squares-map-widget-player" />}
            </div>
          )
        })}
      </div>
      {widget.track === 'free' && (
        <div className="squares-map-widget-controls">
          <button
            type="button"
            aria-label="Move map up"
            className="squares-map-widget-control squares-map-widget-control-up"
            onClick={() => handleFreeMove({ row: -1, column: 0 })}
          >
            ^
          </button>
          <button
            type="button"
            aria-label="Move map left"
            className="squares-map-widget-control squares-map-widget-control-left"
            onClick={() => handleFreeMove({ row: 0, column: -1 })}
          >
            {'<'}
          </button>
          <button
            type="button"
            aria-label="Move map right"
            className="squares-map-widget-control squares-map-widget-control-right"
            onClick={() => handleFreeMove({ row: 0, column: 1 })}
          >
            {'>'}
          </button>
          <button
            type="button"
            aria-label="Move map down"
            className="squares-map-widget-control squares-map-widget-control-down"
            onClick={() => handleFreeMove({ row: 1, column: 0 })}
          >
            v
          </button>
        </div>
      )}
    </div>
  )
}

async function loadTileColors(
  map: GameMap,
  tileSetDefinitionProvider: ITileSetDefinitionProvider,
): Promise<TileColors> {
  const tileSetIds = Array.from(
    new Set(map.tiles.map((tile) => tile.tile.split('.')[0])),
  )
  const tileSets = await Promise.all(
    tileSetIds.map((tileSetId) =>
      tileSetDefinitionProvider.getTileSetDefinition(tileSetId),
    ),
  )
  const tileSetsById = new Map(tileSets.map((tileSet) => [tileSet.id, tileSet]))
  const tileColors: TileColors = {}

  for (const mapTile of map.tiles) {
    const color = resolveTileColor(mapTile.tile, tileSetsById)
    if (color) {
      tileColors[mapTile.tile] = color
    }
  }

  return tileColors
}

function resolveTileColor(
  tileReference: string,
  tileSetsById: Map<string, TileSet>,
): string | null {
  const [tileSetId, tileId] = tileReference.split('.')
  const tileSet = tileSetsById.get(tileSetId)
  const tile = tileSet?.tiles.find((nextTile) => nextTile.id === tileId)

  return tile?.color ?? null
}
