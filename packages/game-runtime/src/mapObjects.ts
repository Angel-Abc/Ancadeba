import { resolveMapObject, type MapObject, type MapObjectStateReader } from '@ancadeba/schemas'
import type { IGameLifecycle, SceneInstance } from './gameLifecycle.js'
import type { IGameMapMovement } from './mapMovement.js'

export interface IGameMapObjects {
  getAppearance(scene: SceneInstance, mapView: string, object: string): MapObject | undefined
  getTarget(scene: SceneInstance, mapView: string, object?: string): MapObject | undefined
  interact(scene: SceneInstance, mapView: string, object?: string): boolean
  subscribeChanges(listener: () => void): () => void
}

/** Resolves adjacent authored objects; queued actions revalidate their captured target. */
export class GameMapObjects implements IGameMapObjects {
  private disposed = false

  constructor(
    private readonly lifecycle: IGameLifecycle,
    private readonly movement: IGameMapMovement,
    private readonly request: (action: string, payload: string, isCurrent: () => boolean) => void,
    private readonly readState?: MapObjectStateReader,
  ) {}

  getAppearance(scene: SceneInstance, mapView: string, object: string): MapObject | undefined {
    if (
      this.disposed ||
      scene.disposed ||
      scene !== this.lifecycle.activeScene ||
      scene.type !== 'game'
    )
      return
    const entry = this.movement.getMap(scene, mapView)?.objects?.find(({ id }) => id === object)

    if (!entry) return
    const appearance = resolveMapObject(entry, this.readState)
    const position = this.movement.objectPosition(entry)

    return position.x === entry.x && position.y === entry.y
      ? appearance
      : { ...appearance, x: position.x, y: position.y }
  }

  getTarget(scene: SceneInstance, mapView: string, object?: string): MapObject | undefined {
    if (
      this.disposed ||
      scene.disposed ||
      scene !== this.lifecycle.activeScene ||
      scene.type !== 'game'
    )
      return
    const position = this.movement.getPosition(scene, mapView)

    if (!position || this.movement.isMoving(scene, mapView)) return

    const targets =
      this.movement.getMap(scene, mapView)?.objects?.filter((entry) => {
        const tile = this.movement.objectPosition(entry)

        return (
          (!object || entry.id === object) &&
          resolveMapObject(entry, this.readState).visible !== false &&
          Math.abs(tile.x - position.x) + Math.abs(tile.y - position.y) === 1
        )
      }) ?? []

    if (targets.length !== 1) return
    const target = targets[0]!
    const tile = this.movement.objectPosition(target)

    return target.x === tile.x && target.y === tile.y ? target : { ...target, x: tile.x, y: tile.y }
  }

  interact(scene: SceneInstance, mapView: string, object?: string): boolean {
    const target = this.getTarget(scene, mapView, object)

    if (!target) return false
    const map = this.movement.getMap(scene, mapView)
    this.request(
      target.action,
      target.id,
      () =>
        this.movement.getMap(scene, mapView) === map &&
        this.getTarget(scene, mapView, target.id)?.id === target.id,
    )

    return true
  }

  subscribeChanges(listener: () => void): () => void {
    return this.disposed ? () => {} : this.movement.subscribeChanges(listener)
  }

  dispose(): void {
    this.disposed = true
  }
}
