import type { Translate } from '@ancadeba/utilities'
import { MapViewport, mapZoomLevels } from './mapViewport.js'

/** View controls never mutate the map draft or its edit history. */
export function mapViewportControls(
  document: Document,
  camera: MapViewport,
  t: Translate,
  options: {
    change(operation: () => void): void
    panning(): boolean
    setPanning(value: boolean): void
    focusGrid(): void
    view?(): { x: number; y: number; columns: number; rows: number }
  },
) {
  const zoomControls = document.createElement('div')
  zoomControls.className = 'map-window-controls'
  zoomControls.setAttribute('role', 'group')
  zoomControls.setAttribute('aria-label', t('maps.viewControls'))
  const details = document.createElement('details')
  details.className = 'map-view-details'
  const summary = document.createElement('summary')
  summary.textContent = t('maps.viewControls')
  const steps = document.createElement('div')
  steps.className = 'map-window-controls'
  const buttons: { button: HTMLButtonElement; disabled: () => boolean }[] = []

  const button = (
    parent: HTMLElement,
    key: string,
    operation: () => void,
    disabled = () => false,
  ) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = t(key)
    button.addEventListener('click', () => options.change(operation))
    buttons.push({ button, disabled })
    parent.append(button)

    return button
  }

  const label = document.createElement('label')
  label.append(t('maps.zoom'))
  const zoom = document.createElement('select')

  for (const level of mapZoomLevels) {
    const option = document.createElement('option')
    option.value = String(level)
    option.textContent = `${level}%`
    zoom.append(option)
  }

  zoom.addEventListener('change', () => options.change(() => camera.zoomTo(Number(zoom.value))))
  label.append(zoom)
  zoomControls.append(label)
  const pan = button(zoomControls, 'maps.panMap', () => options.setPanning(!options.panning()))
  pan.addEventListener('click', () => options.focusGrid())
  button(
    steps,
    'maps.zoomOut',
    () => camera.zoomBy(-1),
    () => !camera.canZoomOut,
  )
  button(
    steps,
    'maps.zoomIn',
    () => camera.zoomBy(1),
    () => !camera.canZoomIn,
  )
  button(
    steps,
    'maps.panLeft',
    () => camera.pan(-1, 0),
    () => camera.x === 0,
  )
  button(
    steps,
    'maps.panRight',
    () => camera.pan(1, 0),
    () => camera.x + camera.columns >= camera.width,
  )
  button(
    steps,
    'maps.panUp',
    () => camera.pan(0, -1),
    () => camera.y === 0,
  )
  button(
    steps,
    'maps.panDown',
    () => camera.pan(0, 1),
    () => camera.y + camera.rows >= camera.height,
  )
  button(steps, 'maps.resetView', () => {
    camera.zoomTo(100)
    camera.moveTo(0, 0)
    options.setPanning(false)
  })
  const pages = document.createElement('div')
  pages.className = 'map-window-controls'
  button(
    pages,
    'maps.left',
    () => camera.pan(-camera.columns, 0),
    () => camera.x === 0,
  )
  button(
    pages,
    'maps.right',
    () => camera.pan(camera.columns, 0),
    () => camera.x + camera.columns >= camera.width,
  )
  button(
    pages,
    'maps.up',
    () => camera.pan(0, -camera.rows),
    () => camera.y === 0,
  )
  button(
    pages,
    'maps.down',
    () => camera.pan(0, camera.rows),
    () => camera.y + camera.rows >= camera.height,
  )
  const range = document.createElement('span')
  range.setAttribute('role', 'status')
  pages.append(range)
  const help = document.createElement('p')
  help.className = 'help'
  help.textContent = t('maps.viewHelp')
  details.append(summary, steps, pages, help)

  const refresh = () => {
    const view = options.view?.() ?? camera
    zoom.value = String(camera.zoom)
    pan.setAttribute('aria-pressed', String(options.panning()))

    for (const { button, disabled } of buttons) button.disabled = disabled()
    range.textContent = t('maps.range', {
      x: Math.floor(view.x),
      endX: Math.min(camera.width - 1, Math.ceil(view.x + view.columns) - 1),
      y: Math.floor(view.y),
      endY: Math.min(camera.height - 1, Math.ceil(view.y + view.rows) - 1),
    })
  }

  refresh()

  return { zoomControls, details, refresh }
}
