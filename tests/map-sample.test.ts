import { readFile } from 'node:fs/promises'
import { describe, expect, it, onTestFinished, vi } from 'vite-plus/test'
import {
  Engine,
  GameLoader,
  type EngineMessages,
  type GameSaveStore,
  type GameRules,
} from '@ancadeba/game-runtime'
import { JsonResourceLoader, MessageBus } from '@ancadeba/utilities'

class SampleSaves implements GameSaveStore {
  readonly slots = new Map<string, string>()
  read(id: string) {
    return this.slots.get(id)
  }
  write(id: string, save: string) {
    this.slots.set(id, save)
  }
}

const playerBerries = (engine: Engine) =>
  engine.lifecycle!.currentGame!.inventory!.snapshot.filter(
    (item) =>
      item.itemType === 'berry' &&
      item.placement.type === 'carried' &&
      item.placement.owner === 'player',
  )

async function launch(store: GameSaveStore = new SampleSaves(), customRules?: GameRules) {
  let time = 0
  const tasks = new Set<{ due: number; callback: () => void }>()
  const logger = { debug: () => '', info: () => '', warn: () => '', error: () => '' }
  const applied: string[] = []
  const messages = new MessageBus<EngineMessages>()
  messages.subscribe('action.applied', ({ request }) => {
    applied.push(request.action)
  })

  const engine = new Engine(
    new GameLoader(
      new JsonResourceLoader(
        {
          readText: (path) =>
            readFile(new URL(`../sample-games/square-map/${path}`, import.meta.url), 'utf8'),
          readBytes: async (path) =>
            new Uint8Array(
              await readFile(new URL(`../sample-games/square-map/${path}`, import.meta.url)),
            ),
        },
        logger,
      ),
    ),
    { mount: () => () => {} },
    logger,
    () => messages,
    {
      saveStore: store,
      ...(customRules && { createGameRules: () => customRules }),
      clock: { now: () => time },
      scheduler: {
        schedule(callback, delay) {
          const task = { due: time + delay, callback }
          tasks.add(task)

          return () => {
            tasks.delete(task)
          }
        },
      },
    },
  )

  onTestFinished(() => engine.stop())

  const advance = (milliseconds = 0) => {
    time += milliseconds

    for (let i = 0; i < 1000; i++) {
      const task = [...tasks].find((task) => task.due <= time)

      if (!task) return
      tasks.delete(task)
      task.callback()
    }

    throw new Error('Sample messages did not settle')
  }

  await engine.start()
  advance()

  const press = (code: string) => {
    engine.input!.pressKey(code)
    engine.input!.releaseKey(code)
    advance()
  }

  const walk = (code: string) => {
    press(code)
    advance(150)
  }

  const read = (field: string) =>
    engine.lifecycle!.currentGame!.bindings!.read({ source: 'game.state', path: [field] })

  const visitVillage = () => {
    for (const code of ['KeyA', 'KeyW', 'KeyW']) walk(code)
  }

  const appearance = (id: string) =>
    engine.lifecycle!.currentGame!.mapObjects!.getAppearance(
      engine.lifecycle!.activeScene!,
      'world-map',
      id,
    )

  const place = (map: string, x: number, y: number) =>
    engine.lifecycle!.enterScene('exploration', { mapView: 'world-map', map, position: { x, y } })

  return { engine, advance, press, walk, read, visitVillage, applied, appearance, place }
}

