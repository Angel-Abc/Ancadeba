import {
  mapDirections,
  type MapObject,
  getMapPotentialMovementCostMs,
  type MapDefinition,
  type MapObjectStateReader,
  type MapPosition,
  type ButtonComponentDefinition,
  type GameSave,
  type MapEntryTrigger,
} from '@ancadeba/schemas'
import type { IMonotonicClock, ITaskScheduler } from '@ancadeba/utilities'
import type { GameInstance, IGameLifecycle, SceneInstance } from './gameLifecycle.js'
import { GameSaveError } from './gameSaves.js'
import type { GameData } from './gameData.js'
import type { PreparedProgression } from './progression.js'
import { MapObjectMovement } from './mapObjectMovement.js'

export type MapDirection = Extract<
  NonNullable<ButtonComponentDefinition['action']>,
  { type: 'move-map' }
>['direction']

export interface IGameMapMovement {
  readonly playerMap: string | undefined
  getMap(scene: SceneInstance, mapView: string): MapDefinition | undefined
  objectPosition(object: MapObject): Readonly<MapPosition>
  prepareObjectStep(
    map: string,
    object: string,
    direction: MapDirection,
  ):
    | {
        isCurrent(): boolean
        commit(): void
        notify(): void
      }
    | undefined
  getTileCost(
    map: MapDefinition,
    position: MapPosition,
    read?: MapObjectStateReader,
  ): number | undefined
  getPosition(scene: SceneInstance, mapView: string): Readonly<MapPosition> | undefined
  canMove(scene: SceneInstance, mapView: string, direction: MapDirection): boolean
  isMoving(scene: SceneInstance, mapView: string): boolean
  move(scene: SceneInstance, mapView: string, direction: MapDirection): boolean
  place(scene: SceneInstance, mapView: string, position: Readonly<MapPosition>, map?: string): void
  subscribeChanges(listener: () => void): () => void
}

interface MapState {
  position: Readonly<MapPosition>
  pending?: object | undefined
  cancel?: (() => void) | undefined
}

/** Owns each scene's map-view positions for the lifetime of a playthrough. */
export class GameMapMovement implements IGameMapMovement {
  private readonly objects: MapObjectMovement
  private started = false
  private player: (MapState & { map: string }) | undefined
  private scene: SceneInstance | undefined
  private readonly maps = new Map<string, Map<string, MapState>>()
  private readonly listeners = new Set<() => void>()
  private readonly unsubscribe: () => void
  private readonly unsubscribeState: (() => void) | undefined
  private disposed = false

  /** Paused menus may capture committed tiles without changing the unfinished live step. */
  saveLocations(
    allowPending = false,
  ): Pick<GameSave, 'mapPositions' | 'playerLocation' | 'mapObjectPositions'> {
    if (
      !allowPending &&
      (this.player?.pending ||
        [...this.maps.values()].some((maps) => [...maps.values()].some((state) => state.pending)))
    )
      throw new GameSaveError('busy')

    const mapPositions = Object.fromEntries(
      [...this.maps].map(([scene, maps]) => [
        scene,
        Object.fromEntries([...maps].map(([id, state]) => [id, { ...state.position }])),
      ]),
    )

    return {
      mapPositions,
      mapObjectPositions: this.objects.save(),
      ...(this.player && {
        playerLocation: { map: this.player.map, position: { ...this.player.position } },
      }),
    }
  }

  /** Validate all locations before publishing them, including scenes that are not active. */
  restoreLocations(
    data: GameData,
    {
      mapPositions,
      playerLocation,
      mapObjectPositions,
    }: Pick<GameSave, 'mapPositions' | 'playerLocation' | 'mapObjectPositions'>,
  ): void {
    this.objects.restore(mapObjectPositions ?? {})

    if (playerLocation) {
      const map = data.maps?.get(playerLocation.map)

      if (!map || this.potentialCost(map, playerLocation.position) === undefined)
        throw new Error('Invalid saved player location')
    }

    const restored = new Map<string, Map<string, MapState>>()

    for (const [sceneId, maps] of Object.entries(mapPositions)) {
      const scene = data.scenes.get(sceneId)

      if (scene?.type !== 'game') throw new Error('Invalid saved map scene')
      const states = new Map<string, MapState>()

      for (const [id, position] of Object.entries(maps)) {
        const component = scene.components.find((component) => component.id === id)

        if (
          component?.type !== 'map-view' ||
          component.followPlayer ||
          !component.playerSpawn ||
          component.interactive === false ||
          this.potentialCost(component.map, position) === undefined
        )
          throw new Error('Invalid saved map position')
        states.set(id, { position: Object.freeze({ ...position }) })
      }

      restored.set(sceneId, states)
    }

    this.cancelSteps()
    this.maps.clear()
    this.player = playerLocation && {
      map: playerLocation.map,
      position: Object.freeze({ ...playerLocation.position }),
    }

    for (const [scene, maps] of restored) this.maps.set(scene, maps)
  }

