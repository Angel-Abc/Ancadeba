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

type ObjectState = SavedObjects[string][string] & {
  due?: number | undefined
  engaged?: boolean
}

function distance(a: MapPosition, b: MapPosition): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function sameTile(a: MapPosition, b: MapPosition): boolean {
  return a.x === b.x && a.y === b.y
}

/** Owns map-object positions and one gameplay alarm shared by all active patrols. */
export class MapObjectMovement {
  private readonly states = new Map<MapObject, ObjectState>()
  private active = new Set<MapDefinition>()
  private lastGameplayMaps = this.active
  private readonly guardOwners = new Map<MapObject, MapObject>()
  private alarmDue: number | undefined
  private cancel: (() => void) | undefined
  private disposed = false

  constructor(
    private readonly maps: ReadonlyMap<string, MapDefinition>,
    private readonly timing: IMonotonicClock & ITaskScheduler,
    private readonly read: MapObjectStateReader,
    private readonly playerOccupies: (map: MapDefinition, point: MapPosition) => boolean,
    private readonly playersOn: (map: MapDefinition) => readonly MapPosition[],
    private readonly notify: () => void,
  ) {
    for (const map of maps.values()) {
      for (const owner of map.objects ?? []) {
        const approach = owner.patrol?.approach

        if (!approach) continue
        const guard = map.objects?.find((object) => object.id === approach.guard)

        if (guard) this.guardOwners.set(guard, owner)
      }
    }
  }

  present(object: MapObject): boolean {
    const owner = this.guardOwners.get(object)

    return owner
      ? Boolean(this.states.get(owner)?.guardPosition)
      : !this.states.get(object)?.departed
  }

  position(object: MapObject): MapPosition {
    const owner = this.guardOwners.get(object)

    return (
      (owner ? this.states.get(owner)?.guardPosition : this.states.get(object)?.position) ?? object
    )
  }

  tileCost(map: MapDefinition, point: MapPosition, read = this.read, moving?: MapObject) {
    return getMapMovementCostMs(
      map,
      point,
      (object) =>
        object !== moving &&
        this.present(object) &&
        isBlockingMapObject(resolveMapObject(object, read)),
      (object) => this.position(object),
    )
  }

  preparePatrolWarning(mapId: string, patrol: string) {
    const map = this.maps.get(mapId)
    const owner = map?.objects?.find((entry) => entry.id === patrol)
    const state = owner && this.states.get(owner)

    if (!map || !this.active.has(map) || !state?.guardPosition) return
    const guard = state.guardPosition

    return () => {
      if (state.guardPosition === guard) state.warning ??= 'armed'
    }
  }

