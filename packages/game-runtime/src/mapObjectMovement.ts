import {
  getMapTerrainCostMs,
  getMapMovementCostMs,
  isBlockingMapObject,
  mapDirections,
  resolveMapObject,
  type GameSave,
  type MapDefinition,
  type MapObject,
  type MapObjectStateReader,
  type MapPosition,
} from '@ancadeba/schemas'
import type { IMonotonicClock, ITaskScheduler } from '@ancadeba/utilities'
import type { MapDirection } from './mapMovement.js'

type SavedObjects = NonNullable<GameSave['mapObjectPositions']>

type ObjectState = SavedObjects[string][string] & { due?: number | undefined }

function sameTile(a: MapPosition, b: MapPosition): boolean {
  return a.x === b.x && a.y === b.y
}

/** Owns map-object positions and one gameplay alarm shared by all active patrols. */
export class MapObjectMovement {
  private readonly states = new Map<MapObject, ObjectState>()
  private active = new Set<MapDefinition>()
  private cancel: (() => void) | undefined
  private disposed = false

  constructor(
    private readonly maps: ReadonlyMap<string, MapDefinition>,
    private readonly timing: IMonotonicClock & ITaskScheduler,
    private readonly read: MapObjectStateReader,
    private readonly playerOccupies: (map: MapDefinition, point: MapPosition) => boolean,
    private readonly notify: () => void,
  ) {}

  position(object: MapObject): MapPosition {
    return this.states.get(object)?.position ?? object
  }

  tileCost(map: MapDefinition, point: MapPosition, read = this.read, moving?: MapObject) {
    return getMapMovementCostMs(
      map,
      point,
      (object) => object !== moving && isBlockingMapObject(resolveMapObject(object, read)),
      (object) => this.position(object),
    )
  }

  private state(object: MapObject): ObjectState {
    let state = this.states.get(object)

    if (!state) {
      const trigger = object.patrol?.trigger
      state = {
        position: Object.freeze({ x: object.x, y: object.y }),
        routeIndex: object.patrol ? 0 : -1,
        direction: 1,
        ...(trigger?.type === 'timer' && { remainingMs: trigger.intervalMs }),
      }
      this.states.set(object, state)
    }

    return state
  }

  prepareStep(mapId: string, id: string, direction: MapDirection) {
    const map = this.maps.get(mapId)
    const object = map?.objects?.find((entry) => entry.id === id)

    if (this.disposed || !map || !object) return
    const from = this.position(object)
    const offset = mapDirections[direction]
    const to = { x: from.x + offset.x, y: from.y + offset.y }

    const isCurrent = () =>
      !this.disposed &&
      sameTile(this.position(object), from) &&
      this.tileCost(map, to, this.read, object) !== undefined &&
      !this.playerOccupies(map, to)

    if (!isCurrent()) return

    return {
      isCurrent,
      commit: () => {
        const state = this.state(object)

        if (!isCurrent()) throw new Error('Map object step is no longer available')
        state.position = Object.freeze(to)
        state.routeIndex = object.patrol?.route.findIndex((point) => sameTile(point, to)) ?? -1
        this.syncTimers()
      },
      notify: this.notify,
    }
  }

  private advance(map: MapDefinition, object: MapObject): boolean {
    const patrol = object.patrol

    if (!patrol) return false
    const state = this.state(object)

    if (state.routeIndex < 0) return false
    let direction = state.direction

    if (patrol.mode === 'reverse') {
      if (state.routeIndex === patrol.route.length - 1) direction = -1
      else if (state.routeIndex === 0) direction = 1
    }

    const next = (state.routeIndex + direction + patrol.route.length) % patrol.route.length
    const to = patrol.route[next]!

    if (this.playerOccupies(map, to) || this.tileCost(map, to, this.read, object) === undefined)
      return false
    state.position = Object.freeze({ ...to })
    state.routeIndex = next
    state.direction = direction

    return true
  }