  constructor(
    private readonly lifecycle: IGameLifecycle,
    private readonly scheduler: ITaskScheduler & IMonotonicClock,
    private readonly game: GameInstance,
    private readonly actorTurns: boolean,
    private readonly onTileEntry?: (
      scene: SceneInstance,
      mapView: string,
      trigger: MapEntryTrigger,
    ) => void,
    objectState?: {
      read: MapObjectStateReader
      subscribe(listener: () => void): () => void
    },
    private readonly prepareProgression?: (cost: number) => PreparedProgression | undefined,
  ) {
    const maps =
      game.data.maps ??
      new Map(
        Array.from(game.data.scenes.values()).flatMap((scene) =>
          scene.components.flatMap((view) =>
            view.type === 'map-view' ? [[view.mapId, view.map] as const] : [],
          ),
        ),
      )

    this.objects = new MapObjectMovement(
      maps,
      scheduler,
      objectState?.read ?? (() => undefined),
      (map, point) => this.playerOccupies(map, point),
      () => this.notify(),
    )
    this.unsubscribe = lifecycle.subscribeSceneChanges(({ current }) => {
      if (current === this.scene) {
        this.refreshMaps()

        return
      }

      const changed = this.scene !== undefined
      this.cancelSteps()

      if (!this.player && current?.type === 'game' && current.game === this.game) {
        const first = current.data.components.find(
          (view) => view.type === 'map-view' && view.followPlayer,
        )

        if (first) this.resolve(current, first.id)
      }

      this.refreshMaps()

      if (changed) this.notify()
    })

    if (
      Array.from(maps.values()).some((map) => map.objects?.some((object) => object.states?.length))
    )
      this.unsubscribeState = objectState?.subscribe(() => this.notify())
  }

  getTileCost(
    map: MapDefinition,
    position: MapPosition,
    read?: MapObjectStateReader,
  ): number | undefined {
    return this.objects.tileCost(map, position, read)
  }

  private potentialCost(map: MapDefinition, point: MapPosition) {
    return getMapPotentialMovementCostMs(map, point, {
      positionOf: (object) => this.objects.position(object),
    })
  }

  objectPosition(object: MapObject): Readonly<MapPosition> {
    return this.objects.position(object)
  }

  prepareObjectStep(map: string, object: string, direction: MapDirection) {
    return this.objects.prepareStep(map, object, direction)
  }

  playerTurn(): void {
    if (this.objects.advancePlayer()) this.notify()
  }

  start(): void {
    this.started = true
    this.refreshMaps()
  }

  private playerOccupies(map: MapDefinition, point: MapPosition): boolean {
    const scene = this.lifecycle.activeScene

    if (scene?.type !== 'game' || scene.game !== this.game) return false

    return scene.data.components.some((view) => {
      if (view.type !== 'map-view' || this.getMap(scene, view.id) !== map) return false
      const player = this.getPosition(scene, view.id)

      return player?.x === point.x && player.y === point.y
    })
  }

  private refreshMaps(): void {
    if (!this.started) return
    const maps = new Set<MapDefinition>()
    const scene = this.lifecycle.activeScene

    if (scene?.type === 'game' && scene.game === this.game) {
      for (const view of scene.data.components) {
        if (view.type !== 'map-view' || !view.playerSpawn || view.interactive === false) continue
        const active = this.getMap(scene, view.id)

        if (active) maps.add(active)
      }
    }

    this.objects.setActive(maps)
  }

  private resolve(scene: SceneInstance, mapView: string) {
    if (
      this.disposed ||
      scene.disposed ||
      scene !== this.lifecycle.activeScene ||
      scene.type !== 'game'
    )
      return
    const component = scene.data.components.find((entry) => entry.id === mapView)

    if (component?.type !== 'map-view' || !component.playerSpawn || component.interactive === false)
      return

    if (this.scene !== scene) {
      this.cancelSteps()
      this.scene = scene
    }

    if (component.followPlayer) {
      this.player ??= {
        map: component.mapId,
        position: Object.freeze({ ...component.playerSpawn }),
      }
      const map = scene.game.data.maps?.get(this.player.map)

      if (!map) return

      return { state: this.player, component, map }
    }

    let maps = this.maps.get(scene.data.id)

    if (!maps) {
      maps = new Map()
      this.maps.set(scene.data.id, maps)
    }

    let state = maps.get(mapView)

    if (!state) {
      state = { position: Object.freeze({ ...component.playerSpawn }) }
      maps.set(mapView, state)
    }

    return { component, state, map: component.map }
  }

  get playerMap(): string | undefined {
    return this.player?.map
  }

