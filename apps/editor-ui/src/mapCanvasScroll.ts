import type { TilePoint } from './mapDraft.js'
import type { MapViewport, mapGridViewport } from './mapViewport.js'

/** Native scrolling covers the full map; only the tiles under the viewport need DOM nodes. */
export function mapCanvasScroll(
  document: Document,
  surface: HTMLElement,
  grid: HTMLElement,
  camera: MapViewport,
  saved: ReturnType<typeof mapGridViewport> | undefined,
  options: { changed(): void; refreshView(): void; stop(): void },
) {
  const extent = document.createElement('div')
  extent.className = 'map-scroll-extent'
  extent.append(grid)
  surface.append(extent)
  const abort = new AbortController()

  const rootSize = () =>
    Number.parseFloat(
      document.defaultView?.getComputedStyle?.(document.documentElement).fontSize ?? '16',
    )

  const baseTileSize = () => 1.75 * rootSize()
  const tileSize = () => (baseTileSize() * camera.zoom) / 100
  let x = camera.x + (saved?.offsetX ?? 0)
  let y = camera.y + (saved?.offsetY ?? 0)
  let zoom = camera.zoom
  let lastLeft = 0
  let lastTop = 0
  let alignEdges = false

  const measured = () => surface.clientWidth > 0 && surface.clientHeight > 0

  const measure = () =>
    measured() &&
    camera.resize(surface.clientWidth / baseTileSize(), surface.clientHeight / baseTileSize())

  const refresh = () => {
    const size = tileSize()

    if (zoom !== camera.zoom || Math.floor(x) !== camera.x) x = camera.x

    if (zoom !== camera.zoom || Math.floor(y) !== camera.y) y = camera.y
    zoom = camera.zoom
    surface.style.setProperty('--map-editor-tile-size', `${(1.75 * camera.zoom) / 100}rem`)
    surface.style.height = `min(28rem, ${camera.height * size + 2 * rootSize()}px)`
    extent.style.width = `${camera.width * size}px`
    extent.style.height = `${camera.height * size}px`
    grid.style.left = `${camera.x * size}px`
    grid.style.top = `${camera.y * size}px`

    if (!measured()) return
    const maxLeft = Math.max(0, camera.width * size - surface.clientWidth)
    const maxTop = Math.max(0, camera.height * size - surface.clientHeight)

    if (alignEdges && camera.x + camera.columns === camera.width) x = maxLeft / size

    if (alignEdges && camera.y + camera.rows === camera.height) y = maxTop / size
    alignEdges = false
    surface.scrollLeft = Math.min(maxLeft, x * size)
    surface.scrollTop = Math.min(maxTop, y * size)
    lastLeft = surface.scrollLeft
    lastTop = surface.scrollTop
    x = lastLeft / size
    y = lastTop / size
  }

  surface.addEventListener(
    'scroll',
    () => {
      if (!measured() || (lastLeft === surface.scrollLeft && lastTop === surface.scrollTop)) return
      const previousEndX = Math.ceil(x + surface.clientWidth / tileSize())
      const previousEndY = Math.ceil(y + surface.clientHeight / tileSize())
      lastLeft = surface.scrollLeft
      lastTop = surface.scrollTop
      x = lastLeft / tileSize()
      y = lastTop / tileSize()
      options.stop()
      const resized = measure()
      const moved = Math.floor(x) !== camera.x || Math.floor(y) !== camera.y

      const edgesChanged =
        previousEndX !== Math.ceil(x + surface.clientWidth / tileSize()) ||
        previousEndY !== Math.ceil(y + surface.clientHeight / tileSize())

      if (moved) camera.moveTo(Math.floor(x), Math.floor(y))

      if (resized || moved || edgesChanged) options.changed()
      else options.refreshView()
    },
    { signal: abort.signal },
  )

  const observer =
    document.defaultView?.ResizeObserver &&
    new document.defaultView.ResizeObserver(() => {
      if (!measured()) return
      measure()
      options.stop()
      options.changed()
    })

  observer?.observe(surface)

  return {
    refresh,
    align: () => {
      x = camera.x
      y = camera.y
      alignEdges = true
    },
    get tileSize() {
      return tileSize()
    },
    get columns() {
      return Math.min(
        camera.width - camera.x,
        measured() ? Math.ceil(x + surface.clientWidth / tileSize()) - camera.x : camera.columns,
      )
    },
    get rows() {
      return Math.min(
        camera.height - camera.y,
        measured() ? Math.ceil(y + surface.clientHeight / tileSize()) - camera.y : camera.rows,
      )
    },
    view: () => ({
      x,
      y,
      columns: measured()
        ? Math.min(camera.width, surface.clientWidth / tileSize())
        : camera.columns,
      rows: measured() ? Math.min(camera.height, surface.clientHeight / tileSize()) : camera.rows,
    }),
    reveal(point: TilePoint) {
      if (!measured()) return false
      const previousX = x
      const previousY = y
      const columns = surface.clientWidth / tileSize()
      const rows = surface.clientHeight / tileSize()
      x = Math.max(0, Math.min(x, point.x))
      y = Math.max(0, Math.min(y, point.y))

      if (point.x + 1 > x + columns) x = point.x + 1 - columns

      if (point.y + 1 > y + rows) y = point.y + 1 - rows

      if (Math.floor(x) !== camera.x || Math.floor(y) !== camera.y)
        camera.moveTo(Math.floor(x), Math.floor(y))

      return x !== previousX || y !== previousY
    },
    dispose: () => {
      observer?.disconnect()
      abort.abort()

      if (saved) Object.assign(saved, { offsetX: x - camera.x, offsetY: y - camera.y })
    },
  }
}
