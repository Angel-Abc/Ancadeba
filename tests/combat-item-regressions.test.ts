import { expect, it } from 'vite-plus/test'
import { cloneCombatRules, combatDefinitionSchema, inventorySchema } from '@ancadeba/schemas'
import {
  CombatSimulation,
  resolveCombatRound,
  type CombatSimulationSetup,
  type CombatDebugFrame,
  type CombatObservation,
  type PlannedMove,
} from '@ancadeba/game-runtime'

function fixture(scaled = false) {
  const definition = combatDefinitionSchema.parse({
    'schema-version': '1.0.0',
    id: 'items',
    label: 'Items',
    player: {
      id: 'player',
      label: 'Player',
      ap: 3,
      moves: ['fill'],
      health: { source: 'game.state', path: ['hp'] },
      maximumHealth: 100,
    },
    enemies: [
      {
        id: 'enemy',
        label: 'Enemy',
        moves: ['wait'],
        rotation: ['wait'],
        health: { source: 'game.state', path: ['enemy'] },
        maximumHealth: 100,
      },
    ],
    moves: {
      fill: {
        type: 'ability',
        target: 'self',
        label: 'Fill',
        apCost: 1,
        effects: [{ id: 'heal', type: 'heal', amount: 10 }],
      },
      heal: {
        type: 'ability',
        target: 'self',
        label: 'Potion',
        apCost: 1,
        cooldown: 1,
        resourceCosts: scaled ? {} : { mana: 3 },
        effects: [
          {
            id: 'heal',
            type: 'heal',
            amount: scaled ? 15 : 10,
            ...(scaled
              ? {
                  scaling: { terms: [{ type: 'stat', actor: 'self', stat: 'attack', factor: -1 }] },
                }
              : {}),
          },
        ],
      },
      wait: { type: 'guard', label: 'Wait', apCost: 1, guard: 0 },
    },
    itemUse: { owner: 'diver', itemTypes: ['potion'] },
    statuses: {
      focus: { type: 'modifier', label: 'Focus', duration: 2, modifiers: { attack: 10 } },
    },
    mechanics: { resources: { mana: { initial: 10, maximum: 10 } } },
  })

  const inventory = inventorySchema.parse({
    'schema-version': '1.0.0',
    owners: { diver: { label: 'Diver' } },
    itemTypes: {
      potion: {
        label: 'Potion',
        use: {
          ability: { library: 'common', id: 'heal' },
          contexts: ['combat'],
          consumption: 'consume',
        },
      },
    },
    items: { bottle: { itemType: 'potion', placement: { type: 'carried', owner: 'diver' } } },
  })

  const setup: CombatSimulationSetup = {
    health: { player: 90, enemy: 100 },
    maximumHealth: { player: 100, enemy: 100 },
    itemContext: { inventory },
    ...(scaled ? { statuses: { player: [{ id: 'focus', source: 'player', remaining: 2 }] } } : {}),
  }

  return { definition, setup }
}

const potion: PlannedMove = {
  move: 'heal',
  target: 'player',
  item: 'bottle',
  itemType: 'potion',
  consume: true,
}

function resolve(
  definition: ReturnType<typeof fixture>['definition'],
  setup: CombatSimulationSetup,
  plan: PlannedMove[],
) {
  const current = {
    ...setup,
    guard: {},
    seed: 1024,
    escape: false,
    plan,
    enemies: { enemy: { moves: [], startCursor: 0, cursor: 0 } },
  }

  const before = cloneCombatRules({ definition, current })
  const frames: CombatDebugFrame[] = []
  const observations: CombatObservation[] = []

  const result = resolveCombatRound(
    definition,
    current,
    (frame) => {
      frames.push(frame)
    },
    (observation) => {
      observations.push(observation)
    },
  )

  expect({ definition, current }).toEqual(before)

  return { result, frames, observations }
}