describe('village patrols', () => {
  it('advances the step and turn patrols on arrival, and only the turn patrol on Wait', async () => {
    const { engine, advance, press, appearance, visitVillage } = await launch()
    visitVillage()
    expect(appearance('ranger')).toMatchObject({ x: 7, y: 5 })
    expect(appearance('watchman')).toMatchObject({ x: 9, y: 3 })
    press('KeyD')
    advance(149)
    expect(appearance('ranger')).toMatchObject({ x: 7, y: 5 })
    advance(1)
    expect(appearance('ranger')).toMatchObject({ x: 8, y: 5 })
    expect(appearance('watchman')).toMatchObject({ x: 9, y: 2 })
    const game = engine.lifecycle!.currentGame!
    const turn = game.actions!.progression.turn
    game.actionBar!.activate(engine.lifecycle!.activeScene!, 'movement-bar', '10')
    advance()
    expect(appearance('watchman')).toMatchObject({ x: 9, y: 1 })
    expect(appearance('ranger')).toMatchObject({ x: 8, y: 5 })
    expect(game.actions!.progression.turn).toBe(turn + 1)
    game.actions!.request('wait')
    advance()
    expect(appearance('watchman')).toMatchObject({ x: 9, y: 2 })
  })

  it('freezes the timer away from the map and restores its remaining delay in a fresh engine', async () => {
    const store = new SampleSaves()
    const first = await launch(store)
    first.visitVillage()
    first.advance(1200)
    first.walk('KeyD')
    first.advance(350)
    const game = first.engine.lifecycle!.currentGame!

    for (let index = 0; index < 2; index++) {
      game.actions!.request('wait')
      first.advance()
    }

    expect(first.appearance('watchman')).toMatchObject({ x: 9, y: 2 })
    expect(first.appearance('courier')).toMatchObject({ x: 6, y: 2 })
    first.place('coast', 8, 3)
    first.advance(9000)
    expect(first.engine.saves!.save()).toBe(true)
    first.engine.stop()
    const next = await launch(store)
    expect(next.engine.saves!.load()).toBe(true)
    next.place('village', 1, 4)
    next.advance(699)
    expect(next.appearance('courier')).toMatchObject({ x: 6, y: 2 })
    next.advance(1)
    expect(next.appearance('courier')).toMatchObject({ x: 5, y: 2 })
    expect(next.appearance('ranger')).toMatchObject({ x: 8, y: 5 })
    next.walk('KeyD')
    expect(next.appearance('watchman')).toMatchObject({ x: 9, y: 3 })
    expect(next.appearance('ranger')).toMatchObject({ x: 8, y: 6 })
    next.walk('KeyD')
    next.walk('KeyA')
    expect(next.appearance('ranger')).toMatchObject({ x: 7, y: 5 })
  })

  it('retries a blocked patrol, rejects a blocked script atomically, and resumes a scripted detour', async () => {
    const { engine, visitVillage, place, appearance, advance, press, read } = await launch()
    visitVillage()
    place('village', 6, 2)
    advance(1200)
    expect(appearance('courier')).toMatchObject({ x: 5, y: 2 })
    place('village', 5, 3)
    press('KeyE')
    expect(read('courierAside')).toMatchObject({ value: false })
    expect(appearance('courier')).toMatchObject({ x: 5, y: 2 })
    advance(1200)
    expect(appearance('courier')).toMatchObject({ x: 6, y: 2 })
    place('village', 6, 1)
    press('KeyE')
    expect(read('courierAside')).toMatchObject({ value: true })
    advance(5000)
    expect(appearance('courier')).toMatchObject({ x: 6, y: 3 })
    const game = engine.lifecycle!.currentGame!
    const scene = engine.lifecycle!.activeScene!
    expect(game.mapObjects!.getTarget(scene, 'world-map', 'courier')).toBeUndefined()
    place('village', 5, 3)
    expect(game.mapObjects!.getTarget(scene, 'world-map', 'courier')).toMatchObject({ x: 6, y: 3 })
    press('KeyE')
    expect(appearance('courier')).toMatchObject({ x: 6, y: 2 })
    advance(1200)
    expect(appearance('courier')).toMatchObject({ x: 5, y: 2 })
  })

  it('counts only the designated actor completing a turn in roster games', async () => {
    const { engine, place, appearance, advance, walk } = await launch(undefined, {
      handlers: new Map([['end', () => ({ status: 'applied', advanceTurn: true })]]),
      turns: {
        actors: ['guide', 'hero'],
        playerActorId: 'hero',
        phases: ['play'],
        actionPolicies: new Map([['end', { scope: 'actor' }]]),
      },
    })

    place('village', 1, 4)
    walk('KeyD')
    expect(appearance('ranger')).toMatchObject({ x: 8, y: 5 })
    expect(appearance('watchman')).toMatchObject({ x: 9, y: 3 })
    const actions = engine.lifecycle!.currentGame!.actions!

    for (const actorId of ['hero', 'guide']) {
      actions.request('end', undefined, { actorId })
      advance()
      expect(appearance('watchman')).toMatchObject({ x: 9, y: 3 })
    }

    actions.request('end', undefined, { actorId: 'hero' })
    advance()
    expect(appearance('watchman')).toMatchObject({ x: 9, y: 2 })
  })
})

