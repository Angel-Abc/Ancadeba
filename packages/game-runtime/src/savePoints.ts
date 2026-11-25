import type { SceneComponentData } from './gameData.js'
import type { IGameLifecycle, SceneInstance } from './gameLifecycle.js'

export function isAtSavePoint(
  scene: SceneInstance,
  point: Extract<SceneComponentData, { type: 'save-point' }>,
): boolean {
  if (scene.type !== 'game' || scene.disposed) return false

  if (!point.location) return true
  const movement = scene.game.mapMovement
  const current = movement?.getPosition(scene, point.location.mapView)
  const view = scene.data.components.find(({ id }) => id === point.location!.mapView)

  if (
    view?.type === 'map-view' &&
    view.followPlayer &&
    movement?.playerMap !== (point.location.map ?? view.mapId)
  )
    return false

  return Boolean(
    current &&
    Math.abs(current.x - point.location.position.x) +
      Math.abs(current.y - point.location.position.y) <=
      point.location.radius,
  )
}

export function hasSavePoint(lifecycle: IGameLifecycle): boolean {
  const scene = lifecycle.suspendedScene ?? lifecycle.activeScene

  return Boolean(
    scene?.type === 'game' &&
    scene.data.components.some(
      (component) => component.type === 'save-point' && isAtSavePoint(scene, component),
    ),
  )
}
