import { describe, expect, it, vi } from 'vite-plus/test'
import {
  combatDefinitionSchema,
  gameSchema,
  sceneSchema,
  gameRulesSchema,
  levelingProfileSchema,
} from '@ancadeba/schemas'
import {
  GameCombat,
  GameLifecycle,
  MapStateTransactions,
  assembleGameData,
  type CombatRewardService,
  type CombatLevelingService,
  type CombatStatsService,
  type IGameBindings,
  type EngineMessages,
} from '@ancadeba/game-runtime'
import { MessageBus } from '@ancadeba/utilities'

function fixture() {
  const definition = combatDefinitionSchema.parse({
    'schema-version': '1.0.0',
    id: 'fight',
    label: 'Fight',
    seed: 1,
    player: {
      id: 'player',
      label: 'Player',
      health: { source: 'game.state', path: ['hp'] },
      maximumHealth: 10,
      moves: ['attack'],
      leveling: 'hero',
    },
    enemies: [
      {
        id: 'enemy',
        label: 'Enemy',
        health: { source: 'game.state', path: ['enemyHp'] },
        maximumHealth: 2,
        moves: ['guard'],
        rotation: ['guard'],
      },
    ],
    moves: {
      attack: { type: 'attack', label: 'Attack', damage: { min: 10, max: 10 }, apCost: 1 },
      guard: { type: 'guard', label: 'Guard', guard: 1, apCost: 1 },
    },
    outcomes: { victory: 'fight', defeat: 'fight', escaped: 'fight' },
  })

  const scene = sceneSchema.parse({
    'schema-version': '1.0.0',
    id: 'fight',
    title: 'Fight',
    type: 'game',
    screen: { type: 'grid', grid: { rows: 1, columns: 1 } },
    components: [
      { type: 'combat', id: 'combat', encounter: 'fight', placement: { row: 1, column: 1 } },
    ],
  })

  const data = assembleGameData(
    gameSchema.parse({
      'schema-version': '1.0.0',
      id: 'game',
      title: 'Game',
      version: '1',
      rules: ['values'],
      scenes: ['fight'],
      combat: ['fight'],
      leveling: ['hero'],
      'initial-scene': 'fight',
    }),
    new Map([['fight', scene]]),
    undefined,
    undefined,
    new Map(),
    new Map(),
    undefined,
    new Map([
      [
        'values',
        gameRulesSchema.parse({
          state: [
            { path: ['hp'], value: 10 },
            { path: ['enemyHp'], value: 2 },
            { path: ['xp'], value: 0 },
            { path: ['level'], value: 1 },
          ],
          actions: {},
        }),
      ],
    ]),
    new Map([['fight', definition]]),
    new Map([
      [
        'hero',
        levelingProfileSchema.parse({
          'schema-version': '1.0.0',
          id: 'hero',
          label: 'Hero',
          xp: { source: 'game.state', path: ['xp'] },
          level: { source: 'game.state', path: ['level'] },
          levels: [{ xp: 0 }],
        }),
      ],
    ]),
  )

  const lifecycle = new GameLifecycle(data, {
    createGameState: () => undefined,
    createSceneState: () => undefined,
  })

  lifecycle.startGame()
  const active = lifecycle.enterScene('fight')

  const values = new Map([
    ['hp', 10],
    ['enemyHp', 2],
  ])

  const releaseBindings = vi.fn()

  const bindings: IGameBindings = {
    read: ({ path }) => ({ status: 'resolved', value: values.get(String(path[0])) ?? 0 }),
    subscribeChanges: () => releaseBindings,
  }

  const rewardNotification = vi.fn()
  const releaseRewards = vi.fn()

  const complete = vi.fn(() => rewardNotification)

  const rewards: CombatRewardService = {
    capture: vi.fn(),
    canCommand: vi.fn(() => true),
    execute: vi.fn(),
    complete,
    text: () => '',
    subscribeChanges: () => releaseRewards,
  }

  const releaseLeveling = vi.fn()
  let levelVersion = {}

  const leveling: CombatLevelingService = {
    version: vi.fn(() => levelVersion),
    moveAvailable: vi.fn(() => true),
    text: () => '',
    subscribeChanges: () => releaseLeveling,
  }

  const releaseTemporary = vi.fn()
  let statsVersion = {}

  const acquire = vi.fn(() => true)
  const release = vi.fn()

  const stats: CombatStatsService = {
    setTemporaryEffects: vi.fn(() => releaseTemporary),
    baseSnapshot: vi.fn(),
    encounterIssue: vi.fn(),
    encounterVersion: vi.fn(() => statsVersion),
    acquire,
    release,
  }

  const messages = new MessageBus<EngineMessages>()

  const combat = new GameCombat(
    lifecycle,
    bindings,
    new MapStateTransactions(values, [['hp'], ['enemyHp']]),
    messages,
    () => ({
      progression: { turn: 1, worldTimeMs: 0 },
      isCurrent: () => true,
      commit: () => {},
      notify: () => {},
    }),
    () => {},
    rewards,
    leveling,
    stats,
  )

  return {
    combat,
    acquire,
    release,
    complete,
    active,
    lifecycle,
    messages,
    definition: data.combat!.get('fight')!,
    rewards,
    leveling,
    stats,
    values,
    rewardNotification,
    releaseBindings,
    releaseRewards,
    releaseLeveling,
    releaseTemporary,
    changeStats: () => {
      statsVersion = {}
    },
    changeLeveling: () => {
      levelVersion = {}
    },
    request: (command: Parameters<GameCombat['request']>[2]) => {
      combat.request(active, 'combat', command)
      messages.flush()
    },
  }
}