  advancePlayer(stepMap?: MapDefinition, spendsTurn = true): boolean {
    let changed = false

    for (const map of this.active) {
      if (stepMap && map !== stepMap) continue

      for (const object of map.objects ?? []) {
        const trigger = object.patrol?.trigger.type

        if ((trigger === 'player-step' && stepMap) || (trigger === 'player-turn' && spendsTurn))
          changed = this.advance(map, object) || changed
      }
    }

    return changed
  }

  setActive(maps: Set<MapDefinition>): void {
    if (this.disposed) return
    this.active = maps
    this.syncTimers()
  }

  private syncTimers(): void {
    this.cancel?.()
    this.cancel = undefined
    const now = this.timing.now()
    let earliest = Infinity

    for (const map of this.maps.values()) {
      for (const object of map.objects ?? []) {
        if (object.patrol?.trigger.type !== 'timer') continue

        if (!this.active.has(map) && !this.states.has(object)) continue
        const state = this.state(object)

        if (this.active.has(map) && state.routeIndex >= 0) {
          state.due ??= now + state.remainingMs!
          earliest = Math.min(earliest, state.due)
        } else if (state.due !== undefined) {
          state.remainingMs = Math.max(0, state.due - now)
          state.due = undefined
        }
      }
    }

    if (Number.isFinite(earliest))
      this.cancel = this.timing.schedule(() => this.tick(), Math.max(0, earliest - now))
  }

  private tick(): void {
    const now = this.timing.now()
    let changed = false

    for (const map of this.active) {
      for (const object of map.objects ?? []) {
        const state = this.states.get(object)
        const trigger = object.patrol?.trigger

        if (state?.due === undefined || state.due > now || trigger?.type !== 'timer') continue
        state.due = now + trigger.intervalMs
        changed = this.advance(map, object) || changed
      }
    }

    this.syncTimers()

    if (changed) this.notify()
  }

  save(): SavedObjects {
    const maps = new Map<string, SavedObjects[string]>()

    for (const [id, map] of this.maps) {
      const entries = new Map<string, SavedObjects[string][string]>()

      for (const object of map.objects ?? []) {
        const state = this.states.get(object)

        if (!state) continue
        const { position, routeIndex, direction, remainingMs, due } = state
        entries.set(object.id, {
          position: { ...position },
          routeIndex,
          direction,
          ...(remainingMs !== undefined && {
            remainingMs: due === undefined ? remainingMs : Math.max(0, due - this.timing.now()),
          }),
        })
      }

      if (entries.size) maps.set(id, Object.fromEntries(entries))
    }

    return Object.fromEntries(maps)
  }

  restore(saved: SavedObjects): void {
    const restored = new Map<MapObject, ObjectState>()

    for (const [id, entries] of Object.entries(saved)) {
      const map = this.maps.get(id)

      if (!map) throw new Error('Unknown saved object map')

      for (const [key, state] of Object.entries(entries)) {
        const object = map.objects?.find((entry) => entry.id === key)
        const patrol = object?.patrol
        const tile = patrol?.route[state.routeIndex]
        const trigger = patrol?.trigger

        if (
          !object ||
          getMapTerrainCostMs(map, state.position) === undefined ||
          (state.routeIndex === -1
            ? patrol?.route.some((point) => sameTile(point, state.position))
            : !tile || !sameTile(tile, state.position)) ||
          (state.direction === -1 && patrol?.mode !== 'reverse') ||
          (trigger?.type === 'timer'
            ? state.remainingMs === undefined || state.remainingMs > trigger.intervalMs
            : state.remainingMs !== undefined)
        )
          throw new Error('Invalid saved map object movement')
        restored.set(object, { ...state, position: Object.freeze({ ...state.position }) })
      }
    }

    this.states.clear()

    for (const [object, state] of restored) this.states.set(object, state)
    this.syncTimers()
  }

  dispose(): void {
    this.disposed = true
    this.cancel?.()
    this.active.clear()
    this.states.clear()
  }
}