describe('Coast Road and Pine Village interactions', () => {
  it('checks entrances on the destination map and cancels an unfinished step when switching', async () => {
    const { engine, advance } = await launch()
    const lifecycle = engine.lifecycle!
    const scene = lifecycle.activeScene!
    const movement = lifecycle.currentGame!.mapMovement!
    expect(movement.playerMap).toBe('coast')
    expect(movement.move(scene, 'world-map', 'east')).toBe(true)

    for (const map of ['missing', 'village']) {
      expect(() =>
        lifecycle.enterScene('exploration', {
          mapView: 'world-map',
          map,
          position: { x: 2, y: 3 },
        }),
      ).toThrow('Invalid destination map position')
      expect(movement.isMoving(scene, 'world-map')).toBe(true)
      expect(movement.playerMap).toBe('coast')
    }

    lifecycle.enterScene('exploration', {
      mapView: 'world-map',
      map: 'village',
      position: { x: 1, y: 4 },
    })
    advance(1000)
    expect(lifecycle.activeScene).toBe(scene)
    expect(movement.getPosition(scene, 'world-map')).toEqual({ x: 1, y: 4 })
    expect(movement.playerMap).toBe('village')
    expect(movement.isMoving(scene, 'world-map')).toBe(false)
  })

  it('collects the berry basket once, keeps it hidden across visits and save/load on its tile, and resets for a new game', async () => {
    const store = new SampleSaves()
    const first = await launch(store)
    first.visitVillage()

    for (let step = 0; step < 3; step++) first.walk('KeyD')
    const lifecycle = first.engine.lifecycle!
    const game = lifecycle.currentGame!
    const scene = lifecycle.activeScene!
    expect(playerBerries(first.engine)).toHaveLength(0)
    expect(game.mapObjects!.getTarget(scene, 'world-map')?.id).toBe('village-berries')
    expect(game.mapMovement!.canMove(scene, 'world-map', 'south')).toBe(false)
    first.press('KeyE')
    expect(playerBerries(first.engine).map(({ id }) => id)).toEqual([
      'berry-1',
      'berry-2',
      'berry-3',
    ])
    expect(first.read('berriesCollected')).toEqual({ status: 'resolved', value: true })
    expect(first.read('interactionMessage')).toEqual({
      status: 'resolved',
      value: 'You collect 3 berries. The basket is gone.',
    })
    expect(game.mapObjects!.getAppearance(scene, 'world-map', 'village-berries')?.visible).toBe(
      false,
    )
    expect(game.mapObjects!.getTarget(scene, 'world-map')).toBeUndefined()
    expect(game.actionBar!.isEnabled(scene, 'movement-bar', '12')).toBe(false)
    expect(game.mapMovement!.canMove(scene, 'world-map', 'south')).toBe(true)
    first.press('KeyE')
    expect(first.applied.filter((action) => action === 'collect-berries')).toHaveLength(1)
    first.press('KeyS')
    first.advance(200)
    expect(game.mapMovement!.getPosition(scene, 'world-map')).toEqual({ x: 4, y: 5 })
    lifecycle.enterScene('exploration', {
      map: 'coast',
      mapView: 'world-map',
      position: { x: 8, y: 3 },
    })
    lifecycle.enterScene('exploration', {
      map: 'village',
      mapView: 'world-map',
      position: { x: 4, y: 5 },
    })
    expect(
      game.mapObjects!.getAppearance(lifecycle.activeScene!, 'world-map', 'village-berries')
        ?.visible,
    ).toBe(false)
    expect(first.engine.saves!.save()).toBe(true)
    first.engine.stop()
    const restored = await launch(store)
    expect(restored.engine.saves!.load()).toBe(true)
    restored.advance()
    const loadedLifecycle = restored.engine.lifecycle!
    const loadedGame = loadedLifecycle.currentGame!
    expect(loadedGame.mapMovement!.getPosition(loadedLifecycle.activeScene!, 'world-map')).toEqual({
      x: 4,
      y: 5,
    })
    expect(
      loadedGame.mapObjects!.getAppearance(
        loadedLifecycle.activeScene!,
        'world-map',
        'village-berries',
      )?.visible,
    ).toBe(false)
    restored.walk('KeyW')
    restored.press('KeyE')
    expect(playerBerries(restored.engine)).toHaveLength(3)
    expect(restored.applied).not.toContain('collect-berries')
    loadedLifecycle.startGame()
    loadedLifecycle.enterScene('exploration', {
      map: 'village',
      mapView: 'world-map',
      position: { x: 1, y: 4 },
    })
    expect(
      loadedLifecycle.currentGame!.mapObjects!.getAppearance(
        loadedLifecycle.activeScene!,
        'world-map',
        'village-berries',
      )?.visible,
    ).not.toBe(false)
    expect(restored.read('berriesCollected')).toEqual({ status: 'resolved', value: false })
    expect(playerBerries(restored.engine)).toHaveLength(0)
    expect(
      loadedLifecycle.currentGame!.inventory!.snapshot.find(({ id }) => id === 'berry-1')
        ?.placement,
    ).toEqual({ type: 'inside', container: 'berry-basket' })
  })

  it.each(['reserved', 'missing', 'already-owned', 'stale'])(
    'rejects the entire pickup without hiding the basket or changing feedback when an item is %s',
    async (mode) => {
      const run = await launch()
      const lifecycle = run.engine.lifecycle!
      lifecycle.enterScene('exploration', {
        map: 'village',
        mapView: 'world-map',
        position: { x: 4, y: 4 },
      })
      const game = lifecycle.currentGame!
      const inventory = game.inventory!
      const token = { encounter: 'test' }

      if (mode === 'reserved') expect(inventory.reserveItem!('berry-2', token)).toBeUndefined()

      if (mode === 'missing') {
        const removal = inventory.prepareRemove!(['berry-2'])!
        removal.commit()
        removal.notify()
      }

      if (mode === 'already-owned') inventory.move('berry-2', { type: 'carried', owner: 'player' })
      const commit = vi.fn()
      const notify = vi.fn()

      const preparation =
        mode === 'stale'
          ? vi
              .spyOn(inventory, 'prepareTransfers')
              .mockReturnValue({ isCurrent: () => false, commit, notify })
          : undefined

      const before = inventory.snapshot
      run.press('KeyE')
      expect(inventory.snapshot).toEqual(before)
      expect(run.read('berriesCollected')).toEqual({ status: 'resolved', value: false })
      expect(run.read('interactionMessage')).toEqual({
        status: 'resolved',
        value: 'Press E beside an object to interact.',
      })
      expect(
        game.mapObjects!.getAppearance(lifecycle.activeScene!, 'world-map', 'village-berries')
          ?.visible,
      ).not.toBe(false)
      expect(game.mapObjects!.getTarget(lifecycle.activeScene!, 'world-map')?.id).toBe(
        'village-berries',
      )
      expect(commit).not.toHaveBeenCalled()
      expect(notify).not.toHaveBeenCalled()
      expect(run.applied).not.toContain('collect-berries')
      preparation?.mockRestore()

      if (mode === 'reserved') {
        inventory.releaseItems!(token)
        run.press('KeyE')
        expect(playerBerries(run.engine)).toHaveLength(3)
        expect(run.read('berriesCollected')).toEqual({ status: 'resolved', value: true })
      }
    },
  )

  it('commits the full pickup and collected state before notifying inventory observers, including failing observers', async () => {
    const run = await launch()
    const lifecycle = run.engine.lifecycle!
    lifecycle.enterScene('exploration', {
      map: 'village',
      mapView: 'world-map',
      position: { x: 4, y: 4 },
    })
    let notifications = 0

    const unsubscribe = lifecycle.currentGame!.inventory!.subscribeChanges(() => {
      notifications++
      expect(playerBerries(run.engine)).toHaveLength(3)
      expect(run.read('berriesCollected')).toEqual({ status: 'resolved', value: true })
      throw new Error('Inventory observer failed after commit')
    })

    run.press('KeyE')
    expect(notifications).toBe(1)
    expect(run.applied).toContain('collect-berries')
    expect(playerBerries(run.engine)).toHaveLength(3)
    run.engine.actions!.request('collect-berries', 'village-berries')
    run.advance()
    expect(notifications).toBe(1)
    expect(playerBerries(run.engine)).toHaveLength(3)
    unsubscribe()
  })

  it('reads the signpost with E only while adjacent and stationary, without breaking the exits', async () => {
    const { engine, advance, press, walk, read, visitVillage, applied } = await launch()
    const lifecycle = engine.lifecycle!
    const game = lifecycle.currentGame!
    const scene = lifecycle.activeScene!
    expect(game.mapObjects!.getTarget(scene, 'world-map')?.id).toBe('coast-signpost')
    expect(game.actionBar!.isEnabled(scene, 'movement-bar', '12')).toBe(true)
    press('KeyE')
    expect(read('signRead')).toEqual({ status: 'resolved', value: true })
    expect(read('interactionMessage')).toEqual({
      status: 'resolved',
      value: 'Signpost: Pine Village is through the gold gate at (8, 2).',
    })
    expect(read('coins')).toEqual({ status: 'resolved', value: 0 })
    expect(game.mapMovement!.canMove(scene, 'world-map', 'north')).toBe(false)
    press('KeyD')
    expect(game.mapMovement!.isMoving(scene, 'world-map')).toBe(true)
    expect(game.actionBar!.isEnabled(scene, 'movement-bar', '12')).toBe(false)
    press('KeyE')
    advance(150)
    press('KeyE')
    expect(applied).toEqual(['read-signpost'])
    expect(game.mapObjects!.getTarget(scene, 'world-map')).toBeUndefined()
    walk('KeyA')
    visitVillage()
    expect(lifecycle.currentGame!.mapMovement!.playerMap).toBe('village')
    expect(game.mapMovement!.getPosition(lifecycle.activeScene!, 'world-map')).toEqual({
      x: 1,
      y: 4,
    })
    expect(game.actionBar!.isEnabled(lifecycle.activeScene!, 'movement-bar', '12')).toBe(false)
    press('KeyE')
    expect(read('chestOpened')).toEqual({ status: 'resolved', value: false })
    walk('KeyA')
    expect(lifecycle.activeScene).toBe(scene)
    expect(game.mapMovement!.playerMap).toBe('coast')
    expect(game.mapMovement!.getPosition(lifecycle.activeScene!, 'world-map')).toEqual({
      x: 8,
      y: 3,
    })
  })

  it('awards the chest coins once, preserves the empty chest across visits and resets it for a new game', async () => {
    const { engine, press, walk, read, visitVillage } = await launch()
    visitVillage()
    walk('KeyD')
    const lifecycle = engine.lifecycle!
    const scene = lifecycle.activeScene!
    expect(lifecycle.currentGame!.mapMovement!.getPosition(scene, 'world-map')).toEqual({
      x: 2,
      y: 4,
    })
    expect(lifecycle.currentGame!.mapMovement!.canMove(scene, 'world-map', 'north')).toBe(false)
    expect(
      lifecycle.currentGame!.mapObjects!.getAppearance(scene, 'world-map', 'village-chest'),
    ).toMatchObject({ terrain: 'chest', label: 'Chest', blocking: true })
    press('KeyE')
    expect(
      lifecycle.currentGame!.mapObjects!.getAppearance(scene, 'world-map', 'village-chest'),
    ).toMatchObject({ terrain: 'chest-open', label: 'Open chest', blocking: false })
    expect(lifecycle.currentGame!.mapMovement!.canMove(scene, 'world-map', 'north')).toBe(true)
    expect(read('chestOpened')).toEqual({ status: 'resolved', value: true })
    expect(read('coins')).toEqual({ status: 'resolved', value: 25 })
    expect(read('interactionMessage')).toEqual({
      status: 'resolved',
      value: 'You open the chest and find 25 coins.',
    })
    press('KeyE')
    expect(read('interactionMessage')).toEqual({
      status: 'resolved',
      value: 'The chest is empty. You already collected its coins.',
    })
    expect(read('coins')).toEqual({ status: 'resolved', value: 25 })
    walk('KeyA')
    walk('KeyA')
    walk('KeyW')
    walk('KeyD')
    press('KeyE')
    expect(read('coins')).toEqual({ status: 'resolved', value: 25 })
    expect(read('chestOpened')).toEqual({ status: 'resolved', value: true })
    lifecycle.startGame()
    lifecycle.enterScene('exploration', {
      map: 'village',
      mapView: 'world-map',
      position: { x: 1, y: 4 },
    })
    expect(
      lifecycle.currentGame!.mapObjects!.getAppearance(
        lifecycle.activeScene!,
        'world-map',
        'village-chest',
      ),
    ).toMatchObject({ terrain: 'chest', blocking: true })
    expect(read('signRead')).toEqual({ status: 'resolved', value: false })
    expect(read('chestOpened')).toEqual({ status: 'resolved', value: false })
    expect(read('coins')).toEqual({ status: 'resolved', value: 0 })
  })

  it('restores the chest reward, sign state and adjacent player position in a new engine without paying twice', async () => {
    const store = new SampleSaves()
    const first = await launch(store)
    first.press('KeyE')
    first.visitVillage()
    first.walk('KeyD')
    first.press('KeyE')
    expect(first.engine.saves!.save()).toBe(true)
    first.engine.stop()
    const restored = await launch(store)
    expect(restored.engine.saves!.load()).toBe(true)
    restored.advance()
    const lifecycle = restored.engine.lifecycle!
    expect(lifecycle.currentGame!.mapMovement!.playerMap).toBe('village')
    expect(
      lifecycle.currentGame!.mapMovement!.getPosition(lifecycle.activeScene!, 'world-map'),
    ).toEqual({ x: 2, y: 4 })
    expect(restored.read('signRead')).toEqual({ status: 'resolved', value: true })
    expect(restored.read('chestOpened')).toEqual({ status: 'resolved', value: true })
    expect(
      lifecycle.currentGame!.mapObjects!.getAppearance(
        lifecycle.activeScene!,
        'world-map',
        'village-chest',
      ),
    ).toMatchObject({ terrain: 'chest-open', label: 'Open chest', blocking: false })
    restored.press('KeyE')
    expect(restored.read('coins')).toEqual({ status: 'resolved', value: 25 })
    expect(restored.read('interactionMessage')).toEqual({
      status: 'resolved',
      value: 'The chest is empty. You already collected its coins.',
    })
  })

  it('restores a player standing on the opened chest in a new engine and allows walking off it', async () => {
    const store = new SampleSaves()
    const first = await launch(store)
    first.visitVillage()
    first.walk('KeyD')
    first.press('KeyE')
    first.press('KeyW')
    first.advance(200)
    expect(
      first.engine.lifecycle!.currentGame!.mapMovement!.getPosition(
        first.engine.lifecycle!.activeScene!,
        'world-map',
      ),
    ).toEqual({ x: 2, y: 3 })
    expect(first.engine.saves!.save()).toBe(true)
    first.engine.stop()
    const restored = await launch(store)
    expect(restored.engine.saves!.load()).toBe(true)
    restored.advance()
    const lifecycle = restored.engine.lifecycle!
    expect(
      lifecycle.currentGame!.mapMovement!.getPosition(lifecycle.activeScene!, 'world-map'),
    ).toEqual({ x: 2, y: 3 })
    expect(
      lifecycle.currentGame!.mapObjects!.getAppearance(
        lifecycle.activeScene!,
        'world-map',
        'village-chest',
      )?.terrain,
    ).toBe('chest-open')
    restored.walk('KeyS')
    expect(
      lifecycle.currentGame!.mapMovement!.getPosition(lifecycle.activeScene!, 'world-map'),
    ).toEqual({ x: 2, y: 4 })
    restored.press('KeyE')
    expect(restored.read('coins')).toEqual({ status: 'resolved', value: 25 })
  })
})