  prepareWarnedApproaches(map: MapDefinition, from: MapPosition, to: MapPosition) {
    return (map.objects ?? []).flatMap((owner) => {
      const action = owner.patrol?.approach?.onWarnedApproach

      if (!action) return []
      const state = this.state(owner)
      const wagonAtDeparture = state.position

      return [
        {
          action,
          patrol: owner.id,
          consume: () => {
            if (
              state.warning !== 'armed' ||
              distance(to, wagonAtDeparture) >= distance(from, wagonAtDeparture)
            )
              return false
            state.warning = 'fired'

            return true
          },
        },
      ]
    })
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
      this.present(object) &&
      !this.guardOwners.has(object) &&
      !this.states.get(object)?.engaged &&
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
        this.finishRoute(object, state)
        this.refresh()
      },
      notify: this.notify,
    }
  }

  private advance(map: MapDefinition, object: MapObject): boolean {
    const patrol = object.patrol

    if (!patrol) return false
    const state = this.state(object)

    if (state.routeIndex < 0 || state.departed || state.engaged) return false
    const interval = patrol.trigger.type === 'player-turn' ? (patrol.trigger.intervalTurns ?? 1) : 1

    if (interval > 1) {
      const elapsed = (state.turnsElapsed ?? 0) + 1

      if (elapsed < interval) {
        state.turnsElapsed = elapsed

        return true
      }

      delete state.turnsElapsed
    }

    let direction = state.direction

    if (patrol.mode === 'reverse') {
      if (state.routeIndex === patrol.route.length - 1) direction = -1
      else if (state.routeIndex === 0) direction = 1
    }

    const next = (state.routeIndex + direction + patrol.route.length) % patrol.route.length
    const to = patrol.route[next]!

    if (this.playerOccupies(map, to) || this.tileCost(map, to, this.read, object) === undefined)
      return interval > 1
    state.position = Object.freeze({ ...to })
    state.routeIndex = next
    state.direction = direction
    this.finishRoute(object, state)
    this.updateEncounter(map, object, state)

    return true
  }

  private finishRoute(object: MapObject, state: ObjectState): void {
    const patrol = object.patrol

    if (patrol?.mode !== 'one-way' || state.routeIndex !== patrol.route.length - 1) return
    state.departed = true
    state.due = undefined
    state.remainingMs = patrol.returnDelayMs
    delete state.guardPosition
    delete state.encounterComplete
    delete state.turnsElapsed
    delete state.warning
    delete state.engaged
  }

  private openTile(map: MapDefinition, point: MapPosition): boolean {
    return (
      getMapTerrainCostMs(map, point) !== undefined &&
      !this.playerOccupies(map, point) &&
      !map.objects?.some(
        (object) =>
          this.present(object) &&
          sameTile(this.position(object), point) &&
          resolveMapObject(object, this.read).visible !== false,
      )
    )
  }

  private dismissGuard(state: ObjectState): boolean {
    delete state.engaged
    delete state.warning

    if (!state.guardPosition) return false
    delete state.guardPosition
    state.encounterComplete = true

    return true
  }

  private updateEncounter(map: MapDefinition, object: MapObject, state: ObjectState): boolean {
    const approach = object.patrol?.approach

    if (!approach || state.encounterComplete || state.departed) return false
    const players = this.playersOn(map)

    const near = players.some(
      (player) =>
        distance(player, state.position) <= approach.radius ||
        (state.guardPosition && distance(player, state.guardPosition) <= 1),
    )

    const guard = map.objects?.find((entry) => entry.id === approach.guard)

    if (
      !near ||
      !guard ||
      resolveMapObject(guard, this.read).visible === false ||
      resolveMapObject(object, this.read).visible === false
    )
      return this.dismissGuard(state)
    state.engaged = true

    if (state.guardPosition) return false

    const nearest = (tile: MapPosition) =>
      Math.min(...players.map((player) => distance(tile, player)))

    const tiles = Object.values(mapDirections)
      .map((offset) => ({
        x: state.position.x + offset.x,
        y: state.position.y + offset.y,
      }))
      .filter((tile) => this.openTile(map, tile))

    tiles.sort((a, b) => nearest(a) - nearest(b))

    if (!tiles[0]) return false
    state.guardPosition = Object.freeze(tiles[0])

    return true
  }

  private returnToStart(map: MapDefinition, object: MapObject, state: ObjectState): boolean {
    if (!state.departed || state.remainingMs !== 0 || !this.openTile(map, object)) return false
    this.states.delete(object)
    this.updateEncounter(map, object, this.state(object))

    return true
  }

  advancePlayer(stepMap?: MapDefinition, spendsTurn = true): boolean {
    let changed = false

    for (const map of this.active) {
      if (stepMap && map !== stepMap) continue

      for (const object of map.objects ?? []) {
        if (object.patrol?.approach)
          changed = this.updateEncounter(map, object, this.state(object)) || changed
        const trigger = object.patrol?.trigger.type

        if ((trigger === 'player-step' && stepMap) || (trigger === 'player-turn' && spendsTurn))
          changed = this.advance(map, object) || changed
      }
    }

    return this.refresh() || changed
  }

  setActive(maps: Set<MapDefinition>, menuOpen: boolean): boolean {
    if (this.disposed) return false
    let changed = false

    if (!menuOpen) {
      // A menu can lead directly to another map instead of resuming the suspended one.
      for (const map of this.lastGameplayMaps) {
        if (maps.has(map)) continue

        for (const object of map.objects ?? []) {
          const state = this.states.get(object)

          if (state?.engaged || state?.guardPosition) changed = this.dismissGuard(state) || changed
        }
      }

      this.lastGameplayMaps = maps
    }

    this.active = maps

    return this.refresh() || changed
  }

  refresh(): boolean {
    let changed = false

    for (const map of this.active) {
      for (const object of map.objects ?? []) {
        if (object.patrol?.mode !== 'one-way') continue
        const state = this.state(object)
        changed = this.returnToStart(map, object, state) || changed
        changed = this.updateEncounter(map, object, this.state(object)) || changed
      }
    }

    this.syncTimers()

    return changed
  }

  private syncTimers(): void {
    const now = this.timing.now()
    let earliest = Infinity

    for (const map of this.maps.values()) {
      for (const object of map.objects ?? []) {
        const patrol = object.patrol

        if (!patrol || (patrol.trigger.type !== 'timer' && patrol.returnDelayMs === undefined))
          continue

        if (!this.active.has(map) && !this.states.has(object)) continue
        const state = this.state(object)

        const running = state.departed
          ? state.remainingMs !== undefined && state.remainingMs > 0
          : patrol.trigger.type === 'timer' && state.routeIndex >= 0 && !state.engaged

        if (this.active.has(map) && running) {
          state.due ??= now + state.remainingMs!
          earliest = Math.min(earliest, state.due)
        } else if (state.due !== undefined) {
          state.remainingMs = Math.max(0, state.due - now)
          state.due = undefined
        }
      }
    }

    const next = Number.isFinite(earliest) ? earliest : undefined

    if (next === this.alarmDue) return
    this.cancel?.()
    this.alarmDue = next
    this.cancel =
      next === undefined
        ? undefined
        : this.timing.schedule(() => this.tick(), Math.max(0, next - now))
  }

  private tick(): void {
    this.alarmDue = undefined
    this.cancel = undefined
    const now = this.timing.now()
    let changed = false

    for (const map of this.active) {
      for (const object of map.objects ?? []) {
        const state = this.states.get(object)

        if (state?.due === undefined || state.due > now) continue
        state.due = undefined

        if (state.departed) {
          state.remainingMs = 0
          changed = this.returnToStart(map, object, state) || changed
        } else if (object.patrol?.trigger.type === 'timer') {
          state.remainingMs = object.patrol.trigger.intervalMs
          changed = this.advance(map, object) || changed
        }
      }
    }

    if (this.refresh() || changed) this.notify()
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
          ...(state.departed && { departed: true }),
          ...(state.encounterComplete && { encounterComplete: true }),
          ...(state.warning && { warning: state.warning }),
          ...(state.turnsElapsed !== undefined && { turnsElapsed: state.turnsElapsed }),
          ...(state.guardPosition && { guardPosition: { ...state.guardPosition } }),
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

        const maxRemaining = state.departed
          ? patrol?.returnDelayMs
          : trigger?.type === 'timer'
            ? trigger.intervalMs
            : undefined

        if (
          !object ||
          getMapTerrainCostMs(map, state.position) === undefined ||
          (state.routeIndex === -1
            ? patrol?.route.some((point) => sameTile(point, state.position))
            : !tile || !sameTile(tile, state.position)) ||
          (state.direction === -1 && patrol?.mode !== 'reverse') ||
          (state.turnsElapsed !== undefined &&
            (state.departed ||
              trigger?.type !== 'player-turn' ||
              state.turnsElapsed >= (trigger.intervalTurns ?? 1))) ||
          this.guardOwners.has(object) ||
          Boolean(state.departed) !==
            (patrol?.mode === 'one-way' && state.routeIndex === patrol.route.length - 1) ||
          ((state.encounterComplete || state.guardPosition) &&
            (!patrol?.approach || state.departed)) ||
          (state.warning && !state.guardPosition) ||
          (state.guardPosition &&
            (state.encounterComplete ||
              distance(state.guardPosition, state.position) !== 1 ||
              getMapTerrainCostMs(map, state.guardPosition) === undefined)) ||
          (maxRemaining === undefined
            ? state.remainingMs !== undefined
            : state.remainingMs === undefined || state.remainingMs > maxRemaining)
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