  getMap(scene: SceneInstance, mapView: string): MapDefinition | undefined {
    if (this.disposed || scene.disposed || scene !== this.lifecycle.activeScene) return
    const view = scene.data.components.find((entry) => entry.id === mapView)

    if (view?.type !== 'map-view') return

    return view.followPlayer && this.player && scene.type === 'game'
      ? scene.game.data.maps?.get(this.player.map)
      : view.map
  }

  getPosition(scene: SceneInstance, mapView: string): Readonly<MapPosition> | undefined {
    return this.resolve(scene, mapView)?.state.position
  }

  isMoving(scene: SceneInstance, mapView: string): boolean {
    return Boolean(this.resolve(scene, mapView)?.state.pending)
  }

  /** Place an arriving player without walking, charging a delay, or firing entry triggers. */
  place(
    scene: SceneInstance,
    mapView: string,
    position: Readonly<MapPosition>,
    mapId?: string,
  ): void {
    const resolved = this.resolve(scene, mapView)

    const map =
      mapId === undefined
        ? resolved?.map
        : scene.type === 'game' &&
          resolved?.component.followPlayer &&
          scene.game.data.maps?.get(mapId)

    if (!resolved || !map || this.getTileCost(map, position) === undefined)
      throw new Error('Invalid destination map position')
    resolved.state.cancel?.()
    resolved.state.cancel = undefined
    resolved.state.pending = undefined

    if (mapId && this.player) this.player.map = mapId
    resolved.state.position = Object.freeze({ ...position })
    this.refreshMaps()
    this.notify()
  }

  private destination(scene: SceneInstance, mapView: string, direction: MapDirection) {
    const resolved = this.resolve(scene, mapView)

    if (!resolved || resolved.state.pending) return
    const step = mapDirections[direction]

    const position = {
      x: resolved.state.position.x + step.x,
      y: resolved.state.position.y + step.y,
    }

    const duration = this.getTileCost(resolved.map, position)

    return duration === undefined
      ? undefined
      : { state: resolved.state, map: resolved.map, position, duration }
  }

  canMove(scene: SceneInstance, mapView: string, direction: MapDirection): boolean {
    return this.destination(scene, mapView, direction) !== undefined
  }

  move(scene: SceneInstance, mapView: string, direction: MapDirection): boolean {
    const destination = this.destination(scene, mapView, direction)

    if (!destination) return false
    const { state, map, position, duration } = destination

    const arrive = () => {
      const progression = this.prepareProgression?.(duration)

      if (this.prepareProgression && !progression?.isCurrent()) {
        this.notify()

        return false
      }

      state.position = Object.freeze(position)
      progression?.commit()
      this.objects.advancePlayer(map, !this.actorTurns)
      const errors: unknown[] = []

      for (const notify of [
        () => progression?.notify(),
        () => this.notify(),
        () => {
          if (
            !this.disposed &&
            !scene.disposed &&
            this.lifecycle.activeScene === scene &&
            state.position === position &&
            this.getMap(scene, mapView) === map
          ) {
            const trigger = map.entryTriggers?.find(
              (entry) => entry.x === position.x && entry.y === position.y,
            )

            if (trigger) this.onTileEntry?.(scene, mapView, trigger)
          }
        },
      ]) {
        try {
          notify()
        } catch (error) {
          errors.push(error)
        }
      }

      if (errors.length) throw new AggregateError(errors, 'Map arrival subscribers failed')

      return true
    }

    if (duration === 0) return arrive()
    const token = {}
    state.pending = token

    try {
      state.cancel = this.scheduler.schedule(() => {
        if (
          this.disposed ||
          scene.disposed ||
          this.lifecycle.activeScene !== scene ||
          this.scene !== scene ||
          state.pending !== token
        )
          return
        state.pending = undefined
        state.cancel = undefined

        if (this.getTileCost(map, position) === undefined) {
          this.notify()

          return
        }

        arrive()
      }, duration)
    } catch (error) {
      state.pending = undefined
      throw error
    }

    this.notify()

    return true
  }

  subscribeChanges(listener: () => void): () => void {
    if (this.disposed) return () => {}

    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  private notify(): void {
    const errors: unknown[] = []

    for (const listener of [...this.listeners]) {
      if (!this.listeners.has(listener)) continue

      try {
        listener()
      } catch (error) {
        errors.push(error)
      }
    }

    if (errors.length) throw new AggregateError(errors, 'Map movement subscribers failed')
  }

  private cancelSteps(): void {
    const cancelStep = (state: MapState) => {
      state.pending = undefined
      const cancel = state.cancel
      state.cancel = undefined
      cancel?.()
    }

    if (this.player) cancelStep(this.player)

    for (const maps of this.maps.values()) for (const state of maps.values()) cancelStep(state)

    this.scene = undefined
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.objects.dispose()
    this.unsubscribe()
    this.unsubscribeState?.()
    this.cancelSteps()
    this.maps.clear()
    this.player = undefined
    this.listeners.clear()
  }
}