describe('combat collaborator ports', () => {
  it('accepts structural collaborators, releases encounter locks and completes rewards once', () => {
    const game = fixture()

    try {
      expect(game.combat.snapshot(game.active, 'combat')?.phase).toBe('planning')
      expect(game.acquire).toHaveBeenCalled()
      game.request({ type: 'queue-move', move: 'attack' })
      game.request({ type: 'end-turn' })
      expect(game.values.get('enemyHp')).toBe(0)
      expect(game.release).toHaveBeenCalledWith('fight')
      expect(game.complete).toHaveBeenCalledOnce()
      expect(game.rewardNotification).toHaveBeenCalledOnce()
      game.request({ type: 'end-turn' })
      expect(game.complete).toHaveBeenCalledOnce()
    } finally {
      game.combat.dispose()
      game.lifecycle.dispose()
    }
  })

  it.each(['stats', 'leveling'])(
    'rejects a queued command when %s changes before delivery',
    (changed) => {
      const game = fixture()

      try {
        game.combat.snapshot(game.active, 'combat')
        game.combat.request(game.active, 'combat', { type: 'queue-move', move: 'attack' })

        if (changed === 'stats') game.changeStats()
        else game.changeLeveling()
        game.messages.flush()
        expect(game.combat.snapshot(game.active, 'combat')?.plan).toEqual([])
        expect(game.values.get('enemyHp')).toBe(2)
      } finally {
        game.combat.dispose()
        game.lifecycle.dispose()
      }
    },
  )

  it('releases collaborator subscriptions and temporary-effect hooks exactly once', () => {
    const game = fixture()
    game.combat.dispose()
    game.combat.dispose()
    expect(game.releaseBindings).toHaveBeenCalledOnce()
    expect(game.releaseRewards).toHaveBeenCalledOnce()
    expect(game.releaseLeveling).toHaveBeenCalledOnce()
    expect(game.releaseTemporary).toHaveBeenCalledOnce()
    game.lifecycle.dispose()
  })
})

it('uses the injected leveling eligibility policy', () => {
  const game = fixture()

  try {
    game.leveling.moveAvailable = () => false
    expect(
      game.combat.canCommand(game.active, 'combat', { type: 'queue-move', move: 'attack' }),
    ).toBe(false)
    game.leveling.moveAvailable = () => true
    expect(
      game.combat.canCommand(game.active, 'combat', { type: 'queue-move', move: 'attack' }),
    ).toBe(true)
  } finally {
    game.combat.dispose()
    game.lifecycle.dispose()
  }
})
