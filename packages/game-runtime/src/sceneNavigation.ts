import {
  getMapMovementCostMs,
  isBlockingMapObject,
  mapPositionSchema,
  resolveMapObject,
  type SceneTransition,
  type MapObjectStateReader,
} from '@ancadeba/schemas'
import type { GameData } from './gameData.js'
import type { IGameMapMovement } from './mapMovement.js'

/** Navigation checks use live collision, or the initial authored flags before a game starts. */
export function canEnterScene(
  game: GameData,
  action: SceneTransition,
  movement?: Pick<IGameMapMovement, 'getTileCost'>,
): boolean {
  if (!action.position) return !action.map && game.scenes.has(action.scene)

  return sceneEntranceCost(game, action, movement) !== undefined
}

export function sceneEntranceCost(
  game: GameData,
  action: SceneTransition,
  movement?: Pick<IGameMapMovement, 'getTileCost'>,
  proposedState?: MapObjectStateReader,
): number | undefined {
  const scene = game.scenes.get(action.scene)

  if (!scene) return

  if (!action.mapView) return action.position ? undefined : 0
  const view = scene.components.find(({ id }) => id === action.mapView)

  if (
    scene.type !== 'game' ||
    view?.type !== 'map-view' ||
    !view.playerSpawn ||
    (action.position &&
      (view.interactive === false || !mapPositionSchema.safeParse(action.position).success))
  )
    return

  const readInitialState = (path: readonly string[]) =>
    game.rules?.state.find((field) => JSON.stringify(field.path) === JSON.stringify(path))?.value

  const map = action.map ? view.followPlayer && game.maps?.get(action.map) : view.map

  if (!map || (action.map && !action.position)) return
  const position = action.position ?? view.playerSpawn

  return movement && !proposedState
    ? movement.getTileCost(map, position)
    : getMapMovementCostMs(map, position, (object) =>
        isBlockingMapObject(resolveMapObject(object, proposedState ?? readInitialState)),
      )
}