it('keeps an ineffective healing item even when its ability has a resource cost', () => {
  const { definition, setup } = fixture()
  const sim = new CombatSimulation(definition, setup)
  sim.queue('fill')
  sim.queue('heal', undefined, 'bottle')
  const result = sim.resolve()
  expect(result.health.player).toBe(100)
  expect({
    usedItems: result.usedItems,
    mana: result.mechanics!.resources.mana,
    cooldown: result.cooldowns.player?.heal,
  }).toEqual({ usedItems: [], mana: 10, cooldown: undefined })
})

it('keeps the same ineffective healing item when it has no resource cost', () => {
  const { definition, setup } = fixture()
  definition.moves.heal!.resourceCosts = {}
  const sim = new CombatSimulation(definition, setup)
  sim.queue('fill')
  sim.queue('heal', undefined, 'bottle')
  const result = sim.resolve()
  expect(result.usedItems).toEqual([])
  expect(result.mechanics!.resources.mana).toBe(10)
  expect(result.cooldowns.player?.heal).toBeUndefined()
})

it('refunds AP and discards provisional trigger receipts, observations, and trace frames', () => {
  const { definition, setup } = fixture()
  definition.mechanics!.triggers.receipt = {
    event: 'resource-changed',
    resource: 'mana',
    conditions: [],
    once: true,
    charges: 1,
    perTurn: 1,
    cooldown: 1,
    effects: [{ type: 'heal', actor: 'player', amount: 0 }],
  }

  const { result, frames, observations } = resolve(definition, setup, [
    { move: 'fill', target: 'player' },
    potion,
  ])

  expect(result.mechanics).toMatchObject({ resources: { mana: 10 }, fired: [] })
  expect(result.mechanics!.activations).toBeUndefined()
  expect(result.usedItems).toEqual([])
  expect(result.cooldowns.player?.heal).toBeUndefined()
  expect(frames.find((frame) => frame.action?.item === 'bottle')).toMatchObject({
    spentAp: 1,
    mechanics: { resources: { mana: 10 } },
  })
  expect(frames.some((frame) => frame.mechanicsEvent?.trigger === 'receipt')).toBe(false)
  expect(
    frames.flatMap((frame) => frame.entries).some((entry) => entry.type === 'resourceChanged'),
  ).toBe(false)
  expect(observations.filter((entry) => entry.kind === 'healing-total')).toHaveLength(1)
  expect(observations.some((entry) => entry.kind === 'item-use')).toBe(false)
  expect(
    observations.some(
      (entry) =>
        entry.kind === 'action-choices' && entry.move === 'heal' && entry.result === 'executed',
    ),
  ).toBe(false)
})

it('restores payment when a resource-scaled item becomes ineffective after paying its cost', () => {
  const { definition, setup } = fixture()
  const heal = definition.moves.heal!

  if (heal.type !== 'ability') throw new Error('Expected ability')
  heal.resourceCosts = { mana: 10 }
  heal.effects = [
    {
      id: 'heal',
      type: 'heal',
      amount: 0,
      scaling: {
        terms: [{ type: 'resource', resource: 'mana', factor: 1 }],
      },
    },
  ]
  const sim = new CombatSimulation(definition, setup)
  expect(sim.queueIssue('heal', undefined, 'bottle')).toBeUndefined()
  sim.queue('heal', undefined, 'bottle')
  const result = sim.resolve()
  expect(result.health.player).toBe(90)
  expect(result.usedItems).toEqual([])
  expect(result.mechanics!.resources.mana).toBe(10)
  expect(result.cooldowns.player?.heal).toBeUndefined()
})

it('retains real resource-changing item effects and their costs', () => {
  const { definition, setup } = fixture()
  const heal = definition.moves.heal!

  if (heal.type !== 'ability') throw new Error('Expected ability')
  heal.effects = [{ id: 'mana', type: 'change-resource', resource: 'mana', amount: 2 }]
  const sim = new CombatSimulation(definition, { ...setup, resources: { mana: 5 } })
  sim.queue('heal', undefined, 'bottle')
  const result = sim.resolve()
  expect(result.usedItems).toEqual(['bottle'])
  expect(result.mechanics!.resources.mana).toBe(4)
  expect(result.cooldowns.player?.heal).toBe(3)
})

