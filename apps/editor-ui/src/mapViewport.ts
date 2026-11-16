import type { TilePoint } from './mapDraft.js'

export const mapZoomLevels = [50, 75, 100, 125, 150, 200, 300, 400] as const

export const mapGridViewport = () => ({
  x: 0,
  y: 0,
  focusX: 0,
  focusY: 0,
  offsetX: 0,
  offsetY: 0,
  viewColumns: 24,
  viewRows: 16,
  zoom: 100,
  panning: false,
})

/** Tile-aligned camera with a bounded number of visible cells at every zoom level. */
export class MapViewport {
  x = 0
  y = 0
  zoom = 100
  private viewColumns = 24
  private viewRows = 16
  private zoomAnchor: { point: TilePoint; fraction: TilePoint } | undefined

  constructor(
    readonly width: number,
    readonly height: number,
    saved = mapGridViewport(),
  ) {
    this.resize(saved.viewColumns, saved.viewRows)
    this.zoom = mapZoomLevels.find((level) => level === saved.zoom) ?? 100
    this.moveTo(saved.x, saved.y)
  }

  get columns() {
    return Math.min(this.width, Math.max(1, Math.ceil((this.viewColumns * 100) / this.zoom)))
  }
  get rows() {
    return Math.min(this.height, Math.max(1, Math.ceil((this.viewRows * 100) / this.zoom)))
  }

  get viewSize() {
    return { columns: this.viewColumns, rows: this.viewRows }
  }

  /** Available space in tile units at 100% zoom, capped to keep rendering bounded. */
  resize(columns: number, rows: number) {
    if (columns <= 0 || rows <= 0 || !Number.isFinite(columns) || !Number.isFinite(rows))
      return false
    const nextColumns = Math.min(24, columns)
    const nextRows = Math.min(16, rows)

    if (this.viewColumns === nextColumns && this.viewRows === nextRows) return false
    this.viewColumns = nextColumns
    this.viewRows = nextRows
    this.moveTo(this.x, this.y)

    return true
  }
  get canZoomIn() {
    return this.zoom < mapZoomLevels[mapZoomLevels.length - 1]!
  }
  get canZoomOut() {
    return this.zoom > mapZoomLevels[0]
  }

  moveTo(x: number, y: number) {
    this.zoomAnchor = undefined
    const nextX = Math.max(0, Math.min(this.width - this.columns, Math.round(x)))
    const nextY = Math.max(0, Math.min(this.height - this.rows, Math.round(y)))
    const changed = this.x !== nextX || this.y !== nextY
    this.x = nextX
    this.y = nextY

    return changed
  }

  pan(x: number, y: number) {
    return this.moveTo(this.x + x, this.y + y)
  }

  centerOn(x: number, y: number) {
    return this.moveTo(x + 0.5 - this.columns / 2, y + 0.5 - this.rows / 2)
  }

  zoomTo(zoom: number, anchor: TilePoint = { x: 0.5, y: 0.5 }) {
    if (!mapZoomLevels.some((level) => level === zoom) || zoom === this.zoom) return false

    const retained =
      this.zoomAnchor?.fraction.x === anchor.x && this.zoomAnchor.fraction.y === anchor.y
        ? this.zoomAnchor.point
        : undefined

    const point = retained ?? {
      x: this.x + this.columns * anchor.x,
      y: this.y + this.rows * anchor.y,
    }

    this.zoom = zoom
    this.moveTo(point.x - this.columns * anchor.x, point.y - this.rows * anchor.y)
    this.zoomAnchor = { point, fraction: { ...anchor } }

    return true
  }

  zoomBy(direction: -1 | 1, anchor?: TilePoint) {
    const index = mapZoomLevels.findIndex((level) => level === this.zoom)
    const zoom = mapZoomLevels[index + direction]

    return zoom === undefined ? false : this.zoomTo(zoom, anchor)
  }
}
