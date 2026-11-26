import type { MapViewComponentData, MapDirection } from '@ancadeba/game-runtime'
import {
  getMapMovementCostMs,
  mapDirections,
  type MapDefinition,
  type MapPosition,
} from '@ancadeba/schemas'
import { createBrowserTiming } from './browserTiming.js'
import { mapTileImages } from './mapTileAppearance.js'
import { applyMapCellAppearance } from './mapCellAppearance.js'
import { applyMapTileAppearance } from './mapTileAppearance.js'
import type { MapObject } from '@ancadeba/schemas'
import type {
  ComponentRenderContext,
  IComponentRenderer,
  RenderedComponent,
} from './componentRendering.js'

function clampCoordinate(value: number, maximum: number): number {
  return Math.min(maximum, Math.max(0, value))
}

export class MapViewComponentRenderer implements IComponentRenderer<MapViewComponentData> {
  render(component: MapViewComponentData, context: ComponentRenderContext): RenderedComponent {
    const { document, scene } = context
    const movement = scene?.type === 'game' ? scene.game.mapMovement : undefined
    const root = document.createElement('div')
    root.className = 'ancadeba-map-view'

    if (component.interactive !== false) root.tabIndex = 0
    root.setAttribute('role', 'region')
    root.setAttribute('aria-label', component.label)

    let map = (scene && movement?.getMap(scene, component.id)) ?? component.map
    let contents = this.renderMap(root, component, map, context)

    const unsubscribe =
      component.followPlayer && scene && movement
        ? movement.subscribeChanges(() => {
            const next = movement.getMap(scene, component.id)

            if (!next || next === map || scene.disposed) return
            const focused = root.contains(document.activeElement)
            contents.dispose()
            delete root.dataset.mapDiagnostics
            map = next
            contents = this.renderMap(root, component, map, context)

            if (focused) root.focus()
          })
        : undefined

    return {
      element: root,
      moveMap:
        component.interactive !== false ? (direction) => contents.moveMap(direction) : undefined,
      dispose() {
        unsubscribe?.()
        contents.dispose()
        root.remove()
      },
    }
  }

