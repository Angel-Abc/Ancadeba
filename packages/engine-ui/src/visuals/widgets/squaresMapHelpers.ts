import type { GameMap } from '@ancadeba/content'

export type MapPosition = {
  row: number
  column: number
}

export type MapSize = {
  width: number
  height: number
}

export type ViewportSize = {
  width: number
  height: number
}

export type ViewportCell = {
  row: number
  column: number
  tileKey: string | null
  tileReference: string | null
}

export function clampViewportOrigin(
  origin: MapPosition,
  viewportSize: ViewportSize,
  mapSize: MapSize,
): MapPosition {
  return {
    row: clamp(origin.row, 0, Math.max(0, mapSize.height - viewportSize.height)),
    column: clamp(
      origin.column,
      0,
      Math.max(0, mapSize.width - viewportSize.width),
    ),
  }
}

export function calculateTrackedViewportOrigin(
  anchor: MapPosition,
  viewportSize: ViewportSize,
  mapSize: MapSize,
): MapPosition {
  return clampViewportOrigin(
    {
      row: anchor.row - Math.floor(viewportSize.height / 2),
      column: anchor.column - Math.floor(viewportSize.width / 2),
    },
    viewportSize,
    mapSize,
  )
}

export function moveViewportOrigin(
  origin: MapPosition,
  delta: MapPosition,
  viewportSize: ViewportSize,
  mapSize: MapSize,
): MapPosition {
  return clampViewportOrigin(
    {
      row: origin.row + delta.row,
      column: origin.column + delta.column,
    },
    viewportSize,
    mapSize,
  )
}

export function buildViewportCells(
  map: GameMap,
  origin: MapPosition,
  viewportSize: ViewportSize,
): ViewportCell[] {
  const tileReferences = new Map(
    map.tiles.map((tile) => [tile.key, tile.tile] as const),
  )
  const rows = map.map.map((row) => row.split(','))
  const cells: ViewportCell[] = []

  for (let rowOffset = 0; rowOffset < viewportSize.height; rowOffset += 1) {
    for (
      let columnOffset = 0;
      columnOffset < viewportSize.width;
      columnOffset += 1
    ) {
      const row = origin.row + rowOffset
      const column = origin.column + columnOffset
      const tileKey = rows[row]?.[column] ?? null

      cells.push({
        row,
        column,
        tileKey,
        tileReference: tileKey ? (tileReferences.get(tileKey) ?? null) : null,
      })
    }
  }

  return cells
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