it.each(['damage', 'finish'] as const)(
  'retains a meaningful %s reaction to payment',
  (reaction) => {
    const { definition, setup } = fixture()
    definition.mechanics!.triggers.react = {
      event: 'resource-changed',
      resource: 'mana',
      conditions: [],
      once: true,
      effects:
        reaction === 'damage'
          ? [{ type: 'damage', actor: 'enemy', source: 'player', amount: 2 }]
          : [{ type: 'finish', outcome: 'victory' }],
    }

    const { result, observations } = resolve(definition, setup, [
      { move: 'fill', target: 'player' },
      potion,
    ])

    expect(result.usedItems).toEqual(['bottle'])
    expect(result.mechanics!.resources.mana).toBe(7)
    expect(result.mechanics!.fired).toEqual(['react'])
    expect(observations.filter((entry) => entry.kind === 'item-use')).toHaveLength(1)

    if (reaction === 'damage') {
      expect(result.health.enemy).toBe(98)
      expect(result.cooldowns.player?.heal).toBe(3)
    } else expect(result.outcome).toBe('victory')
  },
)

it('restores RNG when a paid damage item has no effect', () => {
  const { definition, setup } = fixture()
  const heal = definition.moves.heal!

  if (heal.type !== 'ability') throw new Error('Expected ability')
  heal.target = 'enemy'
  heal.effects = [{ id: 'damage', type: 'damage', damage: { min: 1, max: 10 } }]

  const current = {
    ...setup,
    stats: { enemy: { attack: 0, defense: 100, guard: 0, maximumHealth: 100 } },
  }

  const { result } = resolve(definition, current, [{ ...potion, target: 'enemy' }])
  expect(result.usedItems).toEqual([])
  expect(result.seed).toBe(1024)
  expect(result.mechanics!.resources.mana).toBe(10)
  expect(result.health.enemy).toBe(100)
})

it.each([
  ['omitted', undefined],
  ['empty', {}],
  ['explicit zero', { player: { attack: 0, defense: 0, guard: 0, maximumHealth: 100 } }],
] as const)('applies temporary stats once with %s base stats', (_name, stats) => {
  for (const percent of [0, 50]) {
    const { definition, setup } = fixture(true)
    const focus = definition.statuses!.focus!

    if (focus.type !== 'modifier') throw new Error('Expected modifier')
    focus.percentModifiers = { attack: percent }
    const heal = definition.moves.heal!

    if (heal.type !== 'ability' || heal.effects[0]!.type !== 'heal')
      throw new Error('Expected heal')
    heal.effects[0]!.amount = percent ? 20 : 15
    const configured = { ...setup, ...(stats === undefined ? {} : { stats }) }
    const before = cloneCombatRules({ definition, setup: configured })
    const { result } = resolve(definition, configured, [potion])
    expect(result.health.player).toBe(95)
    const sim = new CombatSimulation(definition, configured)
    expect(sim.queueIssue('heal', undefined, 'bottle')).toBeUndefined()
    sim.queue('heal', undefined, 'bottle')
    expect(sim.resolve().health.player).toBe(95)
    expect({ definition, setup: configured }).toEqual(before)
  }
})

it('still rejects stat-scaled items that actually have no effect with omitted base stats', () => {
  const { definition, setup } = fixture(true)
  const heal = definition.moves.heal!

  if (heal.type !== 'ability' || heal.effects[0]!.type !== 'heal') throw new Error('Expected heal')
  heal.effects[0]!.amount = 10
  expect(resolve(definition, setup, [potion]).result.health.player).toBe(90)
  expect(new CombatSimulation(definition, setup).queueIssue('heal', undefined, 'bottle')).toBe(
    'Item would have no effect',
  )
})