  private renderMap(
    root: HTMLElement,
    component: MapViewComponentData,
    map: MapDefinition,
    { document, scene, assets, graphics }: ComponentRenderContext,
  ) {
    const viewport = {
      ...component.viewport,
      columns: Math.min(component.viewport.columns, map.width),
      rows: Math.min(component.viewport.rows, map.height),
    }

    const movement = scene?.type === 'game' ? scene.game.mapMovement : undefined
    const objects = scene?.type === 'game' ? scene.game.mapObjects : undefined
    let active = true

    const sharedMovement =
      movement && scene && movement.getPosition(scene, component.id) !== undefined

    root.style.setProperty('--ge-map-view-columns', String(viewport.columns))
    root.style.setProperty('--ge-map-view-rows', String(viewport.rows))

    const clip = document.createElement('div')
    clip.className = 'ancadeba-map-window'
    const grid = document.createElement('div')
    grid.className = 'ancadeba-map-grid'

    if (!map.objects?.length) grid.setAttribute('aria-hidden', 'true')
    grid.style.setProperty('--ge-map-columns', String(map.width))
    grid.style.setProperty('--ge-map-rows', String(map.height))
    const cells: { element: HTMLElement; x: number; y: number }[] = []

    const objectButtons: { element: HTMLButtonElement; object: MapObject; activate: () => void }[] =
      []

    const paintObject = (entry: (typeof objectButtons)[number]) => {
      const appearance =
        (scene && objects?.getAppearance(scene, component.id, entry.object.id)) || entry.object

      applyMapTileAppearance(entry.element, map, appearance.terrain, assets, images.url)
      entry.element.textContent = map.terrain[appearance.terrain]?.tile
        ? ''
        : appearance.label.slice(0, 1)
      entry.element.title = appearance.label
      entry.element.setAttribute('aria-label', appearance.label)
      entry.element.style.setProperty('grid-column', `${appearance.x + 1} / span 1`)
      entry.element.style.setProperty('grid-row', `${appearance.y + 1} / span 1`)
      entry.element.hidden = appearance.visible === false
    }

    const images = mapTileImages(
      map,
      assets,
      graphics,
      () => {
        for (const cell of cells)
          applyMapCellAppearance(cell.element, map, cell.x, cell.y, assets, images.url, false)

        updateObjects()
      },
      (message) => {
        root.dataset.mapDiagnostics = message
      },
    )

    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const id = map.tiles[y]![x]!
        const tile = document.createElement('div')
        tile.className = 'ancadeba-map-tile'
        tile.style.setProperty('--ge-map-tile-color', map.terrain[id]!.color ?? 'transparent')
        applyMapCellAppearance(tile, map, x, y, assets, images.url, false)
        tile.setAttribute('aria-hidden', 'true')
        cells.push({ element: tile, x, y })
        grid.append(tile)
      }
    }

    for (const object of map.objects ?? []) {
      const element = document.createElement('button')
      element.type = 'button'
      element.className = 'ancadeba-map-object'
      element.dataset.mapObject = object.id
      element.textContent = object.label.slice(0, 1)
      element.title = object.label
      element.setAttribute('aria-label', object.label)
      applyMapTileAppearance(element, map, object.terrain, assets, images.url)

      const activate = () => {
        if (active && scene && objects?.interact(scene, component.id, object.id)) root.focus()
      }

      element.addEventListener('click', activate)
      objectButtons.push({ element, object, activate })
      grid.append(element)
    }

    const updateObjects = () => {
      for (const entry of objectButtons) {
        const focused = document.activeElement === entry.element
        paintObject(entry)
        entry.element.disabled = !scene || !objects?.getTarget(scene, component.id, entry.object.id)

        if (focused && entry.element.disabled && active && scene && !scene.disposed) root.focus()
      }
    }

    updateObjects()
    const unsubscribeObjects = objects?.subscribeChanges(updateObjects)

    const player = component.playerSpawn && document.createElement('div')

    if (player) {
      player.className = 'ancadeba-map-player'
      player.setAttribute('aria-hidden', 'true')
      grid.append(player)
    }

    clip.append(grid)
    root.append(clip)

    const maxX = map.width - viewport.columns
    const maxY = map.height - viewport.rows
    let x = 0
    let y = 0

    let playerPosition = sharedMovement
      ? movement.getPosition(scene, component.id)
      : component.playerSpawn

    let cancelStep: (() => void) | undefined

    const panTo = (nextX: number, nextY: number) => {
      x = clampCoordinate(nextX, maxX)
      y = clampCoordinate(nextY, maxY)
      grid.style.setProperty('--ge-map-x', String(x))
      grid.style.setProperty('--ge-map-y', String(y))
    }

    const showPlayer = (position: MapPosition) => {
      player?.style.setProperty('--ge-map-player-column', String(position.x + 1))
      player?.style.setProperty('--ge-map-player-row', String(position.y + 1))
      panTo(
        position.x - Math.floor((viewport.columns - 1) / 2),
        position.y - Math.floor((viewport.rows - 1) / 2),
      )
    }

    if (playerPosition) showPlayer(playerPosition)
    else panTo(viewport.x, viewport.y)

    const unsubscribeMovement = sharedMovement
      ? movement.subscribeChanges(() => {
          const position = movement.getPosition(scene, component.id)

          if (position) {
            playerPosition = position
            showPlayer(position)
          }
        })
      : undefined

    const moveMap = (heading: MapDirection) => {
      if (sharedMovement) {
        movement.move(scene, component.id, heading)

        return
      }

      const direction = mapDirections[heading]

      if (playerPosition) {
        if (cancelStep) return

        const destination = {
          x: playerPosition.x + direction.x,
          y: playerPosition.y + direction.y,
        }

        const duration = getMapMovementCostMs(map, destination)

        if (duration === undefined) return

        const arrive = () => {
          cancelStep = undefined
          playerPosition = destination
          showPlayer(destination)
        }

        if (duration === 0) arrive()
        else
          cancelStep = createBrowserTiming(document.defaultView ?? window).scheduler.schedule(
            arrive,
            duration,
          )
      } else panTo(x + direction.x, y + direction.y)
    }

    return {
      moveMap,
      dispose() {
        active = false

        for (const entry of objectButtons)
          entry.element.removeEventListener('click', entry.activate)
        images.dispose()
        cancelStep?.()
        unsubscribeMovement?.()
        unsubscribeObjects?.()
        clip.remove()
      },
    }
  }
}
